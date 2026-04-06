from app.repository.meals_likes_repository import MealsLikesRepository
from app.schemas.common_schemas import CommonResponse
from app.schemas.meals_likes_schemas import LikeToggleResponse

def get_likes_by_user_id(db, user_id):
    result = MealsLikesRepository.get_likes_by_user_id(db, user_id)
    return len(result) if result else 0

def get_meal_like_by_calendar_and_user(db, meal_calendar, user_id):
    return MealsLikesRepository.get_like_by_feed_and_user(db, meal_calendar.id, user_id)

def create_meal_like(db, meal_calendar, user_id):
    new_like = MealsLikesRepository.create(db, meal_calendar.id, user_id)
    return new_like

def delete_meal_like(db, meal_calendar, user_id):
    existing_like = get_meal_like_by_calendar_and_user(db, meal_calendar, user_id)
    if existing_like:
        MealsLikesRepository.delete(db, existing_like)

def get_list_of_likes_by_user(db, user_id, limit=30, offset=0):
    return MealsLikesRepository.get_like_user_id(db, user_id, limit, offset)

def increase_meal_like_count(meal_calendar):
    """
    좋아요 증가
    """
    meal_calendar.like_count += 1

def decrease_meal_like_count(meal_calendar):
    """
    좋아요 감소
    """
    meal_calendar.like_count = max(0, meal_calendar.like_count - 1)


def set_toggle_like_process(db, user_id: int, meal_calendar):

    existing_like = get_meal_like_by_calendar_and_user(db, meal_calendar, user_id)
    # 좋아요가 이미 존재하면 취소(삭제), 없으면 추가
    try:
        if existing_like:
            # 좋아요 삭제
            delete_meal_like(db, meal_calendar, user_id)
            # 식단의 좋아요 카운트 감소
            decrease_meal_like_count(meal_calendar)
            is_liked = False
        else:
            # 좋아요 추가
            create_meal_like(db, meal_calendar, user_id)
            # 식단의 좋아요 카운트 증가
            increase_meal_like_count(meal_calendar)  # 좋아요 카운트 증가
            is_liked = True

        # 한 번에 커밋
        db.commit()

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"좋아요 처리 중 오류가 발생했습니다: {str(e)}", data=None)

    data = LikeToggleResponse(
        meal_id=meal_calendar.id,
        like_count=meal_calendar.like_count,
        is_liked=is_liked
    )

    return CommonResponse(success=True, message="좋아요 상태가 성공적으로 변경되었습니다.", data=data)

def toggle_feed_like(db, user_hash, body):
    """
    좋아요 토글 프로세스
    """
    from app.services.users_service import validate_user
    from app.services.meals_service import validate_meal_calendar_view_hash

    try:
        target_user = validate_user(db, user_hash)
        meal_calendar = validate_meal_calendar_view_hash(db, body.meal_hash)

        return set_toggle_like_process(db, target_user.id, meal_calendar)
    except Exception as e:
        return CommonResponse(success=False, error="좋아요 토글 중 오류가 발생했습니다.", data=None)

def meal_like_list(db, user_hash: str, limit: int, offset: int):
    """
    좋아요 리스트 조회
    """
    from app.services.users_service import validate_user
    try:
        user = validate_user(db, user_hash)
        if not user:
            raise Exception("존재하지 않는 사용자입니다.")

        like_list = []
        like_result = get_list_of_likes_by_user(db, user.id, limit, offset)

        for item in like_result:
            data = {
                "meal_id": item.meal_id,
                "contents": item.contents,
                "image_url": item.image_url,
                "liked_at": item.liked_at,
                "meal_hash": item.view_hash,
                "like_hash": item.view_hash,
                "user_hash": item.user_hash
            }
            like_list.append(data)

        return CommonResponse(success=True, message="", data=like_list)
    except Exception as e:
        return CommonResponse(success=False, error=f"사용자 조회 중 오류가 발생했습니다: {str(e)}", data=None)