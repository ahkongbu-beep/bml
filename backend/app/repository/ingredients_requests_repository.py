from app.models.ingredients_requests import IngredientsRequests

class IngredientsRequestRepository:
    @staticmethod
    def get_ingredient_request(session, user_id: int, name:str):
        return session.query(IngredientsRequests).filter_by(user_id=user_id, name=name).first()

    @staticmethod
    def create_ingredient_request(session, user_id: int, name: str):
        new_request = IngredientsRequests(user_id=user_id, name=name)
        session.add(new_request)
        session.flush()
        session.refresh(new_request)
        return new_request