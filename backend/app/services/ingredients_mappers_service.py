from app.repository.ingredients_mappers_repository import IngredientsMappersRepository

def get_ingredient_mappers_by_meal_id(db, meal_id):
    return IngredientsMappersRepository.get_ingredient_mappers_by_meal_id(db, meal_id)

def insert_ingredient_mapper(db, model_id, ingredients):
    for ingredient in ingredients:
        IngredientsMappersRepository.create_mapper(db, {
            "meal_id": model_id,
            "ingredient_id": ingredient.get("id"),
            "score": ingredient.get("score", 0)
        })
        db.flush()
    return True

def delete_ingredient_mapper(db, model_id):
    IngredientsMappersRepository.delete_mapper(db, model_id)


def get_ingredient_mappers_by_meal_id(db, meal_id):
    from app.services.ingredients_service import get_ingredient_by_id

    mappers = IngredientsMappersRepository.get_ingredient_mappers_by_meal_id(db, meal_id)

    ingredients = []

    for mapper in mappers:
        ingredient_info = get_ingredient_by_id(db, mapper.ingredient_id)
        if ingredient_info:
            ingredients.append({
                "ingredient_id": mapper.ingredient_id,
                "mapped_score": mapper.score,
                "mapped_tags": ingredient_info.name
            })

    # ingredients 가 있을때 score 로 정렬
    if ingredients:
        ingredients.sort(key=lambda x: x["mapped_score"], reverse=True)

    return ingredients