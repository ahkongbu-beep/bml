from app.repository.ingredients_mappers_repository import IngredientsMappersRepository
from app.services.ingredients_service import get_ingredient_by_id

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
    IngredientsMappersRepository.delete_mapper(db, model_id, is_commit=False)

def get_ingredient_mappers_name_by_meal_id(db, meal_id):
    mappers = IngredientsMappersRepository.get_ingredient_mappers_by_meal_id(db, meal_id)

    ingredient_names = []

    for mapper in mappers:
        ingredient_info = get_ingredient_by_id(db, mapper.ingredient_id)
        if ingredient_info:
            ingredient_names.append(ingredient_info.name)

    return ingredient_names