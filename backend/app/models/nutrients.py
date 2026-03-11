from sqlalchemy import (
    Column,
    BigInteger,
    String,
)
from app.core.database import Base
from sqlalchemy.orm import relationship

class Nutrients(Base):
    __tablename__ = "nutrients"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    nutrient_group = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)

    ingredient_values = relationship(
        "IngredientsNutritions",
        back_populates="nutrient"
    )