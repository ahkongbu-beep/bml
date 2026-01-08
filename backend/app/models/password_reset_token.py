from sqlalchemy import (
    Column,
    BigInteger,
    String,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timedelta

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(128), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        Index("idx_password_reset_user_id", "user_id"),
        Index("idx_password_reset_expires_at", "expires_at"),
    )

    @staticmethod
    def findByUserIdCount(db_session, user_id: int):
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)

        return (
            db_session.query(PasswordResetToken).filter(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.created_at >= today_start,
                PasswordResetToken.created_at < tomorrow_start
            )
            .count()
        )

    @staticmethod
    def findValidTokenByToken(session, token: str):
        current_time = datetime.utcnow()
        return (
            session.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token == token,
                PasswordResetToken.expires_at > current_time,
                PasswordResetToken.used_at.is_(None)
            )
            .first()
        )