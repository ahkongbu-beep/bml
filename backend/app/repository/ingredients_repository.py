from app.models.ingredients import Ingredients
from app.models.ingredients_nutritions import IngredientsNutritions
from app.models.nutrients import Nutrients

class IngredientsRepository:

    @staticmethod
    def get_ingredient_by_id(session, ingredient_id: int):
        return session.query(Ingredients).filter(Ingredients.id == ingredient_id).first()

    @staticmethod
    def get_ingredient_by_name(session, name: str):
        return session.query(Ingredients).filter(Ingredients.name == name).first()

    @staticmethod
    def get_like_ingredient_by_name(session, name: str):
        return session.query(Ingredients).filter(Ingredients.name.like(f"{name}%")).all()

    @staticmethod
    def get_list(session, search_params: dict):
        query = session.query(Ingredients)

        if search_params.get("ingredient_category"):
            query = query.filter(Ingredients.category == search_params["ingredient_category"])

        if search_params.get("ingredient_name"):
            query = query.filter(Ingredients.ingredient_name.like(f"{search_params['ingredient_name']}%"))

        query = query.order_by(Ingredients.category.desc())
        return query.all()

    @staticmethod
    def get_ingredients_join_nutrient(session):

        """_summary_
        select i.id, i.name, n.name, n.unit from ingredients i
            left join ingredients_nutritions t  on i.id = t.ingredient_id
            left join nutrients n on n.id= t.nutrient_id
        """

        query = session.query(
            Ingredients.id.label("ingredient_id"),
            Ingredients.name.label("ingredient_name"),
            Ingredients.category,
            Ingredients.allergy_risk,
            Nutrients.id.label("nutrient_id"),
            Nutrients.name.label("nutrient_name"),
            Nutrients.unit.label("nutrient_unit"),
            Nutrients.nutrient_group,
            IngredientsNutritions.amount,
        ).outerjoin(
            IngredientsNutritions,
            Ingredients.id == IngredientsNutritions.ingredient_id
        ).outerjoin(
            Nutrients,
            Nutrients.id == IngredientsNutritions.nutrient_id
        ).order_by(Ingredients.category, Ingredients.id)
        return query.all()