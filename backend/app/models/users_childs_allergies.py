from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Index
)
from app.core.database import Base
from sqlalchemy.orm import Mapped, mapped_column

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
