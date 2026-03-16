from app.models.foods_items import FoodsItems
from app.libs.serializers.query import SerializerQueryResult

class FoodItemRepository:

    @staticmethod
    def get_one_data(session, food_id: int):
        return session.query(FoodsItems).filter(FoodsItems.id == food_id).first()

    @staticmethod
    def get_food_item_by_code(session, food_code: str):
        return session.query(FoodsItems).filter(FoodsItems.food_code == food_code).first()

    @staticmethod
    def get_by_type_and_code(session, food_type, food_code):
        return(
            session.query(FoodsItems).filter(
                FoodsItems.food_type == food_type,
                FoodsItems.food_code == food_code
            ).first()
        )

    @staticmethod
    def createCode(session, food_type: str):
        prefix = food_type.upper()

        last_item = session.query(FoodsItems).filter(FoodsItems.food_type == food_type).order_by(FoodsItems.id.desc()).first()

        last_item_code = last_item.food_code.split('_')[-1] if last_item else None
        if last_item_code and last_item_code.isdigit():
            new_number = int(last_item_code) + 1
        else:
            new_number = 1

        return f"{prefix}_{new_number:06d}"

    @staticmethod
    def get_list(session, food_type: str = None, food_name: str = None):
        query = session.query(FoodsItems)
        if food_type:
            query = query.filter(FoodsItems.food_type == food_type)
        if food_name:
            query = query.filter(FoodsItems.food_name.ilike(f"%{food_name}%"))
        return SerializerQueryResult(query.all())

    @staticmethod
    def create(session, data):

        new_code = FoodsItems.createCode(session, data["food_type"])

        food_item = FoodsItems(
            food_code=new_code,
            food_type=data.get("food_type", "FOOD"),
            food_name=data["food_name"]
        )

        session.add(food_item)
        session.commit()
        session.refresh(food_item)
        return food_item

    @staticmethod
    def update(session, food_id: int, data, is_commit=True):
        food_item = session.query(FoodsItems).filter(FoodsItems.id == food_id).first()
        if not food_item:
            return None

        if "food_type" in data:
            food_item.food_type = data["food_type"]
        if "food_name" in data:
            food_item.food_name = data["food_name"]

        if is_commit:
            session.commit()
        else:
            session.flush()
        return food_item

    @staticmethod
    def search_by_name(session, food_name: str):
        query = session.query(FoodsItems)
        if food_name:
            query = query.filter(FoodsItems.food_name.ilike(f"%{food_name}%"))
        return query.all()