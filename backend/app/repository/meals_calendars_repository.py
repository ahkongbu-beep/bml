from app.models.meals_calendar import MealsCalendars
from app.models.categories_codes import CategoriesCodes
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.models.feeds_tags import FeedsTags
from app.models.feeds_images import FeedsImages
from app.models.meals_likes import MealsLikes
from app.models.users import Users
from sqlalchemy import func as sql_func
from app.models.users_childs import UsersChilds
from app.models.users_childs_allergies import UserChildAllergy

class MealsCalendarsRepository:

    @staticmethod
    def find_by_view_hash(session, view_hash: str):
        return session.query(MealsCalendars).filter(
            MealsCalendars.view_hash == view_hash
        ).first()

    @staticmethod
    def get_calendar_by_id(session, calendar_id: int):
        return session.query(MealsCalendars).filter(
            MealsCalendars.id == calendar_id
        ).first()

    @staticmethod
    def create(session, params, is_commit=True):

        try:
            meal_calendar = MealsCalendars(
                category_code=params.get("category_code", 0),
                refer_feed_id=params.get("refer_feed_id", 0),
                user_id=params.get("user_id", 0),
                meal_stage=params.get("meal_stage", 0),
                meal_stage_detail=params.get("meal_stage_detail", ""),
                is_pre_made=params.get("is_pre_made", "N"),
                is_public=params.get("is_public", "N"),
                is_active=params.get("is_active", "Y"),
                view_count=params.get("view_count", 0),
                like_count=params.get("like_count", 0),
                meal_condition=params.get("meal_condition", ""),
                contents=params.get("contents", ""),
                month=params.get("month", ""),
                input_date=params.get("input_date"),
                view_hash=params.get("view_hash", ""),
                child_id=params.get("child_id", 0)
            )
            session.add(meal_calendar)
            if is_commit:
                session.commit()
            else:
                session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음
            return meal_calendar
        except Exception as e:
            session.rollback()
            raise e

    @staticmethod
    def update(session, params, where_clause: dict, is_commit=True):
        try:
            session.query(MealsCalendars).filter_by(**where_clause).update(params)
            if is_commit:
                session.commit()
            else:
                session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음
            return True
        except Exception as e:
            session.rollback()
            raise e


    @staticmethod
    def findByUserIdAndDate(session, user_id: int, input_date: str, child_id: int, category_code: int = None):

        query = session.query(MealsCalendars).filter(
            MealsCalendars.user_id == user_id,
            MealsCalendars.child_id == child_id,
            MealsCalendars.input_date == input_date
        )

        if category_code is not None:
            query = query.filter(MealsCalendars.category_code == category_code)

        return query.all()

    @staticmethod
    def get_list(session, params, extra=None):
        from sqlalchemy import case, func as sql_func

        if extra is None:
            extra = {}

        # 페이징 처리
        limit = extra.get("limit", 20)
        offset = extra.get("offset", 0)

        order_by = MealsCalendars.created_at.desc()
        if extra.get("order_by") == "created_at_asc":
            order_by = MealsCalendars.created_at.asc()
        elif extra.get("order_by") == "created_at_desc":
            order_by = MealsCalendars.created_at.desc()
        else:
            order_by = sql_func.concat(MealsCalendars.input_date, MealsCalendars.category_code).asc()

        # 서브쿼리: category_code 정보
        category_subquery = (
            session.query(
                CategoriesCodes.id.label('category_id'),
                CategoriesCodes.code,
                CategoriesCodes.value.label('category_name')
            )
            .subquery()
        )

        image_subquery = (
            session.query(
                FeedsImages.img_model_id.label("meal_id"),
                sql_func.min(FeedsImages.image_url).label("image_url")
            )
            .filter(FeedsImages.img_model == "Meals")
            .group_by(FeedsImages.img_model_id)
            .subquery()
        )

        from sqlalchemy import distinct

        # 대표 자녀 정보 + 알레르기 정보 서브쿼리 (통합)
        user_childs_subquery = (
            session.query(
                UsersChilds.user_id,
                sql_func.max(UsersChilds.child_name).label('child_name'),
                sql_func.max(UsersChilds.child_birth).label('child_birth'),
                sql_func.max(UsersChilds.child_gender).label('child_gender'),
                sql_func.max(UsersChilds.is_agent).label('is_agent'),
                sql_func.group_concat(
                    distinct(UserChildAllergy.allergy_name)
                ).label("allergy_names"),
                sql_func.group_concat(
                    distinct(UserChildAllergy.allergy_code)
                ).label("allergy_codes")
            )
            .outerjoin(UserChildAllergy, UserChildAllergy.child_id == UsersChilds.id)
            .filter(UsersChilds.is_agent == 'Y')
            .group_by(UsersChilds.user_id)
            .subquery()
        )

        # feeds_tags_mappers 테이블과 조인하여 태그 정보도 함께 조회
        tags_mappers_subquery = (
            session.query(
                FeedsTagsMapper.feed_id,
                sql_func.group_concat(FeedsTags.name).label('tags')
            )
            .join(FeedsTags, FeedsTagsMapper.tag_id == FeedsTags.id)
            .filter(FeedsTagsMapper.model == "Meals")
            .group_by(FeedsTagsMapper.feed_id)
            .subquery()
        )

        query = (
            session.query(
                MealsCalendars.id,
                MealsCalendars.view_hash.label("view_hash"),
                MealsCalendars.title,
                MealsCalendars.refer_feed_id,
                MealsCalendars.contents,
                MealsCalendars.input_date,
                MealsCalendars.month,
                MealsCalendars.view_count,
                MealsCalendars.like_count,
                MealsCalendars.is_pre_made,
                MealsCalendars.is_public,
                MealsCalendars.meal_condition,
                MealsCalendars.meal_stage,
                MealsCalendars.meal_stage_detail,
                MealsCalendars.category_code.label("category_id"),
                category_subquery.c.category_name.label("category_name"),
                image_subquery.c.image_url.label("image_url"),
                tags_mappers_subquery.c.tags.label("mapped_tags"),
                Users.id.label("user_id"),
                Users.nickname,
                Users.profile_image,
                Users.view_hash.label("user_hash"),
                user_childs_subquery.c.child_name,
                user_childs_subquery.c.child_birth,
                user_childs_subquery.c.child_gender,
                user_childs_subquery.c.allergy_names,
                user_childs_subquery.c.allergy_codes,
                user_childs_subquery.c.is_agent,
                case(
                    (MealsLikes.id.isnot(None), True),
                    else_=False
                ).label("is_liked"),
            )
            .join(Users, MealsCalendars.user_id == Users.id)
            .join(
                MealsLikes,
                (MealsCalendars.id == MealsLikes.meal_id) &
                (MealsLikes.user_id == params.get("my_user_id")),
                isouter=True
            )
            .outerjoin(category_subquery, MealsCalendars.category_code == category_subquery.c.category_id)
            .outerjoin(image_subquery, MealsCalendars.id == image_subquery.c.meal_id)
            .outerjoin(user_childs_subquery, MealsCalendars.user_id == user_childs_subquery.c.user_id)
            .outerjoin(tags_mappers_subquery, MealsCalendars.id == tags_mappers_subquery.c.feed_id)
        )

        def eq(column, key):
            value = params.get(key)
            if value is None or value == "" or value == 0:
                return None
            return column == value

        conditions = list(filter(None, [
            eq(MealsCalendars.is_public, "is_public"),
            eq(MealsCalendars.category_code, "category_id"),
            eq(MealsCalendars.is_active, "is_active"),
            eq(MealsCalendars.meal_stage, "meal_stage"),
            eq(MealsCalendars.meal_stage_detail, "meal_stage_detail"),
            eq(MealsCalendars.month, "month"),
            eq(MealsCalendars.child_id, "child_id"),
            MealsCalendars.user_id == params["my_user_id"] if params.get("view_type") == "mine" else None,
            ~MealsCalendars.user_id.in_(params["deny_user_ids"]) if params.get("deny_user_ids") else None,
            MealsCalendars.id < params["cursor"] if params.get("cursor") else None,
        ]))

        # target_user_id가 있으면 해당 사용자의 피드만 조회
        if params.get("target_user_id"):
            query = query.filter(MealsCalendars.user_id == params["target_user_id"])
        elif params.get("type") != "list" and params.get("user_id"):
            query = query.filter(MealsCalendars.user_id == params["user_id"])

        if params.get("start_date") and params.get("end_date"):
            query = query.filter(MealsCalendars.created_at.between(params["start_date"], params["end_date"]))

        query = query.filter(*conditions)

        result = query.order_by(order_by).offset(offset).limit(limit).all()

        return QueryResult(result)

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.meals_schemas import MealsCalendarResponse
        from app.schemas.feeds_schemas import FeedsUserResponse
        from app.schemas.users_schemas import UserChildItemSchema, AllergyItemSchema

        return [
            MealsCalendarResponse(
                id=v.id,
                title=v.title,
                contents=v.contents,
                input_date=f"{v.input_date.year}-{v.input_date.month}-{v.input_date.day}",
                month=v.month,
                refer_feed_id=v.refer_feed_id,
                image_url=v.image_url if v.image_url else None,
                category_id=v.category_id,
                category_name=v.category_name,
                is_pre_made=v.is_pre_made,
                view_count=v.view_count,
                like_count=v.like_count if v.like_count else 0,
                meal_condition=v.meal_condition,
                is_liked=v.is_liked,
                is_public=v.is_public,
                meal_stage=v.meal_stage,
                meal_stage_detail=v.meal_stage_detail,
                mapped_tags=v.mapped_tags.split(',') if v.mapped_tags else [],
                user=FeedsUserResponse(
                    id=v.user_id,
                    nickname=v.nickname,
                    profile_image=v.profile_image if v.profile_image else None,
                    user_hash=v.user_hash
                ),
                childs=UserChildItemSchema(
                    child_name=v.child_name,
                    child_birth=v.child_birth,
                    child_gender=v.child_gender,
                    is_agent=v.is_agent,
                    allergies=[
                        AllergyItemSchema(
                            allergy_code=code.strip() if code else None,
                            allergy_name=name.strip()
                        )
                        for code, name in zip(
                            v.allergy_codes.split(',') if v.allergy_codes else [],
                            v.allergy_names.split(',') if v.allergy_names else []
                        )
                    ] if v.allergy_names else []
                ),
                view_hash=v.view_hash
            )
            for v in self._results
        ]

    def toJSON(self):
        """JSON 문자열 반환"""
        import json
        return json.dumps(self.toDict(), ensure_ascii=False, default=str)

    def getRawData(self):
        """원본 SQLAlchemy 객체 반환"""
        return self._results