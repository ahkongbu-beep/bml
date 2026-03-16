from app.models.ingredients_mappers import IngredientsMappers

class IngredientsMappersRepository:

    @staticmethod
    def create_mapper(db, data, is_commit=True):
        ingredient_mapper = IngredientsMappers(**data)
        db.add(ingredient_mapper)
        if is_commit:
            db.commit()
        return ingredient_mapper

    @staticmethod
    def delete_mapper(db, model:str, meal_id: int, is_commit=True):
        try:
            db.query(IngredientsMappers).filter(
                IngredientsMappers.meal_id == meal_id
            ).delete()
        except Exception as e:
            db.rollback()
            return False

        if is_commit:
            db.commit()
        else:
            db.flush()
        return True