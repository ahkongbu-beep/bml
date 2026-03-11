from app.models.meals_mappers import MealsMappers
from app.libs.serializers.query import SerializerQueryResult
class MealsMappersRepository:

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

    @staticmethod
    def list_by_user_ids(session, user_id: int):
        return session.query(MealsMappers).filter(MealsMappers.user_id == user_id).all()

    """ categories_codes, users 테이블 join 후 user_id로 조회 """
    @staticmethod
    def get_list(session, user_id: int):
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

        return SerializerQueryResult(result)
