from app.models.ingredients import Ingredients

class IngredientsRepository:
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