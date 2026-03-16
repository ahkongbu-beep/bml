from app.repository.meals_mappers_repository import MealsMappersRepository

def create_meal_mapper(db, meal_id: int, category_id: int):
    try:
        new_mapper = MealsMappersRepository.create(db, meal_id, category_id)
        if not new_mapper:
            raise Exception("식재료 매퍼 생성에 실패했습니다.")
    except Exception as e:
        db.rollback()
        raise Exception(f"식재료 매퍼 생성 중 오류가 발생했습니다: {str(e)}")

def meal_mapper_list_by_id(db, meal_id: int):
    return MealsMappersRepository.list_by_user_ids(db, meal_id)