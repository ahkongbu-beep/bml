from app.repository.meals_summaries_repository import MealsSummariesRepository

def create_ingredient_hash(user_id, input_date, category_code, child_id, contents, meal_stage, meal_stage_detail, ingredient_names):
    """
    식재료 해시 생성
    """
    from app.core.config import settings
    from app.libs.hash_utils import generate_sha256_hash
    return generate_sha256_hash(
        user_id,
        input_date,
        category_code,
        child_id,
        contents,
        meal_stage,
        meal_stage_detail,
        ingredient_names,
        settings.SECRET_KEY
    )

def create_meal_summary(db, params):
    """
    임시 식단 요약 정보
    """
    return MealsSummariesRepository.create_meal_summary(db, params)

def get_meal_summary_by_view_hash(db, view_hash):
    """
    view_hash로 식단 요약 정보 조회
    """
    return MealsSummariesRepository.get_meal_summary_by_view_hash(db, view_hash)

def get_meal_summary_by_id(db, summary_id):
    """
    ID로 식단 요약 정보 조회
    """
    return MealsSummariesRepository.get_meal_summary_by_id(db, summary_id)

def delete_meal_summary_by_id(db, summary_id):
    """
    ID로 식단 요약 정보 삭제
    """
    meal_summary = get_meal_summary_by_id(db, summary_id)
    if meal_summary:
        db.delete(meal_summary)
    return True