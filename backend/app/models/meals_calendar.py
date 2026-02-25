from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, func as sql_func,
    UniqueConstraint, Index
)
from app.core.database import Base
from app.models.users import Users
from app.models.categories_codes import CategoriesCodes
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.models.feeds_tags import FeedsTags
from app.models.feeds_images import FeedsImages
from app.core.config import settings
from app.libs.hash_utils import generate_sha256_hash

class MealsCalendars(Base):
    __tablename__ = "meals_calendars"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_code = Column(Integer, nullable=False, default=0, comment="카테고리의 식사 구분 pk")
    refer_feed_id = Column(Integer, nullable=False, default=0, comment="참조한 피드 pk")
    user_id = Column(Integer, nullable=False, default=0, comment="요청 user.pk")
    title = Column(String(255), nullable=True, default="", comment="식사제목")
    contents = Column(Text, nullable=True, comment="설명")
    month = Column(String(7), nullable=False, default="", comment="YYYY-MM")
    input_date = Column(Date, nullable=False, comment="식사일")
    is_pre_made = Column(String(2), nullable=False, default="N", comment="기성품 여부 Y/N")
    is_public = Column(String(2), nullable=False, default="N", comment="공개 여부 Y/N")
    meal_condition = Column(String(2), nullable=True, default="", comment="식사 상태")
    created_at = Column(DateTime, server_default=sql_func.now(), comment="등록일")
    view_hash = Column(String(255), nullable=False, default="", comment="뷰 해시")

    # 인덱스 & 유니크키
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "input_date",
            "category_code",
            name="uniq_user_date_type"
        ),
        Index("idx_month", "month"),
        Index("idx_user_date", "user_id", "input_date"),
        Index("idx_input_date", "input_date"),
        Index("idx_user", "user_id"),
    )

    @staticmethod
    def create_hash(session, user_id: int, input_date: str, category_code: int):
        tmp_hash = generate_sha256_hash(user_id, input_date, category_code, settings.SECRET_KEY)

        findByHash = MealsCalendars.find_by_view_hash(session, tmp_hash)
        if findByHash:
            return False

        return tmp_hash

    @staticmethod
    def find_by_view_hash(session, view_hash: str):
        return session.query(MealsCalendars).filter(
            MealsCalendars.view_hash == view_hash
        ).first()

    @staticmethod
    def create(session, params, is_commit=True):

        try:
            if not params.get("view_hash"):
                # view_hash는 "meal_{user_id}_{input_date}_{category_code}" 형식으로 생성
                view_hash = MealsCalendars.create_hash(session, params.get("user_id", 0), params.get("input_date", ""), params.get("category_code", 0))
                if not view_hash:
                    raise ValueError("이미 존재하는 view_hash입니다. 다시 시도해주세요.")

                params["view_hash"] = view_hash

            meal_calendar = MealsCalendars(
                category_code=params.get("category_code", 0),
                refer_feed_id=params.get("refer_feed_id", 0),
                user_id=params.get("user_id", 0),
                is_pre_made=params.get("is_pre_made", "N"),
                is_public=params.get("is_public", "N"),
                meal_condition=params.get("meal_condition", ""),
                contents=params.get("contents", ""),
                month=params.get("month", ""),
                input_date=params.get("input_date"),
                view_hash=params.get("view_hash", "")
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
    def findByUserIdAndDate(session, user_id: int, input_date: str, category_code: int = None):

        query = session.query(MealsCalendars).filter(
            MealsCalendars.user_id == user_id,
            MealsCalendars.input_date == input_date
        )

        if category_code is not None:
            query = query.filter(MealsCalendars.category_code == category_code)

        return query.all()

    @staticmethod
    def get_list(session, params):
        if 'user_id' not in params or not params['user_id']:
            raise ValueError("user_id는 필수 항목입니다.")

        # 서브쿼리: 각 피드의 태그들을 콤마로 연결
        subquery = (
            session.query(
                FeedsTagsMapper.feed_id,
                sql_func.group_concat(FeedsTags.name).label('tags')
            )
            .join(FeedsTags, FeedsTagsMapper.tag_id == FeedsTags.id)
            .filter(FeedsTagsMapper.model == "MealsCalendar")
            .group_by(FeedsTagsMapper.feed_id)
            .subquery()
        )

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
                MealsCalendars.view_hash.label("view_hash"),
                MealsCalendars.title,
                MealsCalendars.refer_feed_id,
                MealsCalendars.contents,
                MealsCalendars.input_date,
                MealsCalendars.month,
                MealsCalendars.is_pre_made,
                MealsCalendars.is_public,
                MealsCalendars.meal_condition,
                category_subquery.c.category_id.label("category_id"),
                category_subquery.c.category_name.label("category_name"),
                image_subquery.c.image_url.label("image_url"),
                subquery.c.tags.label("tags"),
                tags_mappers_subquery.c.tags.label("mapped_tags"),
                Users.nickname,
                Users.profile_image,
                Users.view_hash.label("user_hash")
            )
            .join(Users, MealsCalendars.user_id == Users.id)
            .outerjoin(category_subquery, MealsCalendars.category_code == category_subquery.c.category_id)
            .outerjoin(subquery, MealsCalendars.id == subquery.c.feed_id)
            .outerjoin(image_subquery, MealsCalendars.id == image_subquery.c.meal_id)
            .outerjoin(tags_mappers_subquery, MealsCalendars.id == tags_mappers_subquery.c.feed_id)
        )

        if params.get("user_id"):
            query = query.filter(MealsCalendars.user_id == params["user_id"])

        if params.get("month"):
            query = query.filter(MealsCalendars.month == params["month"])

        result = query.order_by(
            MealsCalendars.input_date.asc(),
            MealsCalendars.category_code.asc()
        ).all()
        return QueryResult(result)

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.meals_schemas import MealsCalendarResponse
        from app.schemas.feeds_schemas import FeedsUserResponse

        return [
            MealsCalendarResponse(
                title=v.title,
                contents=v.contents,
                input_date=f"{v.input_date.year}-{v.input_date.month}-{v.input_date.day}",
                month=v.month,
                refer_feed_id=v.refer_feed_id,
                image_url=v.image_url if v.image_url else None,
                category_id=v.category_id,
                category_name=v.category_name,
                is_pre_made=v.is_pre_made,
                meal_condition=v.meal_condition,
                is_public=v.is_public,
                mapped_tags=v.mapped_tags.split(',') if v.mapped_tags else [],
                user=FeedsUserResponse(
                    nickname=v.nickname,
                    profile_image=v.profile_image if v.profile_image else None,
                    user_hash=v.user_hash
                ),
                view_hash=v.view_hash

            )
            for v in self._results
        ]

    def toDict(self):
        """딕셔너리 리스트 반환"""
        return [
            {
                "title": v.title,
                "contents": v.contents,
                "mapped_tags": v.mapped_tags.split(',') if v.mapped_tags else [],
                "input_date": f"{v.input_date.year}-{v.input_date.month}-{v.input_date.day}",
                "month": v.month,
                "is_pre_made": v.is_pre_made,
                "refer_feed_id": v.refer_feed_id,
                "image_url": v.image_url if v.image_url else None,
                "meal_condition": v.meal_condition,
                "category_id": v.category_id,
                "category_name": v.category_name,
                "is_public": v.is_public,
                "user": {
                    "nickname": v.nickname,
                    "profile_image": v.profile_image if v.profile_image else None,
                    "user_hash": v.user_hash
                },
                "view_hash":v.view_hash
            }
            for v in self._results
        ]

    def toJSON(self):
        """JSON 문자열 반환"""
        import json
        return json.dumps(self.toDict(), ensure_ascii=False, default=str)

    def getRawData(self):
        """원본 SQLAlchemy 객체 반환"""
        return self._results