from app.repository.feed_repository import FeedRepository
from app.repository.feeds_tags_mappers_repository import FeedsTagsMappersRepository
from app.repository.users_childs_allergies_repository import UsersChildsAllergiesRepository

from app.schemas.common_schemas import CommonResponse
from app.schemas.feeds_schemas import FeedsResponse, FeedsUserResponse, FeedLikeResponseData, FeedListRequest
from app.schemas.users_schemas import AllergyItemSchema, UserChildItemSchema

from app.services.categories_codes_service import get_category_code_by_id
from app.services.meals_comments_service import build_comment_tree, get_comment_list_by_user_meal_id, get_meal_comments_by_hash, create_meal_comment, delete_meal_comment
from app.services.users_service import validate_user, validate_user_id
from app.services.meals_likes_service import get_list_of_likes_by_user, get_meal_like_by_calendar_and_user, create_meal_like, delete_meal_like
from app.services.meals_service import validate_meal_calendar_id, get_meal_calendar_by_id, get_user_meal_calendar, create_meal_calendar
from app.services.ingredients_service import get_ingredient_by_similar_keyword, get_ingredient_list
from app.services.users_childs_service import get_agent_childs, validate_agent_childs
from app.services.denies_users_service import get_denies_user_id_list
from app.services.attaches_files_service import copy_attache_file, get_attache_files_by_model_id, save_upload_file

"""
부모 hash 가 넘어오면 부모 id 를 반환
"""
def get_parent_id_by_hash(db, parent_hash):
    if not parent_hash:
        return 0

    parent_comment = get_meal_comments_by_hash(db, parent_hash)
    if not parent_comment:
        return 0

    return parent_comment.id

def increase_view_count(db, feed, is_commit=True):
    feed.view_count += 1
    if is_commit:
        db.commit()
    else:
        db.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음
    return

"""
좋아요 증가 및 감소 함수
"""
def increase_meal_like_count(db, meal_calendar):
    meal_calendar.like_count += 1

def decrease_meal_like_count(db, meal_calendar):
    meal_calendar.like_count = max(0, meal_calendar.like_count - 1)

def set_toggle_like_process(db, user_id: int, meal_calendar):

    existing_like = get_meal_like_by_calendar_and_user(db, meal_calendar, user_id)

    # 좋아요가 이미 존재하면 취소(삭제), 없으면 추가
    try:
        if existing_like:
            # 좋아요 삭제
            delete_meal_like(db, meal_calendar, user_id)
            # 식단의 좋아요 카운트 감소
            decrease_meal_like_count(db, meal_calendar)
            is_liked = False
        else:
            # 좋아요 추가
            create_meal_like(db, meal_calendar, user_id)
            # 식단의 좋아요 카운트 증가
            increase_meal_like_count(db, meal_calendar)  # 좋아요 카운트 증가
            is_liked = True

        # 한 번에 커밋
        db.commit()

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"좋아요 처리 중 오류가 발생했습니다: {str(e)}", data=None)

    data = FeedLikeResponseData(
        meal_id=meal_calendar.id,
        like_count=meal_calendar.like_count,
        is_liked=is_liked
    )

    return CommonResponse(success=True, message="좋아요 상태가 성공적으로 변경되었습니다.", data=data)

def toggle_feed_like(db, meal_id: int, user_hash: str):

    try:
        target_user = validate_user(db, user_hash)
        meal_calendar = validate_meal_calendar_id(db, meal_id)
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    return set_toggle_like_process(db, target_user.id, meal_calendar)

def get_child_and_allergies(db, user_id):
    child = get_agent_childs(db, {"user_id": user_id})
    allergies = UsersChildsAllergiesRepository.get_list_by_user_and_child(db, user_id, child.id) if child else []
    return child, allergies

def feed_detail_response(meal_calendar, user, category, tags, images, child, allergies, comments, viewer_hash):
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

# 피드 상세보기
def get_feed_detail(db, meal_id: int, user_hash: str):
    try:
        user = validate_user(db, user_hash)  # 인증된 사용자만 접근 가능
        meal_calendar = validate_meal_calendar_id(db, meal_id)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    target_user = validate_user_id(db, meal_calendar.user_id)

    # 조회수 증가
    increase_view_count(db, meal_calendar, is_commit=True)

    # 태그 목록 조회
    tags = FeedsTagsMappersRepository.get_tags_mapper_by_model_and_model_id(db, "Feed", meal_calendar.id)
    # 이미지 목록 조회
    images = [f.image_url for f in get_attache_files_by_model_id(db, "Meals", meal_calendar.id)]
    # 대표자녀 추출 및 알레르기 정보 조회
    child, allergies = get_child_and_allergies(db, target_user.id)

    category = get_category_code_by_id(db, meal_calendar.category_code) if meal_calendar.category_code else None

    comment_params = {
        "meal_id": meal_calendar.id,
        "user_id": user.id,
    }
    comment_list = get_comment_list_by_user_meal_id(db, comment_params, extra={})
    comments = build_comment_tree(comment_list)

    feed_data = feed_detail_response(
        meal_calendar, target_user, category, tags, images, child, allergies, comments, user_hash
    )

    return CommonResponse(success=True, message="", data=feed_data)

