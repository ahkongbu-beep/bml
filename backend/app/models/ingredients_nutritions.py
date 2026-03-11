from sqlalchemy import Column, BigInteger, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from app.core.database import Base

class IngredientsNutritions(Base):
    __tablename__ = "ingredients_nutritions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    ingredient_id = Column(
        BigInteger,
        ForeignKey("ingredients.id"),
        nullable=False,
        index=True
    )

    nutrient_id = Column(
        BigInteger,
        ForeignKey("nutrients.id"),
        nullable=False,
        index=True
    )

    amount = Column(
        DECIMAL(10, 3),
        nullable=False,
        comment="100g 기준 영양소 함량"
    )

    # relationships
    ingredient = relationship("Ingredients", back_populates="nutritions")
    nutrient = relationship("Nutrients", back_populates="ingredient_values")