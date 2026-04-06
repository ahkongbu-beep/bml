
from app.repository.ingredients_nutritions_repository import IngredientsNutritionsRepository
def get_ingredient_mapper(db, ingredient):
    result = IngredientsNutritionsRepository.get_ingredient_mapper(db, ingredient.get("ingredient_id"))
    # 직렬화

    data = {}
    for r in result:
        name = r.ingredient_name
        # 100g 담 기준이기 떄문에 score 계산 필요
        amount = float(r.amount) * ingredient.get("score", 0)  # score는 0~1 사이의 소수

        if name not in data:
            data[name] = []

        data[name].append({
            "amount": amount,
            "nutrient_name": r.nutrient_name,
            "nutrient_unit": r.nutrient_unit,
            "ingredient_name": r.ingredient_name
        })

    return data

