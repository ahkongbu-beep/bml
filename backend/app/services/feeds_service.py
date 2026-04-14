from app.repository.feed_repository import FeedRepository
from app.schemas.common_schemas import CommonResponse
from app.schemas.feeds_schemas import FeedListRequest

from app.services.categories_codes_service import get_category_code_by_id
from app.services.meals_comments_service import build_comment_tree, get_comment_list_by_user_meal_id, get_meal_comments_by_hash, create_meal_comment, delete_meal_comment
from app.services.users_service import validate_user
from app.services.meals_likes_service import get_list_of_likes_by_user
from app.services.meals_service import generate_meal_calendar_hash, validate_meal_calendar_id, get_meal_calendar_by_id, get_user_meal_calendar, insert_meal_proccess
from app.services.ingredients_service import get_ingredient_by_similar_keyword, get_ingredient_list, process_tags
from app.services.ingredients_mappers_service import insert_ingredient_mapper
from app.services.users_childs_service import get_agent_childs, validate_agent_childs
from app.services.denies_users_service import get_denies_user_id_list
from app.services.attaches_files_service import copy_attache_file, get_attache_files_by_model_id, save_upload_file
from app.services.users_childs_allergies_service import get_user_child_allergies

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


def get_child_and_allergies(db, user_id):
    child = get_agent_childs(db, {"user_id": user_id})
    allergies = get_user_child_allergies(db, user_id, child.id) if child else []
    return child, allergies

async def copy_feed(db, user_hash: str, params):
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

        view_hash = await generate_meal_calendar_hash(user.id, params.input_date, category_code.id, user_childs.id)

        new_calcendar = await insert_meal_proccess(db, user, category_code, {
            "user_id": user.id,
            "child_id": user_childs.id,
            "refer_feed_id": target_meal.id,
            "is_pre_made": target_meal.is_pre_made,
            "category_code": category_code.id,
            "title": params.title,
            "month": params.input_date[:7],
            "input_date": params.input_date,
            "contents": params.memo,
            "view_hash": view_hash,
            "is_public": "N"
        })

        if not new_calcendar:
            raise Exception("식단 복사에 실패했습니다.")

        # 이미지 복사 - 기존 이미지의 파일을 물리적으로 복사하여 새로운 식단에 연결
        attache_files = get_attache_files_by_model_id(db, "Meals", target_meal.id)
        print(f"⭕⭕복사할 이미지1: {attache_files}")

        for feeds_image in attache_files:

            result = copy_attache_file(
                origin_model="Meals",
                origin_model_instance=feeds_image,
                target_model="Meals",
                target_model_instance=new_calcendar
            )

            if result == False:
                raise Exception("이미지 복사에 실패했습니다.")

            await save_upload_file(db, model="Meals", model_id=new_calcendar.id, result=result)

        # 재료 Mapper 등록
        if params.ingredients:
            ingredient_result = process_tags(db, params.ingredients)
            if ingredient_result:
                insert_ingredient_mapper(db, new_calcendar.id, ingredient_result)

        db.commit()
        return CommonResponse(success=True, message="피드가 성공적으로 복사되었습니다.", data=None)
    except Exception as e:
        db.rollback()
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
        validate_user(db, user_hash) if user_hash else None
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
    except ValueError as ve:
        return CommonResponse(success=False, error=f"잘못된 입력값입니다: {str(ve)}", data=None)
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

        like_list = []
        like_result = get_list_of_likes_by_user(db, user.id, limit, offset)

        for item in like_result:
            data = {
                "meal_id": item.meal_id,
                "contents": item.contents,
                "image_url": item.image_url,
                "liked_at": item.liked_at
            }
            like_list.append(data)

        return CommonResponse(success=True, message="", data=like_list)
    except Exception as e:
        return CommonResponse(success=False, error=f"사용자 조회 중 오류가 발생했습니다: {str(e)}", data=None)
