from app.repository.ingredients_repository import IngredientsRepository
from app.serializer.ingredient_serialize import build_ingredient_response

def process_tags(db, ingredients):
    """
    ingredients 처리 - 두 가지 형식 모두 지원
    형식1: [{'id': 38, 'name': '단호박씨', 'score': 0.6}]
    """
    result = []
    for ingredient in ingredients:
        ing_id = None
        ing_name = None
        ing_score = 0

        ing_id = ingredient.get("id")
        ing_name = ingredient.get("name")
        ing_score = ingredient.get("score", 0)

        if ing_id is None or ing_name is None:
            continue

        tag = IngredientsRepository.get_ingredient_by_id(db, ing_id)
        # tag 존재하고 name 일치
        if tag and tag.name == ing_name:
            result.append({
                "id": tag.id,
                "score": ing_score
            })

    return result

def get_ingredient_by_id(db, ingredient_id):
    return IngredientsRepository.get_ingredient_by_id(db, ingredient_id)

def get_ingredient_by_similar_keyword(db, query_text):
    query_text = query_text.strip()
    ingredients = IngredientsRepository.get_like_ingredient_by_name(db, query_text)
    return [ingredient.name for ingredient in ingredients]

def get_ingredient_list(db, params):
    search_params = {}
    if params.get("category"):
        search_params["category"] = params.get("category")

    if params.get("name"):
        search_params["name"] = params.get("name")

    result = IngredientsRepository.get_list(db, search_params)
    return [build_ingredient_response(ingredient) for ingredient in result]

def get_ingredient_by_name(db, ingredient_name):
    ingredient = IngredientsRepository.get_ingredient_by_name(db, ingredient_name)
    if ingredient:
        return build_ingredient_response(ingredient)
    return None

def get_ingredients_join_nutrient(db):
    return IngredientsRepository.get_ingredients_join_nutrient(db)
