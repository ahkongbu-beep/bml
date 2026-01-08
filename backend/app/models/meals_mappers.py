from sqlalchemy import BigInteger, Column, ForeignKey
from app.core.database import Base

class MealsMappers(Base):
    __tablename__ = "meals_mappers"

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        primary_key=True,
        comment="user.pk"
    )
    category_id = Column(
        BigInteger,
        ForeignKey("categories_codes.id"),
        primary_key=True,
        comment="category.pk"
    )

    def __repr__(self):
        return f"<MealsMappers(user_id={self.user_id}, category_id={self.category_id})>"


    @staticmethod
    def findByUserIdAndCategoryId(session, user_id: int, category_id: int):
        return session.query(MealsMappers).filter(
            MealsMappers.user_id == user_id,
            MealsMappers.category_id == category_id
        ).all()

    @staticmethod
    def create(session, params: dict, is_commit: bool = True):
        meal_mapper = MealsMappers(
            user_id=params.get("user_id"),
            category_id=params.get("category_id")
        )
        session.add(meal_mapper)
        if is_commit:
            session.commit()
            session.refresh(meal_mapper)
        return meal_mapper

    """ categories_codes, users 테이블 join 후 user_id로 조회 """
    @staticmethod
    def getList(session, user_id: int):
        from app.models.categories_codes import CategoriesCodes

        result = session.query(
            MealsMappers.user_id,
            MealsMappers.category_id,
            CategoriesCodes.value.label("category_name")
        ).join(
            CategoriesCodes,
            MealsMappers.category_id == CategoriesCodes.id
        ).filter(
            MealsMappers.user_id == user_id
        ).all()

        return QueryResult(result)


class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.meals_mappers_schemas import MealsMappersResponse

        return [
            MealsMappersResponse(
                user_id=v.user_id,
                category_id=v.category_id,
                category_name=v.category_name
            )
            for v in self._results
        ]

    def toDict(self):
        """딕셔너리 리스트 반환"""
        return [
            {
                "user_id": v.user_id,
                "category_id": v.category_id,
                "category_name": v.category_name
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