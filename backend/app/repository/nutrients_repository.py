from app.models.nutrients import Nutrients

class NutrientsRepository:

    @staticmethod
    def get_nutrient_by_id(session, nutrient_id: int):
        return session.query(Nutrients).filter_by(id=nutrient_id).first()

    def get_nutrient_by_name(session, name: str):
        return session.query(Nutrients).filter_by(name=name).first()