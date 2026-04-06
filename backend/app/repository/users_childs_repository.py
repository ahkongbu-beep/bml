
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
    def get_child_by_user_id_and_name(session, user_id: int, child_name: str):
        return session.query(UsersChilds).filter(
            UsersChilds.user_id == user_id,
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
    def apply_filters(query, params: dict):
        from sqlalchemy.inspection import inspect
        mapper = inspect(UsersChilds)
        columns = {column.key for column in mapper.columns}

        for key, value in params.items():
            if key in columns and value is not None:
                query = query.filter(getattr(UsersChilds, key) == value)

        # 생성일로 조회
        if params.get("created_at_start") and params.get("created_at_end"):
            query = query.filter(
                UsersChilds.created_at.between(
                    params["created_at_start"],
                    params["created_at_end"]
                )
            )

        # 수정일로 조회
        if params.get("updated_at_start") and params.get("updated_at_end"):
            query = query.filter(
                UsersChilds.updated_at.between(
                    params["updated_at_start"],
                    params["updated_at_end"]
                )
            )

        return query

    @staticmethod
    def get_child_list(session, params):
        query = session.query(UsersChilds)
        query = UsersChildsRepository.apply_filters(query, params)

        # 정렬
        order_by = params.get("order_by", "id")
        order_direction = params.get("order_direction", "desc")

        if hasattr(UsersChilds, order_by):
            col = getattr(UsersChilds, order_by)
            query = query.order_by(col.desc() if order_direction == "desc" else col.asc())

        # 페이징
        if params.get("offset") is not None and params.get("limit") is not None:
            query = query.offset(params["offset"]).limit(params["limit"])

        return query.all()

    @staticmethod
    def get_list_with_allergies(session, user_id: int):
        from app.models.users_childs_allergies import UsersChildsAllergies

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
