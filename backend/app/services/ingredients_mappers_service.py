from app.repository.ingredients_mappers_repository import IngredientsMappersRepository

def create_ingredient_mapper(db, model, model_id, ingredient_ids):

    for ingredient_id in ingredient_ids:
        IngredientsMappersRepository.create_mapper(db, {
            "model": model,
            "meal_id": model_id,
            "ingredient_id": ingredient_id
        }, is_commit=False)

        db.flush()

def delete_ingredient_mapper(db, model, model_id):
    IngredientsMappersRepository.delete_mapper(db, model, model_id, is_commit=False)