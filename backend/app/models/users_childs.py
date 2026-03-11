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
