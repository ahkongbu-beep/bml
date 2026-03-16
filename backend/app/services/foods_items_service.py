
from app.repository.food_item_repository import FoodItemRepository

def get_food_item_by_code(db, food_code: str):
    return FoodItemRepository.get_food_item_by_code(db, food_code)

def get_allergy_details_by_codes(db, allergy_codes: list):
    allergy_details = []
    for code in allergy_codes:
        item = get_food_item_by_code(db, code)
        if item:
            allergy_details.append({
                "food_code": item.food_code,
                "food_name": item.food_name,
            })
    return allergy_details