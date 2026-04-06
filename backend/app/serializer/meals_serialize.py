"""
식단 캘린더 Serializer
"""
from app.schemas.feeds_schemas import FeedsResponse, FeedsUserResponse
from app.schemas.users_schemas import UserChildItemSchema, AllergyItemSchema
from app.schemas.meals_schemas import MealItem, MealsCalendarResponse
from app.schemas.common_schemas import CommonResponse

def meal_serialize(meal):
    return MealItem(
        meal_id=meal.id,
        category_code=str(meal.category_code),
        category_name=getattr(meal, 'category_name', None),
        user_id=meal.user_id,
        nickname=meal.nickname,
        profile_image=meal.profile_image,
        user_hash=meal.user_hash,
        username=meal.username,
        input_date=str(meal.input_date) if meal.input_date else None,
        meal_stage=meal.meal_stage,
        meal_stage_detail=meal.meal_stage_detail,
        contents=meal.contents,
        month=meal.month,
        meal_condition=meal.meal_condition,
        view_count=meal.view_count,
        like_count=meal.like_count,
        is_public=meal.is_public,
        is_pre_made=meal.is_pre_made,
        is_active=meal.is_active,
        created_at=str(meal.created_at) if meal.created_at else "",
        updated_at=str(meal.updated_at) if meal.updated_at else "",
        deleted_at=str(meal.deleted_at) if meal.deleted_at else None,
        view_hash=meal.view_hash,
    )

def get_feed_type_calendars_data(result):
    """
    피드 형태 식단 리스트 직렬화
    """
    try:
        return [
            MealsCalendarResponse(
                id=v.id,
                title=v.title,
                contents=v.contents,
                input_date=f"{v.input_date.year}-{v.input_date.month}-{v.input_date.day}",
                month=v.month,
                child_id=v.child_id,
                refer_feed_id=v.refer_feed_id,
                image_url=v.image_url if v.image_url else None,
                category_id=v.category_id,
                category_name=v.category_name,
                is_pre_made=v.is_pre_made,
                view_count=v.view_count,
                like_count=v.like_count if v.like_count else 0,
                meal_condition=v.meal_condition,
                is_liked=v.is_liked,
                is_public=v.is_public,
                meal_stage=v.meal_stage,
                meal_stage_detail=v.meal_stage_detail,
                refer_info={
                    "refer_meal_hash": v.refer_meal_hash,
                    "refer_user_hash": v.refer_user_hash,
                    "refer_user_nickname": v.refer_user_nickname
                } if v.refer_info else None,
                mapped_tags=[
                    {
                        "mapper_name": name.strip(),
                        "mapper_score": score.strip(),
                        "mapper_id": id.strip()
                    }
                    for name, score, id in zip(
                        v.mapped_tags.split(',') if v.mapped_tags else [],
                        v.mapped_scores.split(',') if v.mapped_scores else [],
                        v.mapped_ids.split(',') if v.mapped_ids else []
                    )
                ],
                user=FeedsUserResponse(
                    id=v.user_id,
                    nickname=v.nickname,
                    profile_image=v.profile_image if v.profile_image else None,
                    user_hash=v.user_hash
                ),
                childs=UserChildItemSchema(
                    child_id=v.agent_child_id if hasattr(v, "agent_child_id") and v.agent_child_id else v.child_id,
                    child_name=v.child_name,
                    child_birth=v.child_birth,
                    child_gender=v.child_gender,
                    is_agent=v.is_agent,
                    allergies=[
                        AllergyItemSchema(
                            allergy_code=code.strip() if code else None,
                            allergy_name=name.strip()
                        )
                        for code, name in zip(
                            v.allergy_codes.split(',') if v.allergy_codes else [],
                            v.allergy_names.split(',') if v.allergy_names else []
                        )
                    ] if v.allergy_names else []
                ),
                view_hash=v.view_hash
            )
            for v in result
        ]
    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 조회 중 오류가 발생했습니다. " + str(e), data=None)


def feed_detail_response(meal_calendar, user, category, tags, images, child, allergies, comments, viewer_hash):
    """
    식단 캘린더 상세 조회 응답 serializer

    Args:
        meal_calendar: MealsCalendars 모델 인스턴스
        user: Users 모델 인스턴스
        category: CategoryCode 모델 인스턴스
        tags: 재료 태그 리스트
        images: 이미지 URL 리스트
        child: UsersChilds 모델 인스턴스
        allergies: 알레르기 정보 리스트
        comments: 댓글 리스트
        viewer_hash: 조회자의 user_hash

    Returns:
        FeedsResponse: 직렬화된 응답 객체
    """
    return FeedsResponse(
        id=meal_calendar.id,
        user_id=meal_calendar.user_id,
        title=meal_calendar.title,
        content=meal_calendar.contents,
        is_published=meal_calendar.is_public,
        view_count=meal_calendar.view_count,
        like_count=meal_calendar.like_count,
        meal_condition=meal_calendar.meal_condition,
        created_at=meal_calendar.created_at,
        updated_at=meal_calendar.updated_at,
        category_id=meal_calendar.category_code,
        category_name=getattr(category, "value", None),
        tags=tags,
        images=images,
        user_hash=viewer_hash,
        user=FeedsUserResponse(
            id=user.id,
            nickname=user.nickname,
            profile_image=user.profile_image,
            user_hash=user.view_hash,
        ),
        childs=UserChildItemSchema(
            child_id=getattr(child, "id", None),
            child_name=getattr(child, "child_name", None),
            child_birth=getattr(child, "child_birth", None),
            child_gender=getattr(child, "child_gender", None),
            is_agent=getattr(child, "is_agent", None),
            allergies=[
                AllergyItemSchema(allergy_code=a.allergy_code, allergy_name=a.allergy_name)
                for a in (allergies or [])
            ]
        ),
        comments=comments
    )
