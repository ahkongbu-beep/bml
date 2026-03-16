from app.repository.meals_calendars_images_repository import MealsCalendarsImagesRepository

async def get_user_month_image_map(db, user_id: int):
    """
    해당 월에 활성화된 식단 캘린더 이미지 리스트 조회
    """
    meal_image_list = {}
    result = await MealsCalendarsImagesRepository.get_active_user(db, user_id, order_by="month desc")

    if not result:
        return meal_image_list

    for r in result:
        meal_image_list[r.month] = r.image
    return meal_image_list

async def upload_calendar_image(db, user_id: int, month: str, file):
    image_result = await MealsCalendarsImagesRepository.upload(db, user_id, month, file)
    if not image_result or image_result == False:
        raise Exception("이미지 업로드에 실패했습니다.")
    return image_result

def delete_calendar_image_by_month(db, user_id: int, month: str):
    """
    해당 월의 식단 캘린더 이미지 삭제
    """
    try:
        MealsCalendarsImagesRepository.delete_active_calendar_images_by_month(db, user_id, month)
    except Exception as e:
        raise Exception("식단 캘린더 이미지 삭제 중 오류가 발생했습니다. " + str(e))