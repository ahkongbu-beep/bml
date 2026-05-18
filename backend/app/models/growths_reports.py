from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DECIMAL,
    Index,
    UniqueConstraint,
    text
)
from app.core.database import Base

class GrowthReport(Base):
    __tablename__ = "growths_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="users.id")
    child_id = Column(Integer, nullable=False, default=0, comment="user_child.id")
    type = Column(String(50), nullable=False, comment="타입")
    months = Column(DECIMAL(4, 1), nullable=False, comment="개월수")
    value = Column(DECIMAL(4, 1), nullable=False, comment="아이 현재 수치")
    percent = Column(String(10), nullable=False, default="", comment="아이 현재 백분률")

    created_at = Column(
        Date,
        nullable=False,
        server_default=text("CURRENT_DATE"),
    )

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_user_child", "user_id", "child_id"),
        UniqueConstraint(
            "type",
            "user_id",
            "child_id",
            "created_at",
            name="unq_user_report"
        ),
    )