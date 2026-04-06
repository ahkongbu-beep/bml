from sqlalchemy.orm import Session

from app.models.ingredients import Ingredients
from app.models.nutrients import Nutrients
from app.models.ingredients_nutritions import IngredientsNutritions

from app.core.database import get_db
# get_db()는 제너레이터이므로 next()로 세션을 가져옵니다
db = next(get_db())

seed_data = [
{"ingredient":"당근","nutrition":{"protein":0.9,"fat":0.2,"carbohydrate":9.6,"vitamin":{"vitamin_a":835,"vitamin_c":5.9},"mineral":{"potassium":320,"calcium":33,"iron":0.3}},"unit":"per_100g"},
{"ingredient":"브로콜리","nutrition":{"protein":2.8,"fat":0.4,"carbohydrate":6.6,"vitamin":{"vitamin_a":623,"vitamin_c":89.2},"mineral":{"potassium":316,"calcium":47,"iron":0.7}},"unit":"per_100g"},
{"ingredient":"감자","nutrition":{"protein":2.0,"fat":0.1,"carbohydrate":17.0,"vitamin":{"vitamin_a":2,"vitamin_c":19.7},"mineral":{"potassium":425,"calcium":12,"iron":0.8}},"unit":"per_100g"},
{"ingredient":"고구마","nutrition":{"protein":1.6,"fat":0.1,"carbohydrate":20.1,"vitamin":{"vitamin_a":709,"vitamin_c":2.4},"mineral":{"potassium":337,"calcium":30,"iron":0.6}},"unit":"per_100g"},
{"ingredient":"양배추","nutrition":{"protein":1.3,"fat":0.1,"carbohydrate":5.8,"vitamin":{"vitamin_a":98,"vitamin_c":36.6},"mineral":{"potassium":170,"calcium":40,"iron":0.5}},"unit":"per_100g"},
{"ingredient":"애호박","nutrition":{"protein":1.2,"fat":0.2,"carbohydrate":3.1,"vitamin":{"vitamin_a":200,"vitamin_c":17.9},"mineral":{"potassium":261,"calcium":16,"iron":0.4}},"unit":"per_100g"},
{"ingredient":"단호박","nutrition":{"protein":1.0,"fat":0.1,"carbohydrate":12.0,"vitamin":{"vitamin_a":426,"vitamin_c":9.0},"mineral":{"potassium":340,"calcium":21,"iron":0.8}},"unit":"per_100g"},
{"ingredient":"토마토","nutrition":{"protein":0.9,"fat":0.2,"carbohydrate":3.9,"vitamin":{"vitamin_a":42,"vitamin_c":13.7},"mineral":{"potassium":237,"calcium":10,"iron":0.3}},"unit":"per_100g"},
{"ingredient":"오이","nutrition":{"protein":0.7,"fat":0.1,"carbohydrate":3.6,"vitamin":{"vitamin_a":5,"vitamin_c":2.8},"mineral":{"potassium":147,"calcium":16,"iron":0.3}},"unit":"per_100g"},
{"ingredient":"양파","nutrition":{"protein":1.1,"fat":0.1,"carbohydrate":9.3,"vitamin":{"vitamin_a":2,"vitamin_c":7.4},"mineral":{"potassium":146,"calcium":23,"iron":0.2}},"unit":"per_100g"},
{"ingredient":"마늘","nutrition":{"protein":6.4,"fat":0.5,"carbohydrate":33.1,"vitamin":{"vitamin_a":0,"vitamin_c":31.2},"mineral":{"potassium":401,"calcium":181,"iron":1.7}},"unit":"per_100g"},
{"ingredient":"버섯","nutrition":{"protein":3.1,"fat":0.3,"carbohydrate":3.3,"vitamin":{"vitamin_a":0,"vitamin_c":2.1},"mineral":{"potassium":318,"calcium":3,"iron":0.5}},"unit":"per_100g"},
{"ingredient":"시금치","nutrition":{"protein":2.9,"fat":0.4,"carbohydrate":3.6,"vitamin":{"vitamin_a":469,"vitamin_c":28.1},"mineral":{"potassium":558,"calcium":99,"iron":2.7}},"unit":"per_100g"},
{"ingredient":"케일","nutrition":{"protein":4.3,"fat":0.9,"carbohydrate":8.8,"vitamin":{"vitamin_a":681,"vitamin_c":120},"mineral":{"potassium":491,"calcium":150,"iron":1.5}},"unit":"per_100g"},
{"ingredient":"콩","nutrition":{"protein":9.0,"fat":0.5,"carbohydrate":27.0,"vitamin":{"vitamin_a":1,"vitamin_c":1.5},"mineral":{"potassium":515,"calcium":50,"iron":2.1}},"unit":"per_100g"},
{"ingredient":"완두콩","nutrition":{"protein":5.4,"fat":0.4,"carbohydrate":14.5,"vitamin":{"vitamin_a":38,"vitamin_c":40},"mineral":{"potassium":244,"calcium":25,"iron":1.5}},"unit":"per_100g"},
{"ingredient":"옥수수","nutrition":{"protein":3.4,"fat":1.5,"carbohydrate":19.0,"vitamin":{"vitamin_a":9,"vitamin_c":6.8},"mineral":{"potassium":270,"calcium":2,"iron":0.5}},"unit":"per_100g"},
{"ingredient":"두부","nutrition":{"protein":8.1,"fat":4.8,"carbohydrate":1.9,"vitamin":{"vitamin_a":0,"vitamin_c":0.1},"mineral":{"potassium":121,"calcium":350,"iron":5.4}},"unit":"per_100g"},
{"ingredient":"닭고기","nutrition":{"protein":27.0,"fat":3.6,"carbohydrate":0},"unit":"per_100g"},
{"ingredient":"소고기","nutrition":{"protein":26.1,"fat":15.0,"carbohydrate":0},"unit":"per_100g"},
{"ingredient":"돼지고기","nutrition":{"protein":25.7,"fat":20.0,"carbohydrate":0},"unit":"per_100g"},
{"ingredient":"달걀","nutrition":{"protein":12.6,"fat":10.6,"carbohydrate":1.1},"unit":"per_100g"},
{"ingredient":"달걀노른자","nutrition":{"protein":15.9,"fat":26.5,"carbohydrate":3.6},"unit":"per_100g"},
{"ingredient":"달걀흰자","nutrition":{"protein":10.9,"fat":0.2,"carbohydrate":0.7},"unit":"per_100g"},
{"ingredient":"연어","nutrition":{"protein":20.0,"fat":13.0,"carbohydrate":0},"unit":"per_100g"},
{"ingredient":"대구","nutrition":{"protein":18.0,"fat":0.7,"carbohydrate":0},"unit":"per_100g"},
{"ingredient":"명태","nutrition":{"protein":17.6,"fat":0.8,"carbohydrate":0},"unit":"per_100g"},
{"ingredient":"쌀","nutrition":{"protein":7.1,"fat":0.6,"carbohydrate":77},"unit":"per_100g"},
{"ingredient":"현미","nutrition":{"protein":7.5,"fat":2.7,"carbohydrate":76},"unit":"per_100g"},
{"ingredient":"오트밀","nutrition":{"protein":13.5,"fat":6.5,"carbohydrate":68},"unit":"per_100g"},
{"ingredient":"보리","nutrition":{"protein":12.5,"fat":2.3,"carbohydrate":73},"unit":"per_100g"},
{"ingredient":"배","nutrition":{"protein":0.4,"fat":0.1,"carbohydrate":15},"unit":"per_100g"},
{"ingredient":"사과","nutrition":{"protein":0.3,"fat":0.2,"carbohydrate":14},"unit":"per_100g"},
{"ingredient":"바나나","nutrition":{"protein":1.1,"fat":0.3,"carbohydrate":23},"unit":"per_100g"},
{"ingredient":"아보카도","nutrition":{"protein":2.0,"fat":15.0,"carbohydrate":9},"unit":"per_100g"},
{"ingredient":"블루베리","nutrition":{"protein":0.7,"fat":0.3,"carbohydrate":14},"unit":"per_100g"},
{"ingredient":"딸기","nutrition":{"protein":0.8,"fat":0.4,"carbohydrate":7.7},"unit":"per_100g"},
{"ingredient":"단호박씨","nutrition":{"protein":19,"fat":19,"carbohydrate":54},"unit":"per_100g"},
{"ingredient":"요거트","nutrition":{"protein":3.5,"fat":3.3,"carbohydrate":4.7},"unit":"per_100g"},
{"ingredient":"치즈","nutrition":{"protein":25,"fat":33,"carbohydrate":1.3},"unit":"per_100g"},
{"ingredient":"우유","nutrition":{"protein":3.4,"fat":3.3,"carbohydrate":5},"unit":"per_100g"},
{"ingredient":"미역","nutrition":{"protein":9.9,"fat":0.6,"carbohydrate":44},"unit":"per_100g"},
{"ingredient":"김","nutrition":{"protein":30,"fat":0.3,"carbohydrate":41},"unit":"per_100g"},
{"ingredient":"청경채","nutrition":{"protein":1.5,"fat":0.2,"carbohydrate":2.2},"unit":"per_100g"},
{"ingredient":"파프리카","nutrition":{"protein":1.0,"fat":0.3,"carbohydrate":6},"unit":"per_100g"},
{"ingredient":"가지","nutrition":{"protein":1.0,"fat":0.2,"carbohydrate":6},"unit":"per_100g"},
{"ingredient":"샐러리","nutrition":{"protein":0.7,"fat":0.2,"carbohydrate":3},"unit":"per_100g"},
{"ingredient":"무","nutrition":{"protein":0.7,"fat":0.1,"carbohydrate":3.4},"unit":"per_100g"},
{"ingredient":"순무","nutrition":{"protein":0.9,"fat":0.1,"carbohydrate":6},"unit":"per_100g"},
{"ingredient":"참외","nutrition":{"protein":0.8,"fat":0.2,"carbohydrate":8},"unit":"per_100g"},
]

def flatten_nutrition(nutrition: dict):
    result = {}

    for k, v in nutrition.items():
        if isinstance(v, dict):
            result.update(v)
        else:
            result[k] = v

    return result


def seed_ingredients():

    db: Session = next(get_db())

    # nutrients 미리 로딩
    nutrients = db.query(Nutrients).all()

    nutrient_map = {n.name: n.id for n in nutrients}

    for item in seed_data:

        ingredient_name = item["ingredient"]

        # ingredient 생성
        ingredient = Ingredients(name=ingredient_name)
        db.add(ingredient)
        db.commit()
        db.refresh(ingredient)

        ingredient_id = ingredient.id

        nutrition_data = flatten_nutrition(item["nutrition"])

        for nutrient_name, amount in nutrition_data.items():

            nutrient_id = nutrient_map.get(nutrient_name)

            if not nutrient_id:
                print(f"nutrient not found: {nutrient_name}")
                continue

            record = IngredientsNutritions(
                ingredient_id=ingredient_id,
                nutrient_id=nutrient_id,
                amount=amount
            )

            db.add(record)

        db.commit()

    db.close()

    print("seed complete")


if __name__ == "__main__":
    seed_ingredients()