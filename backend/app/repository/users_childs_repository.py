
from app.models.users_childs import UsersChilds
from sqlalchemy import (Date, func)

class UsersChildsRepository:

    @staticmethod
    def get_agent_childs_by_user_id(session, user_id: int):
        return session.query(UsersChilds).filter(
            UsersChilds.user_id == user_id,
            UsersChilds.is_agent == "Y"
        ).first()

    @staticmethod
    def get_child_by_id_and_name(session, child_id: int, child_name: str):
        return session.query(UsersChilds).filter(
            UsersChilds.id == child_id,
            UsersChilds.child_name == child_name
        ).first()

    @staticmethod
    def getAgentChild(session, user_id: int):
        return session.query(UsersChilds).filter(
            UsersChilds.user_id == user_id,
            UsersChilds.is_agent == "Y"
        ).first()

    @staticmethod
    def get_child_by_id(session, child_id: int):
        return session.query(UsersChilds).filter(UsersChilds.id == child_id).first()

    @staticmethod
    def findByUserIds(session, user_id: int):
        return session.query(UsersChilds).filter(UsersChilds.user_id == user_id).all()

    @staticmethod
    def findByUserName(session, user_id: int, child_name: str):
        return session.query(UsersChilds).filter(
            UsersChilds.user_id == user_id,
            UsersChilds.child_name == child_name
        ).first()

    @staticmethod
    def create(session, user_id: int, child_name: str, child_birth: Date, child_gender: str, is_agent: str = "N", is_commit: bool = True):
        new_child = UsersChilds(
            user_id=user_id,
            child_name=child_name,
            child_birth=child_birth,
            child_gender=child_gender,
            is_agent=is_agent
        )
        session.add(new_child)
        if is_commit:
            session.commit()

        return new_child

    @staticmethod
    def update(session, child_instance, params, is_commit: bool = True):
        for key, value in params.items():
            setattr(child_instance, key, value)
        if is_commit:
            session.commit()
        return child_instance

    @staticmethod
    def delete(session, child_instance, is_commit: bool = True):
        session.delete(child_instance)
        if is_commit:
            session.commit()
        else:
            session.flush()

    @staticmethod
    def get_list_with_allergies(session, user_id: int):
        from app.models.users_childs_allergies import UsersChildsAllergies
        from app.libs.serializers.query import SerializerQueryResult

        # 메인 쿼리
        query = (
            session.query(
                UsersChilds.id,
                UsersChilds.user_id,
                UsersChilds.child_name,
                UsersChilds.child_birth,
                UsersChilds.child_gender,
                UsersChilds.is_agent,
                func.GROUP_CONCAT(UsersChildsAllergies.allergy_name).label("allergy_names"),
                func.GROUP_CONCAT(UsersChildsAllergies.allergy_code).label("allergy_codes")
            )
            .outerjoin(UsersChildsAllergies, UsersChildsAllergies.child_id == UsersChilds.id)
            .filter(UsersChilds.user_id == user_id)
            .group_by(
                UsersChilds.id,
                UsersChilds.user_id,
                UsersChilds.child_name,
                UsersChilds.child_birth,
                UsersChilds.child_gender,
                UsersChilds.is_agent
            )
        )

        return query.all()
