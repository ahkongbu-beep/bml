"""
삭제된 식단을 정리하는 배치 작업
- 삭제 기간
    - 전월 1일부터 전월 말일까지 삭제
    - is_active 가 "N"인 식단 중에서 삭제 기간에 해당하는 식단을 대상으로 함

- 삭제 대상
    - meals_calrendar
    - attaches_files
    - meal_ingredient_mappers
    - meals_likes
    - meals_comments
    - meals_summaries
    - 실제 업로드된 파일 삭제
"""
from datetime import datetime, timedelta
import sys
import os
# backend 루트 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app.core.database import SessionLocal

from app.services.meals_service import get_deleted_meals, delete_meal_calendar
from app.services.meals_summaries_service import delete_meal_summary_by_id
from app.services.meals_likes_service import delete_meal_like_by_meal_calendar
from app.services.ingredients_mappers_service import delete_ingredient_mapper
from app.services.meals_comments_service import delete_comments_by_meal_calendar_id
from app.services.attaches_files_service import hard_delete_file

db = SessionLocal()
def set_clear_meal_date():

    search_param = {
        "is_active": "N",
        "search_date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    }

    delete_meal = get_deleted_meals(db, search_param=search_param)

    try:
        for meal in delete_meal:
            # ai 요약 정보 삭제
            delete_meal_summary_by_id(db, meal.id)
            # 좋아요 정보 삭제
            delete_meal_like_by_meal_calendar(db, meal)
            # 재료 매핑 정보 삭제
            delete_ingredient_mapper(db, meal.id)
            # 코멘트 정보 삭제
            delete_comments_by_meal_calendar_id(db, meal.id)
            # 첨부파일 및 attaches_files 삭제
            hard_delete_file(db, model="Meals", model_id=meal.id)
            # meals_calendar 삭제
            delete_meal_calendar(db, meal)
            db.commit()

    except Exception as e:
        return

set_clear_meal_date()