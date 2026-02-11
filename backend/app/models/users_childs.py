from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    CHAR,
    Index,
    func
)
from app.core.database import Base

class UsersChilds(Base):
    __tablename__ = "users_childs"
    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_user_agent", "user_id", "is_agent"),
        {
            "comment": "사용자 자녀 정보"
        }
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="users.id")
    child_name = Column(String(50), nullable=False, comment="자녀명")
    child_birth = Column(Date, nullable=False, comment="자녀 생일")
    child_gender = Column(CHAR(1), nullable=False, comment="M/W")
    is_agent = Column(CHAR(1), nullable=False, default="N", comment="대표 자녀 여부")

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    @staticmethod
    def getAgentChild(session, user_id: int):
        return session.query(UsersChilds).filter(
            UsersChilds.user_id == user_id,
            UsersChilds.is_agent == "Y"
        ).first()

    @staticmethod
    def findByChildId(session, child_id: int):
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
    def getListWithAllergies(session, user_id: int):
        from app.models.users_childs_allergies import UserChildAllergy
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
                func.GROUP_CONCAT(UserChildAllergy.allergy_name).label("allergy_names"),
                func.GROUP_CONCAT(UserChildAllergy.allergy_code).label("allergy_codes")
            )
            .outerjoin(UserChildAllergy, UserChildAllergy.child_id == UsersChilds.id)
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

        return SerializerQueryResult(query.all())
