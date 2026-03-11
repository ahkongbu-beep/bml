from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, UniqueConstraint
from app.core.database import Base
from app.models.meals_calendar import MealsCalendars

class MealsLikes(Base):
    __tablename__ = "meals_likes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meal_id = Column(Integer, ForeignKey("meals_calendars.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('meal_id', 'user_id', name='unique_meal_user'),
    )
