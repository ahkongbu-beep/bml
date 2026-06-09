export interface OrgIngredientNutrition {
  nutrient_name: string;
  nutrient_unit: string;
  amount: string;
}

export interface OrgIngredient {
  id: number;
  name: string;
  category: string;
  is_active: string;
  ingredient_nutrition: OrgIngredientNutrition[];
}
