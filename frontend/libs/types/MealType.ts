export interface MealItem {
  title: string;
  contents: string;
  tags: string[];
  input_date: string;
  month: string;
  category_id: number;
  category_name: string;
  view_hash: string;
  user: {
    nickname: string;
    profile_image: string;
    user_hash: string;
  };
}

export interface MealCalendar {
  date: string; // 'YYYY-MM-DD' 형식
  meals: MealItem[]; // 식단 항목들
}

export interface DailyMealsCategory {
    exist_categories: string[]; // 해당 날짜에 등록된 식단 카테고리 목록
}

export interface MealCalendarParams {
  user_hash: string;
  month: string; // 'YYYY-MM' 형식
}
