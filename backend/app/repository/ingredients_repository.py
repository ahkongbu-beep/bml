from app.models.ingredients import Ingredients

class IngredientsRepository:
    @staticmethod
    def get_ingredient_by_name(session, name: str):
        return session.query(Ingredients).filter(Ingredients.name == name).first()

    @staticmethod
    def get_like_ingredient_by_name(session, name: str):
        return session.query(Ingredients).filter(Ingredients.name.like(f"{name}%")).all()