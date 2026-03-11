from app.repository.ingredients_repository import IngredientsRepository


def process_tags(db, ingredients):
    ingredient_ids = []
    for tag_name in ingredients:
        tag = IngredientsRepository.get_ingredient_by_name(db, tag_name)
        db.flush()
        ingredient_ids.append(tag.id)
    return ingredient_ids
