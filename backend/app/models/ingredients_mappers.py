from sqlalchemy import Column, BigInteger, ForeignKey
from app.core.database import Base

class IngredientsMappers(Base):
    __tablename__ = "ingredients_mappers"
    meal_id = Column(BigInteger, ForeignKey("meals_calendars.id"), primary_key=True)
    ingredient_id = Column(BigInteger, ForeignKey("ingredients.id"), primary_key=True)
