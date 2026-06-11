from app.models.ingredients_requests import IngredientsRequests
from app.models.users import Users
class IngredientsRequestRepository:

    @staticmethod
    def get_ingredient_request_by_id(session, request_id: int):
        return session.query(IngredientsRequests).filter_by(id=request_id).first()

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

    @staticmethod
    def get_ingredient_request_list(session):
        query = (
            session.query(
                IngredientsRequests.id,
                IngredientsRequests.user_id,
                IngredientsRequests.name,
                IngredientsRequests.status,
                IngredientsRequests.created_at,
                Users.nickname.label("user_nickname")
            )
            .join(Users, Users.id == IngredientsRequests.user_id, isouter=True)
        )

        query = query.order_by(IngredientsRequests.status.asc())
        return query.all()