def copy_feed(db, user_hash: str, params):
    try:
        user = validate_user(db, user_hash)  # 인증된 사용자만 접근 가능

        user_childs = validate_agent_childs(db, {"user_id": user.id}) # 대표 자녀 정보 확인

        target_meal = get_meal_calendar_by_id(db, params.target_meal_id)
        if not target_meal:
            raise Exception("존재하지 않는 피드입니다.")

        category_code = get_category_code_by_id(db, params.category_code)
        if not category_code:
            return CommonResponse(success=False, error="존재하지 않는 카테고리 코드입니다.", data=None)

        exist_calendar = get_user_meal_calendar(db, {
            "user_id": user.id,
            "input_date": params.input_date,
            "child_id": user_childs.id,
            "category_code_id": category_code.id
        })

        if exist_calendar:
            return CommonResponse(success=False, error="해당 날짜에 이미 식단이 존재합니다.", data=None)

        new_calcendar = create_meal_calendar(db, {
            "user_id": user.id,
            "title": params.title,
            "refer_feed_id": target_meal.id,
            "month": params.input_date[:7],
            "input_date": params.input_date,
            "child_id": user_childs.id,
            "contents": target_meal.contents,
            "category_code": category_code.id,
            "is_public": "Y"
        }, is_commit=False)

        if not new_calcendar:
            raise Exception("식단 복사에 실패했습니다.")

        # 이미지 복사 - 기존 이미지의 파일을 물리적으로 복사하여 새로운 식단에 연결
        attache_files = get_attache_files_by_model_id(db, "Meals", target_meal.id)

        for feeds_image in attache_files:

            result = copy_attache_file(
                origin_model="Meals",
                origin_model_instance=feeds_image,
                target_model="Meals",
                target_model_instance=new_calcendar
            )

            if result == False:
                raise Exception("피드 이미지 복사에 실패했습니다.")

            save_upload_file(db, model="Meals", model_id=new_calcendar.id, result=result)

        db.commit()
        return CommonResponse(success=True, message="피드가 성공적으로 복사되었습니다.", data=None)
    except Exception as e:
        return CommonResponse(success=False, error=f"피드 복사 중 오류가 발생했습니다: {str(e)}", data=None)

def validate_feed_params(db, filters: FeedListRequest, user_hash: str, type: str = "list"):
    params = {
        "is_deleted": "N"
    }

    # 다음 cursor 정보
    if filters.cursor is not None:
        params["cursor"] = filters.cursor

    if filters.nickname is not None:
        params["nickname"] = filters.nickname

    if filters.meal_stage is not None:
        params["meal_stage"] = filters.meal_stage

    if filters.meal_stage_detail is not None:
        params["meal_stage_detail"] = filters.meal_stage_detail

    if filters.start_date is not None and filters.end_date is not None:
        params["start_date"] = filters.start_date
        params["end_date"] = filters.end_date

    # target_user_hash가 있으면 해당 사용자의 피드만 조회
    if filters.target_user_hash is not None:
        target_user = validate_user(db, filters.target_user_hash)
        if not target_user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)
        params["target_user_id"] = target_user.id

    if user_hash is not None:
        user = validate_user(db, user_hash)

        if not user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

        params["my_user_id"] = user.id  # is_liked 조회를 위해 항상 설정
        params['type'] = type
        params['view_type'] = filters.view_type

        if type == "list":
            # 차단된 사용자 목록 조회
            deny_users = get_denies_user_id_list(db, user.id)
            deny_users_ids = [du.deny_user_id for du in deny_users]

            params["deny_user_ids"] = deny_users_ids
        else:
            params["user_id"] = user.id

    return params

""" 피드 목록 조회 """
def list_feeds(db, user_hash: str, filters: FeedListRequest):
    params = validate_feed_params(db, filters, user_hash)
    extra = {
        "limit": filters.limit,
        "offset": filters.offset,
        "order_by": filters.sort_by
    }
    feeds_list = FeedRepository.get_list(db, params=params, extra=extra).getData()
    return CommonResponse(success=True, message="", data=feeds_list)

