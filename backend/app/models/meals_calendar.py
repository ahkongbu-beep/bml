from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, func as sql_func,
    UniqueConstraint, Index
)
from app.core.database import Base
from app.models.users import Users
from app.models.categories_codes import CategoriesCodes
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.models.feeds_tags import FeedsTags
from app.schemas.meals_schemas import MealsCalendarResponse


class MealsCalendars(Base):
    __tablename__ = "meals_calendars"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_code = Column(Integer, nullable=False, default=0, comment="카테고리의 식사 구분 pk")
    user_id = Column(Integer, nullable=False, default=0, comment="요청 user.pk")
    title = Column(String(255), nullable=False, default="", comment="식사제목")
    contents = Column(Text, nullable=True, comment="설명")
    month = Column(String(7), nullable=False, default="", comment="YYYY-MM")
    input_date = Column(Date, nullable=False, comment="식사일")
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

    def __repr__(self):
        return (
            f"<MealsCalendar("
            f"id={self.id}, user_id={self.user_id}, category={self.category_code}, date={self.input_date}"
            f")>"
        )

    @staticmethod
    def create(session, params, is_commit=True):
        meal_calendar = MealsCalendars(
            category_code=params.get("category_code", 0),
            user_id=params.get("user_id", 0),
            title=params.get("title", ""),
            contents=params.get("contents", ""),
            month=params.get("month", ""),
            input_date=params.get("input_date"),
            view_hash=params.get("view_hash", "")
        )
        session.add(meal_calendar)
        if is_commit:
            session.commit()
        return meal_calendar

    @staticmethod
    def findByUserIdAndDate(session, user_id: int, input_date: str):
        return session.query(MealsCalendars).filter(
            MealsCalendars.user_id == user_id,
            MealsCalendars.input_date == input_date
        ).all()

    @staticmethod
    def getList(session, params):
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

        query = (
            session.query(
                MealsCalendars.view_hash.label("view_hash"),
                MealsCalendars.title,
                MealsCalendars.contents,
                MealsCalendars.input_date,
                MealsCalendars.month,
                category_subquery.c.category_id.label("category_id"),
                category_subquery.c.category_name.label("category_name"),
                subquery.c.tags.label("tags"),
                Users.nickname,
                Users.profile_image,
                Users.view_hash.label("user_hash")
            )
            .join(Users, MealsCalendars.user_id == Users.id)
            .outerjoin(category_subquery, MealsCalendars.category_code == category_subquery.c.category_id)
            .outerjoin(subquery, MealsCalendars.id == subquery.c.feed_id)
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
                tags=v.tags.split(',') if v.tags else [],
                input_date=f"{v.input_date.year}-{v.input_date.month}-{v.input_date.day}",
                month=v.month,
                category_id=v.category_id,
                category_name=v.category_name,
                user=FeedsUserResponse(
                    nickname=v.nickname,
                    profile_image=v.profile_image,
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
                "tags": v.tags.split(',') if v.tags else [],
                "input_date": f"{v.input_date.year}-{v.input_date.month}-{v.input_date.day}",
                "month": v.month,
                "category_id": v.category_id,
                "category_name": v.category_name,
                "user": {
                    "nickname": v.nickname,
                    "profile_image": v.profile_image,
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