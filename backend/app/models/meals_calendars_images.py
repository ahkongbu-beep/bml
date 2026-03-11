from sqlalchemy import Column, Integer, String, Index, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from app.core.database import Base
import os

class MealsCalendarsImages(Base):
    __tablename__ = "meals_calendars_images"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, nullable=False, default=0, comment="users.pk")
    month = Column(String(20), nullable=False, default="", comment="날짜 Y-m")
    image = Column(String(255), nullable=False, default="", comment="캘린더 이미지")
    is_active = Column(String(2), nullable=False, default="Y", comment="사용여부")

    __table_args__ = (
        UniqueConstraint("user_id", "month", "is_active", name="user_month"),
        Index("idx_user_month", "user_id", "month"),
    )
