from sqlalchemy import Column, BigInteger, String, ForeignKey
from app.core.database import Base

class IngredientsMappers(Base):
    __tablename__ = "ingredients_mappers"

    meal_id = Column(BigInteger, ForeignKey("meals.id"), primary_key=True)
    ingredient_id = Column(BigInteger, ForeignKey("ingredients.id"), primary_key=True)
    model = Column(String(50), nullable=False, comment="모델명")
