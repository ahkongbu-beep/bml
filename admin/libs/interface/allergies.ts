export interface AllergyItem {
  id: number;
  icon: string;
  food_code: string;
  food_type: string;
  food_name: string;
}

export interface AllergySaveBody {
  food_name: string;
  food_type: string;
  food_code?: string;
  icon?: string;
}
