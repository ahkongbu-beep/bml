from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Index
)
from app.core.database import Base
from sqlalchemy.orm import relationship, Mapped, mapped_column

class UserChildAllergy(Base):
    __tablename__ = "users_childs_allergies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"),nullable=False, comment="user.id")
    child_id: Mapped[int] = mapped_column(Integer, ForeignKey("users_childs.id"),nullable=False, comment="users_childs.id")
    allergy_code: Mapped[str] = mapped_column(String(50), nullable=False, default="", comment="알레르기 코드")
    allergy_name: Mapped[str] = mapped_column(String(255), nullable=False, default="", comment="알레르기 명")

    __table_args__ = (
        Index("ix_users_childs_allergies_user_id", "user_id"),
    )

    @staticmethod
    def bulk_create(session, user_id: int, child_id: int, items: list, is_commit: bool = True):
        child_allergies = []
        for item in items:
            # 딕셔너리와 객체 모두 지원
            allergy_code = item["allergy_code"] if isinstance(item, dict) else item.allergy_code
            allergy_name = item["allergy_name"] if isinstance(item, dict) else item.allergy_name

            child_allergy = UserChildAllergy(
                allergy_code=allergy_code,
                allergy_name=allergy_name,
                user_id=user_id,
                child_id=child_id
            )
            child_allergies.append(child_allergy)

        session.bulk_save_objects(child_allergies)
        if is_commit:
            session.commit()
        return child_allergies

    @staticmethod
    def bulk_delete(session, user_id: int, child_id: int, is_commit: bool = True):
        session.query(UserChildAllergy).filter(
            UserChildAllergy.user_id == user_id,
            UserChildAllergy.child_id == child_id
        ).delete(synchronize_session=False)

        if is_commit:
            session.commit()
        return