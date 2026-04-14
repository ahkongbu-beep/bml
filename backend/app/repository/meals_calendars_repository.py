from sqlalchemy import func

from app.models.meals_calendar import MealsCalendars
from app.models.categories_codes import CategoriesCodes
from app.models.ingredients_mappers import IngredientsMappers
from app.models.ingredients import Ingredients
from app.models.attaches_files import AttachesFiles
from app.models.meals_likes import MealsLikes
from app.models.users import Users
from app.models.users_childs import UsersChilds
from app.models.users_childs_allergies import UsersChildsAllergies

class MealsCalendarsRepository:
    @staticmethod
    def get_deleted_meals(db, is_active: str, search_date: str, target_id: int):
        query = db.query(MealsCalendars)

        if target_id:
            query = query.filter(MealsCalendars.id == target_id)
        else:
            query = query.filter(
                MealsCalendars.is_active == is_active,
                MealsCalendars.deleted_at < search_date
            )
        return query.all()

    @staticmethod
    def get_calendars_by_user_id(session, user_id: int):
        return session.query(MealsCalendars).filter(
            MealsCalendars.user_id == user_id,
            MealsCalendars.is_active == "Y"
        ).all()

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
    def soft_delete(session, meal_calendar, is_commit=True):
        try:
            meal_calendar.is_active = "N"
            meal_calendar.deleted_at = func.now()
            if is_commit:
                session.commit()
            else:
                session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음
            return True
        except Exception as e:
            session.rollback()
            raise e

    @staticmethod
    def hard_delete_meal(session, meal_calendar):
        try:
            session.delete(meal_calendar)
            return True
        except Exception as e:
            session.rollback()
            raise e

    @staticmethod
    def findByUserIdAndDate(session, user_id: int, input_date: str, child_id: int, category_code: int = None):

        query = session.query(MealsCalendars).filter(
            MealsCalendars.user_id == user_id,
            MealsCalendars.child_id == child_id,
            MealsCalendars.input_date == input_date,
            MealsCalendars.is_active == "Y"
        )

        if category_code is not None:
            query = query.filter(MealsCalendars.category_code == category_code)

        return query.all()

    @staticmethod
    def build_base_query(session, params, include=None, base_query=None):
        from sqlalchemy import case, func as sql_func, distinct, literal

        if include is None:
            include = []

        query = base_query if base_query is not None else session.query(MealsCalendars)

        if params.get("my_user_id") or "is_liked" in include:
            if params.get("my_user_id"):
                query = query.outerjoin(
                    MealsLikes,
                    (MealsCalendars.id == MealsLikes.meal_id) &
                    (MealsLikes.user_id == params["my_user_id"])
                ).add_columns(
                    case(
                        (MealsLikes.id.isnot(None), True),
                        else_=False
                    ).label("is_liked")
                )
            else:
                query = query.add_columns(literal(False).label("is_liked"))

        if "user" in include:
            query = query.join(Users, MealsCalendars.user_id == Users.id).add_columns(
                Users.id.label("user_id"),
                Users.name.label("username"),
                Users.nickname.label("nickname"),
                Users.profile_image.label("profile_image"),
                Users.view_hash.label("user_hash"),
            )

        if "category" in include:
            category_subquery = (
                session.query(
                    CategoriesCodes.id.label('category_id'),
                    CategoriesCodes.value.label('category_name')
                ).subquery()
            )

            query = query.add_columns(category_subquery.c.category_name)
            query = query.outerjoin(
                category_subquery,
                MealsCalendars.category_code == category_subquery.c.category_id
            )

        if "image" in include:
            image_subquery = (
                session.query(
                    AttachesFiles.img_model_id.label("meal_id"),
                    sql_func.min(AttachesFiles.image_url).label("image_url")
                )
                .filter(
                    AttachesFiles.img_model == "Meals",
                    AttachesFiles.is_active == "Y"
                )
                .group_by(AttachesFiles.img_model_id)
                .subquery()
            )

            query = query.add_columns(image_subquery.c.image_url)
            query = query.outerjoin(
                image_subquery,
                MealsCalendars.id == image_subquery.c.meal_id
            )

        if "tags" in include:
            tags_subquery = (
                session.query(
                    IngredientsMappers.meal_id.label("meal_id"),
                    sql_func.group_concat(IngredientsMappers.score).label('mapped_scores'),
                    sql_func.group_concat(Ingredients.name).label('mapped_tags'),
                    sql_func.group_concat(Ingredients.id).label('mapped_ids')
                )
                .join(Ingredients, IngredientsMappers.ingredient_id == Ingredients.id)
                .group_by(IngredientsMappers.meal_id)
                .subquery()
            )

            query = query.add_columns(tags_subquery.c.mapped_tags, tags_subquery.c.mapped_scores, tags_subquery.c.mapped_ids)
            query = query.outerjoin(
                tags_subquery,
                MealsCalendars.id == tags_subquery.c.meal_id
            )

        if "child" in include:
            user_childs_subquery = (
                session.query(
                    UsersChilds.user_id,
                    sql_func.max(UsersChilds.id).label('agent_child_id'),
                    sql_func.max(UsersChilds.child_name).label('child_name'),
                    sql_func.max(UsersChilds.child_birth).label('child_birth'),
                    sql_func.max(UsersChilds.child_gender).label('child_gender'),
                    sql_func.max(UsersChilds.is_agent).label('is_agent'),
                    sql_func.group_concat(
                        distinct(UsersChildsAllergies.allergy_name)
                    ).label("allergy_names"),
                    sql_func.group_concat(
                        distinct(UsersChildsAllergies.allergy_code)
                    ).label("allergy_codes"),
                )
                .outerjoin(
                    UsersChildsAllergies,
                    UsersChildsAllergies.child_id == UsersChilds.id
                )
                .filter(UsersChilds.is_agent == 'Y')
                .group_by(UsersChilds.user_id)
                .subquery()
            )

            query = query.add_columns(
                user_childs_subquery.c.agent_child_id,
                user_childs_subquery.c.child_name,
                user_childs_subquery.c.child_birth,
                user_childs_subquery.c.child_gender,
                user_childs_subquery.c.is_agent,
                user_childs_subquery.c.allergy_names,
                user_childs_subquery.c.allergy_codes,
            )

            query = query.outerjoin(
                user_childs_subquery,
                MealsCalendars.user_id == user_childs_subquery.c.user_id
            )
        return query

    @staticmethod
    def apply_filters(session, query, params):
        def eq(col, key):
            val = params.get(key)
            if val in [None, "", 0]:
                return None
            return col == val

        conditions = [
            eq(MealsCalendars.is_public, "is_public"),
            eq(MealsCalendars.category_code, "category_id"),
            eq(MealsCalendars.is_active, "is_active"),
            eq(MealsCalendars.meal_stage, "meal_stage"),
            eq(MealsCalendars.meal_stage_detail, "meal_stage_detail"),
            eq(MealsCalendars.month, "month"),
            eq(MealsCalendars.child_id, "child_id"),

            MealsCalendars.user_id == params["my_user_id"]
            if params.get("view_type") == "mine" else None,

            ~MealsCalendars.user_id.in_(params["deny_user_ids"])
            if params.get("deny_user_ids") else None,

            MealsCalendars.id < params["cursor"]
            if params.get("cursor") else None,
        ]

        # 날짜
        if params.get("created_at_start") and params.get("created_at_end"):
            conditions.append(
                MealsCalendars.created_at.between(
                    params["created_at_start"],
                    params["created_at_end"]
                )
            )

        if params.get("updated_at_start") and params.get("updated_at_end"):
            conditions.append(
                MealsCalendars.updated_at.between(
                    params["updated_at_start"],
                    params["updated_at_end"]
                )
            )

        if params.get("deleted_at_start") and params.get("deleted_at_end"):
            conditions.append(
                MealsCalendars.deleted_at.between(
                    params["deleted_at_start"],
                    params["deleted_at_end"]
                )
            )

        # target_user
        if params.get("target_user_id"):
            conditions.append(MealsCalendars.user_id == params["target_user_id"])

        if params.get("ingredient_ids"):
            from sqlalchemy import exists as sa_exists
            ingredient_ids = params["ingredient_ids"]
            conditions.append(
                sa_exists().where(
                    IngredientsMappers.meal_id == MealsCalendars.id,
                    IngredientsMappers.ingredient_id.in_(ingredient_ids)
                )
            )

        return query.filter(*[c for c in conditions if c is not None])

    @staticmethod
    def get_count(session, params):
        query = MealsCalendarsRepository.build_base_query(session, params)
        query = MealsCalendarsRepository.apply_filters(session, query, params)
        return query.count()

    @staticmethod
    def get_meals_list(session, params, extra=None):
        if extra is None:
            extra = {}

        effective_params = dict(params or {})

        include = extra.get("include", [])

        if extra.get("limit") is not None and effective_params.get("limit") is None:
            effective_params["limit"] = extra.get("limit")
        if extra.get("offset") is not None and effective_params.get("offset") is None:
            effective_params["offset"] = extra.get("offset")

        # 기존 get_list 스타일(created_at_desc/created_at_asc)도 허용
        extra_order_by = extra.get("order_by")
        if extra_order_by and effective_params.get("order_by") is None:
            if extra_order_by in ["created_at_desc", "created_at_asc", "id_desc", "id_asc"]:
                field, direction = extra_order_by.rsplit("_", 1)
                effective_params["order_by"] = field
                effective_params["order_direction"] = direction
            else:
                effective_params["order_by"] = extra_order_by

        # params로 들어온 order_by가 *_asc|*_desc 형태여도 파싱
        raw_order_by = effective_params.get("order_by")
        if isinstance(raw_order_by, str) and raw_order_by.endswith(("_asc", "_desc")):
            field, direction = raw_order_by.rsplit("_", 1)
            effective_params["order_by"] = field
            if effective_params.get("order_direction") is None:
                effective_params["order_direction"] = direction

        query = MealsCalendarsRepository.build_base_query(session, effective_params, include)

        # 모델 컬럼 목록 가져오기
        query = MealsCalendarsRepository.apply_filters(session, query, effective_params)

        # 정렬
        order_by = effective_params.get("order_by", "id")
        order_direction = effective_params.get("order_direction", "desc")

        # 식재료 필터가 있을 때: 매칭 수 많은 순으로 우선 정렬
        if effective_params.get("ingredient_ids"):
            from sqlalchemy import func as sql_func, select as sa_select
            ingredient_ids = effective_params["ingredient_ids"]
            match_count = (
                sa_select(sql_func.count())
                .where(
                    IngredientsMappers.meal_id == MealsCalendars.id,
                    IngredientsMappers.ingredient_id.in_(ingredient_ids)
                )
                .correlate(MealsCalendars)
                .scalar_subquery()
            )
            query = query.order_by(match_count.desc())

        if hasattr(MealsCalendars, order_by):
            col = getattr(MealsCalendars, order_by)
            query = query.order_by(col.desc() if order_direction == "desc" else col.asc())
        else:
            query = query.order_by(MealsCalendars.id.desc())

        # 페이징
        if effective_params.get("offset") is not None and effective_params.get("limit") is not None:
            query = query.offset(effective_params["offset"]).limit(effective_params["limit"])

        return query.all()