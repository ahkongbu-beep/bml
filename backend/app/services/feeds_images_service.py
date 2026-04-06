from app.repository.meals_calendars_images_repository import MealsCalendarsImagesRepository

async def create_meal_image(db, params):
    new_image = await MealsCalendarsImagesRepository.create(db, {
        "user_id": params['user_id'],
        "month": params['month'],
        "image": params['image'],
        "is_active": params['is_active']
    }, is_commit=False)

    return new_image