"""
재료 리스트
"""
def list_ingredients(db, user_hash: str, category: str):
    try:
        user = validate_user(db, user_hash) if user_hash else None
        ingredients = get_ingredient_list(db, {"category": category})

        # category 별로 묶음
        tree_build_ingredients = []
        for ingredient in ingredients:
            category_name = ingredient.category
            existing_category = next((item for item in tree_build_ingredients if item["category"] == category_name), None)

            ingredient_data = {
                "id": ingredient.id,
                "name": ingredient.name,
                "allergy_risk": ingredient.allergy_risk
            }

            if existing_category:
                existing_category["ingredients"].append(ingredient_data)
            else:
                tree_build_ingredients.append({
                    "category": category_name,
                    "ingredients": [ingredient_data]
                })


        return CommonResponse(success=True, message="", data=tree_build_ingredients)
    except Exception as e:
        return CommonResponse(success=False, error=f"재료 검색 중 오류가 발생했습니다: {str(e)}", data=None)
"""
재료 검색
"""
def search_ingredients(db, query_text: str):

    try:
        if not query_text:
            return CommonResponse(success=True, message="검색어가 비어있습니다.", data=[])

        ingredient_list = get_ingredient_by_similar_keyword(db, query_text)

        return CommonResponse(success=True, message="", data=ingredient_list)
    except Exception as e:
        return CommonResponse(success=False, error=f"피드 태그 검색 중 오류가 발생했습니다: {str(e)}", data=None)

""" 피드 댓글 조회 """
def get_comment_list(db, user_hash, meal_id, limit, offset):

    try:
        user = validate_user(db, user_hash)
        meal_calendar = validate_meal_calendar_id(db, meal_id)

        params = {
            "meal_id": meal_calendar.id,
            "user_id": user.id,
            "is_active": "Y"
        }

        result_data = get_comment_list_by_user_meal_id(db, params, extra={"limit": limit, "offset": offset})

        if not result_data:
            return CommonResponse(success=True, message="댓글이 없습니다.", data=[])

        comment_tree = build_comment_tree(result_data)

        return CommonResponse(success=True, message="", data=comment_tree)
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

""" 피드 댓글 생성 """
def create_comment(db, user_hash: str, meal_id: int, comment: str, parent_hash: str = None):
    try:
        user = validate_user(db, user_hash)

        meal_calendar = get_meal_calendar_by_id(db, meal_id)
        if not meal_calendar:
            raise Exception("존재하지 않는 피드입니다.")

        parent_id = get_parent_id_by_hash(db, parent_hash)

        params = {
            "meal_id": meal_calendar.id,
            "user_id": user.id,
            "comment": comment,
            "parent_id": parent_id,
            "parent_hash": parent_hash if parent_id > 0 else ""
        }

        new_comment = create_meal_comment(db, params)
        if not new_comment:
            raise Exception("댓글 생성에 실패했습니다.")

        return CommonResponse(success=True, message="댓글이 성공적으로 생성되었습니다.", data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

def delete_feed_comment(db, comment_hash: str, user_hash: str):
    try:
        user = validate_user(db, user_hash)
        if not user:
            raise Exception("존재하지 않는 사용자입니다.")

        comment = get_meal_comments_by_hash(db, comment_hash)
        if not comment:
            raise Exception("존재하지 않는 댓글입니다.")

        if comment.user_id != user.id:
            raise Exception("댓글 삭제 권한이 없습니다.")

        if not delete_meal_comment(db, comment, user.id):
            raise Exception("댓글 삭제에 실패했습니다.")

        db.commit()

        return CommonResponse(
            success=True,
            message="댓글이 성공적으로 삭제되었습니다.",
            data=None
        )

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"댓글 삭제 중 오류가 발생했습니다: {str(e)}", data=None)

""" 내가 좋아요한 피드 목록 조회 """
def list_feed_likes(db, user_hash: str, limit: int, offset: int):
    try:
        user = validate_user(db, user_hash)
        if not user:
            raise Exception("존재하지 않는 사용자입니다.")

        feed_like_list = []
        feed_like_result = get_list_of_likes_by_user(db, user.id, limit, offset)

        for item in feed_like_result:
            data = {
                "feed_id": item.feed_id,
                "content": item.content,
                "feed_image_url": item.feed_image_url,
                "liked_at": item.liked_at
            }
            feed_like_list.append(data)

        return CommonResponse(success=True, message="", data=feed_like_list)
    except Exception as e:
        return CommonResponse(success=False, error=f"사용자 조회 중 오류가 발생했습니다: {str(e)}", data=None)
