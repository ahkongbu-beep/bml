from sqlalchemy import Column, BigInteger, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FoodNutrition(Base):
    __tablename__ = "foods_nutritions"

    tag_id = Column(BigInteger, ForeignKey("feeds_tags.id"), primary_key=True)

    protein = Column(Float)
    calcium = Column(Float)
    iron = Column(Float)
    zinc = Column(Float)

    vitamin_a = Column(Float)
    vitamin_b = Column(Float)
    vitamin_c = Column(Float)
    vitamin_d = Column(Float)

    tag = relationship("FeedsTag")