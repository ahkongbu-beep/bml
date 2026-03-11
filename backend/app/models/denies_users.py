from sqlalchemy import Column, Integer, DateTime, UniqueConstraint, Index
from sqlalchemy.sql import func
from app.core.database import Base

class DeniesUsers(Base):
    __tablename__ = "denies_users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, nullable=False, default=0, comment="요청 user.pk")
    deny_user_id = Column(Integer, nullable=False, default=0, comment="차단 user.pk")

    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "deny_user_id", name="uq_deny_user"),
        Index("idx_user_id", "user_id"),
    )
