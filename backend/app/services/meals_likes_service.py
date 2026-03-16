from app.repository.meals_likes_repository import MealsLikesRepository

def get_meal_like_by_calendar_and_user(db, meal_calendar, user_id):
    return MealsLikesRepository.get_like_by_feed_and_user(db, meal_calendar.id, user_id)

def create_meal_like(db, meal_calendar, user_id):
    new_like = MealsLikesRepository.create(db, meal_calendar.id, user_id)
    return new_like

def delete_meal_like(db, meal_calendar, user_id):
    existing_like = get_meal_like_by_calendar_and_user(db, meal_calendar, user_id)
    if existing_like:
        MealsLikesRepository.delete(db, existing_like.id)

def get_list_of_likes_by_user(db, user_id, limit=30, offset=0):
    return MealsLikesRepository.get_like_user_id(db, user_id, limit, offset)