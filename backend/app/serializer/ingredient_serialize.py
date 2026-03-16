from app.schemas.ingredient_schemas import IngredientSchema
def build_ingredient_response(ingredient):
    return IngredientSchema(
        id=ingredient.id,
        name=ingredient.name,
        category=ingredient.category,
        allergy_risk=ingredient.allergy_risk
    )