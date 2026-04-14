from pydantic import BaseModel

class IngredientSchema(BaseModel):
    id: int
    name: str
    category: str
    allergy_risk: str

class IngredientMapperItemSchema(BaseModel):
    ingredient_id: int
    mapped_score: float
    mapped_tags: str

