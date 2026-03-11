from sqlalchemy import (
    Column,
    BigInteger,
    String,
    DateTime,
    text,
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class Ingredients(Base):
    __tablename__ = "ingredients"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=True)
    allergy_risk = Column(String(20), nullable=True, default='LOW')
    recommended_stage = Column(String(20), nullable=True)
    is_active = Column(String(1), nullable=True, default='Y')
    created_at = Column(DateTime, nullable=True, server_default=text('CURRENT_TIMESTAMP'))

    nutritions = relationship("IngredientsNutritions", back_populates="ingredient")
