from sqlalchemy import Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.config import settings
from app.libs.serializers.query import SerializerQueryResult

class FoodItem(Base):
    __tablename__ = "foods_items"

    id = Column(Integer, primary_key=True, index=True)

    food_code = Column(String(50), nullable=False, unique=True, index=True)
    food_type = Column(String(50), nullable=False, default="food")
    food_name = Column(String(50), nullable=False)

    __table_args__ = (
        UniqueConstraint("food_type", "food_name", name="uq_food_type_food_name"),
    )

    @staticmethod
    def find_by_code(session, food_code: str):
        return session.query(FoodItem).filter(FoodItem.food_code == food_code).first()

    @staticmethod
    def createCode(session, food_type: str):
        prefix = food_type.upper()

        last_item = session.query(FoodItem).filter(FoodItem.food_type == food_type).order_by(FoodItem.id.desc()).first()

        last_item_code = last_item.food_code.split('_')[-1] if last_item else None
        if last_item_code and last_item_code.isdigit():
            new_number = int(last_item_code) + 1
        else:
            new_number = 1

        return f"{prefix}_{new_number:06d}"

    @staticmethod
    def get_list(session, food_type: str = None, food_name: str = None):
        query = session.query(FoodItem)
        if food_type:
            query = query.filter(FoodItem.food_type == food_type)
        if food_name:
            query = query.filter(FoodItem.food_name.ilike(f"%{food_name}%"))
        return SerializerQueryResult(query.all())

    @staticmethod
    def create(session, data):

        new_code = FoodItem.createCode(session, data["food_type"])

        food_item = FoodItem(
            food_code=new_code,
            food_type=data.get("food_type", "FOOD"),
            food_name=data["food_name"]
        )

        session.add(food_item)
        session.commit()
        session.refresh(food_item)
        return food_item

    @staticmethod
    def update(session, food_id: int, data):
        food_item = session.query(FoodItem).filter(FoodItem.id == food_id).first()
        if not food_item:
            return None

        if "food_type" in data:
            food_item.food_type = data["food_type"]
        if "food_name" in data:
            food_item.food_name = data["food_name"]

        session.commit()
        session.refresh(food_item)
        return food_item

    @staticmethod
    def search_by_name(session, food_name: str):
        query = session.query(FoodItem)
        if food_name:
            query = query.filter(FoodItem.food_name.ilike(f"%{food_name}%"))
        return query.all()