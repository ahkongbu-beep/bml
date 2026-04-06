# 주단위 데이터를 토대로 자녀별 주간 요약 정보를 생성하는 배치 작업


from datetime import datetime, timedelta

import sys
import os

# backend 루트 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.services.users_service import get_user_list
from app.services.meals_service import get_meals_list
from app.services.ingredients_service import get_ingredients_join_nutrient
from app.services.ingredients_mappers_service import get_ingredient_mappers_by_meal_id
from app.services.summary_service import get_week_report
from app.core.database import SessionLocal

def set_summaries_week():
    db = SessionLocal()

    ingredients = {}
    ingredient_result = get_ingredients_join_nutrient(db)

    for ingredient in ingredient_result:
        ingredient_id = ingredient.ingredient_id
        ingredient_name = ingredient.ingredient_name
        nutrient_name = ingredient.nutrient_name
        nutrient_unit = ingredient.nutrient_unit

        if ingredient_id not in ingredients:
            ingredients[ingredient_id] = {
                "ingredient_name": ingredient_name,
                "nutrients": {}
            }
        if nutrient_name and nutrient_name not in ingredients[ingredient_id]["nutrients"]:
            ingredients[ingredient_id]["nutrients"][nutrient_name] = {
                "amount": float(ingredient.amount) if ingredient.amount else 0,
                "unit": nutrient_unit
            }


    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = datetime.now().strftime("%Y-%m-%d")
    try:
        # 1. 모든 사용자 조회
        users = get_user_list(db)

        for user in users:
            user_id = user.id
            params = {
                "user_id": user_id,
                "start_date": start_date,
                "end_date": end_date,
                "view_type": "mine",
                "my_user_id": user_id,
                "is_active": "Y",
            }

            # 식단 정보를 조회
            meal_list = get_meals_list(db, params, include=["child", "category"])
            summary_item = {}
            for meal in meal_list:
                child_name = meal.child_name
                child_gender = meal.child_gender
                child_birth = meal.child_birth

                input_date = str(meal.input_date)  # date → "YYYY-MM-DD" 문자열
                category_name = meal.category_name or "알 수 없음"

                ingredient_mappers = get_ingredient_mappers_by_meal_id(db, meal.id)

                if input_date not in summary_item:
                    summary_item[input_date] = {}

                if child_name not in summary_item[input_date]:
                    summary_item[input_date][child_name] = {}

                if category_name not in summary_item[input_date][child_name]:
                    summary_item[input_date][child_name][category_name] = {}

                for mapper in ingredient_mappers:
                    ingredient_info = ingredients.get(mapper.ingredient_id)
                    if not ingredient_info:
                        continue

                    ingredient_name = ingredient_info["ingredient_name"]
                    nutrients = ingredient_info["nutrients"]

                    if ingredient_name not in summary_item[input_date][child_name][category_name]:
                        # 첫 등장: 영양소 딕셔너리 복사해서 초기화
                        summary_item[input_date][child_name][category_name][ingredient_name] = {
                            nutrient: {"amount": info["amount"], "unit": info["unit"]}
                            for nutrient, info in nutrients.items()
                        }
                    else:
                        # 재등장: 영양소 수치 누적 합산
                        for nutrient, info in nutrients.items():
                            if nutrient in summary_item[input_date][child_name][category_name][ingredient_name]:
                                summary_item[input_date][child_name][category_name][ingredient_name][nutrient]["amount"] += info["amount"]
                            else:
                                summary_item[input_date][child_name][category_name][ingredient_name][nutrient] = {"amount": info["amount"], "unit": info["unit"]}

            if user_id == 56:
                # todo 해당 데이터 저장 방식을 민
                ai_result = get_week_report(summary_item, child_gender, child_birth)
                print("⭕⭕⭕AI 분석 결과:", ai_result)

    finally:
        db.close()

set_summaries_week()

"""
AI 분석 결과:
{
  "children": [
    {
      "child_name": "랑구",
      "summary": {
        "protein": 47.7,
        "fat": 38.8,
        "carbohydrate": 145.0
      },
      "vitamins": {
        "vitamin_a": 1978.0,
        "vitamin_c": 54.5,
        "calcium": 201.0,
        "iron": 4.1,
        "potassium": 1197.0
      },
      "deficiency": [],
      "chart_data": [
        {"name": "protein", "value": 47.7},
        {"name": "fat", "value": 38.8},
        {"name": "carbohydrate", "value": 145.0},
        {"name": "vitamin_a", "value": 1978.0},
        {"name": "vitamin_c", "value": 54.5},
        {"name": "calcium", "value": 201.0},
        {"name": "iron", "value": 4.1},
        {"name": "potassium", "value": 1197.0}
      ],
      "recommend_foods": []
    }
  ]
}
"""