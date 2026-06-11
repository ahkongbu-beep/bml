from app.models.ingredients_nutritions import IngredientsNutritions
class IngredientsNutritionsRepository:

    @staticmethod
    def get_ingredient_mapper(session, ingredient_id):

        from app.models.nutrients import Nutrients
        from app.models.ingredients import Ingredients

        query = session.query(
            IngredientsNutritions.amount,
            Nutrients.name.label("nutrient_name"),
            Nutrients.unit.label("nutrient_unit"),
            Ingredients.name.label("ingredient_name")
        )
        query = query.join(Nutrients, Nutrients.id == IngredientsNutritions.nutrient_id)
        query = query.join(Ingredients, Ingredients.id == IngredientsNutritions.ingredient_id)
        query = query.filter(IngredientsNutritions.ingredient_id == ingredient_id)
        return query.all()

    @staticmethod
    def create(session, ingredient_nutrition_params: dict):
        new_ingredient_nutrition = IngredientsNutritions(**ingredient_nutrition_params)
        session.add(new_ingredient_nutrition)
        session.flush()
        session.refresh(new_ingredient_nutrition)
        return new_ingredient_nutrition

    @staticmethod
    def delete_by_ingredient_id(session, ingredient_id: int):
        session.query(IngredientsNutritions).filter(
            IngredientsNutritions.ingredient_id == ingredient_id
        ).delete()
        session.flush()