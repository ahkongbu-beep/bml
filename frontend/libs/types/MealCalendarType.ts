export interface MealCalendar {
    id: number;
    contents: string;
    tags: string[];
    input_date: string;
    month: string;
    meal_condition: string;
    category_id: number;
    category_name: string;
    is_public: string;
    view_count: number;
    like_count: number;
    is_pre_made: string;
    mapped_tags: string[];
    refer_feed_id: number;
    meal_stage: number;
    meal_stage_detail: string;
    image_url: string;
    view_hash: string;
    user: MealUser;
    childs: MealChild;
}

export interface MealUser {
    id: number;
    nickname: string;
    profile_image: string;
    user_hash: string;
}

export interface MealChild {
    child_id: number | null;
    child_name: string;
    child_birth: string;
    child_gender: string;
    is_agent: string;
    allergies: MealChildAllergy[];
}

export interface MealChildAllergy {
    allergy_code: string;
    allergy_name: string;
}