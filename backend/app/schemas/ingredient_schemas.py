from pydantic import BaseModel

class IngredientSchema(BaseModel):
    id: int
    name: str
    category: str
    allergy_risk: str



