from sqlalchemy import Column, Integer, String, UniqueConstraint
from app.core.database import Base

class FoodsItems(Base):
    __tablename__ = "foods_items"

    id = Column(Integer, primary_key=True, index=True)

    food_code = Column(String(50), nullable=False, unique=True, index=True)
    food_type = Column(String(50), nullable=False, default="food")
    food_name = Column(String(50), nullable=False)

    __table_args__ = (
        UniqueConstraint("food_type", "food_name", name="uq_food_type_food_name"),
    )
