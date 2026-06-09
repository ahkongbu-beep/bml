export interface IngredientNutrition {
  nutrient_name: string;
  nutrient_unit: string;
  amount: string;
}

export interface IngredientRequest {
  id: number;
  user_id: number;
  user_nickname: string;
  name: string;
  status: string; // 'N' = 대기, 'Y' = 승인, 'R' = 거절
  created_at: string;
  ingredient_nutrition?: IngredientNutrition[];
}
