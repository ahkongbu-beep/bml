from app.repository.ingredients_repository import IngredientsRepository
from app.serializer.ingredient_serialize import build_ingredient_response

def process_tags(db, ingredients):
    ingredient_ids = []
    for tag_name in ingredients:
        tag = IngredientsRepository.get_ingredient_by_name(db, tag_name)
        db.flush()
        ingredient_ids.append(tag.id)
    return ingredient_ids

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