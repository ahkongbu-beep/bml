from app.models.ingredients_mappers import IngredientsMappers

class IngredientsMappersRepository:

    @staticmethod
    def get_ingredient_mappers_by_meal_id(db, meal_id: int):
        return db.query(IngredientsMappers).filter(
            IngredientsMappers.meal_id == meal_id
        ).all()

    @staticmethod
    def create_mapper(db, data):
        ingredient_mapper = IngredientsMappers(**data)
        db.add(ingredient_mapper)
        db.flush()
        return ingredient_mapper

    @staticmethod
    def delete_mapper(db, meal_id: int):
        try:
            db.query(IngredientsMappers).filter(
                IngredientsMappers.meal_id == meal_id
            ).delete()
        except Exception as e:
            db.rollback()
            return False

        db.flush()
        return True