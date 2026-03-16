from app.repository.ingredients_repository import IngredientsRepository

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