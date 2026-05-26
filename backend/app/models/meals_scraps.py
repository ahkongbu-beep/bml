from sqlalchemy import Column, Integer, DateTime, Enum, String, Index, UniqueConstraint, text
from app.core.database import Base

class MealsScrap(Base):
    __tablename__ = "meals_scraps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=0, comment="users.pk")
    meal_id = Column(Integer, nullable=False, default=0, comment="meals_calendars.pk")
    is_active = Column(Enum("Y", "N"), nullable=False, default="Y", comment="사용여부")
    sort_order = Column(Integer, nullable=False, default=0, comment="정렬순서")
    memo = Column(String(255), nullable=False, default="", comment="간단메모")
    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), comment="생성일시")
    updated_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP"), comment="수정일시")

    __table_args__ = (
        UniqueConstraint("user_id", "meal_id", name="uniq_scrap"),
        Index("idx_user_active_created", "user_id", "is_active", "created_at"),
        Index("idx_sort_order", "user_id", "sort_order"),
    )