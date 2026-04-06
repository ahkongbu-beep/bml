

from datetime import datetime
import pytz
from app.schemas.common_schemas import CommonResponse
from app.schemas.admin_schmas import MealListRequest, MealListResponse, NoticeListRequest, NoticeListResponse, NoticesCreateRequest, NoticesUpdateRequest, UserDetailResponse, UserListRequest, UserListResponse, MealForceUpdate, CategoryListRequest, CategoryCreateOrUpdateRequest
from app.schemas.users_childs_schemas import ChildSchema

from app.services.notices_service import get_notice_by_view_hash, get_notice_count, get_notice_list, list_notices, create_notice as create_notice_service, update_notice as update_notice_service, toggle_notice
from app.services.users_childs_service import child_list as child_list_service
from app.services.users_service import get_all_users, get_user_by_nickname, get_user_count, validate_user
from app.services.meals_service import get_meals_list, get_meals_count, update_meal_process, validate_meal_calendar_view_hash
from app.services.categories_codes_service import get_category_code_by_id, get_category_list, insert_category_process, update_category_process, get_category_by_type_and_sort
from app.serializer.meals_serialize import meal_serialize

def time_ago(delta):
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return "방금 전"
    elif seconds < 3600:
        return f"{seconds // 60}분 전"
    elif seconds < 86400:
        return f"{seconds // 3600}시간 전"
    else:
        return f"{seconds // 86400}일 전"

def init_stat(db) -> CommonResponse:
    """
    대시보드 초기 통계 정보 조회 서비스 함수
    """
    user_list = get_all_users(db)
    meals_list = get_meals_list(db, {"is_active": "Y"})

    total_users = len(user_list)
    total_meals = len(meals_list)

    tz = pytz.timezone("Asia/Seoul")
    now = datetime.now(tz)

    # 마지막으로 등록된 피드의 등록시간을 현재 시간에서 빼기
    last_meal = meals_list[0] if meals_list else None
    if last_meal:
        created_at = last_meal.created_at

        # created_at이 naive일 경우 보정
        if created_at.tzinfo is None:
            created_at = tz.localize(created_at)
        else:
            created_at = created_at.astimezone(tz)

        last_regist_meals_time = time_ago(now - created_at)
    else:
        last_regist_meals_time = None

    last_user = user_list[0] if user_list else None
    if last_user:
        created_at = last_user.created_at

        # created_at이 naive일 경우 보정
        if created_at.tzinfo is None:
            created_at = tz.localize(created_at)
        else:
            created_at = created_at.astimezone(tz)

        last_regist_user_time = time_ago(now - created_at)

    last_notice = list_notices(db).data[0] if list_notices(db).data else None

    if last_notice:
        created_at = last_notice.created_at

        # created_at이 naive일 경우 보정
        if created_at.tzinfo is None:
            created_at = tz.localize(created_at)
        else:
            created_at = created_at.astimezone(tz)

        last_regist_notice_time = time_ago(now - created_at)
    else:
        last_regist_notice_time = None

    data = {
        "total_users": total_users,
        "total_meals": total_meals,
        "total_hotdeals": 23,  # 예시 값, 실제로는 핫딜 모델에서 카운트해야 함
        "last_regist_meals_time": str(last_regist_meals_time) if last_regist_meals_time else "데이터 없음",
        "last_regist_user_time": str(last_regist_user_time) if last_regist_user_time else "데이터 없음",
        "last_regist_notice_time": str(last_regist_notice_time) if last_regist_notice_time else "데이터 없음",
    }

    return CommonResponse(success=True, message="대시보드 초기 통계 정보 조회 성공", data=data)

# ====================================================================================
# 공지사항 service
# ====================================================================================
def notices(db, params: NoticeListRequest) -> CommonResponse:
    from app.serializer.notices_serialize import serialize_notice

    """
    공지사항 리스트 조회 서비스 함수
    """
    try:
        if params.offset < 0:
            params.offset = 0

        if params.limit < 1:
            params.limit = 30

        if params.category_id is not None:
            category_code = get_category_code_by_id(db, params.category_id)

            if not category_code:
                raise ValueError("유효하지 않은 카테고리입니다.")

            if category_code.type != "NOTICES_GROUP":
                raise ValueError("유효하지 않은 카테고리입니다.")

        if params.is_important is not None and params.is_important not in ["Y", "N"]:
            raise ValueError("유효하지 않은 중요 여부입니다.")

        if params.order_by and params.order_by not in ["created_at", "updated_at"]:
            raise ValueError("유효하지 않은 정렬 기준입니다.")

        if params.order_direction and params.order_direction not in ["asc", "desc"]:
            raise ValueError("유효하지 않은 정렬 방향입니다.")

        filter_params = params.model_dump(exclude_none=True)
        total = get_notice_count(db, filter_params)
        result = get_notice_list(db, filter_params)

        notice_list = [
            serialize_notice(notice, category_text) for notice, category_text in result
        ]

        data = NoticeListResponse(
            total=total,
            offset=params.offset,
            limit=params.limit,
            notice_list=notice_list
        )

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    return CommonResponse(success=True, message="", data=data)

def create_notice(db, params: NoticesCreateRequest, client_ip: str) -> CommonResponse:
    """
    공지사항 등록 서비스 함수
    """
    try:
        category_code = get_category_code_by_id(db, params.category_id)
        if not category_code or category_code.type != "NOTICES_GROUP":
            raise ValueError("유효하지 않은 카테고리입니다.")

        create_notice_service(params, client_ip, db)

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    return CommonResponse(success=True, message="공지사항 등록 성공", data=None)

def update_notice(db, view_hash: str, params: NoticesUpdateRequest, client_ip: str) -> CommonResponse:
    """
    공지사항 수정 서비스 함수
    """
    try:
        notice = get_notice_by_view_hash(db, view_hash)
        if not notice:
            raise ValueError("유효하지 않은 공지사항입니다.")

        params.client_id = client_ip

        update_notice_result = update_notice_service(params, view_hash, db)

        if not update_notice_result:
            raise Exception("공지사항 수정에 실패했습니다.")

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    return CommonResponse(success=True, message="공지사항 수정 성공", data=None)

def delete_notice(db, client_ip, view_hash: str) -> CommonResponse:
    """
    공지사항 삭제 서비스 함수
    """
    try:
        notice = get_notice_by_view_hash(db, view_hash)
        if not notice:
            raise ValueError("유효하지 않은 공지사항입니다.")

        toggle_notice(notice, client_ip, db)

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    return CommonResponse(success=True, message="공지사항 삭제 성공", data=None)
# ====================================================================================
# 카테고리 service
# ====================================================================================
def category_list(db, params: CategoryListRequest) -> CommonResponse:
    """
    카테고리 리스트 조회 서비스 함수
    """
    try:
        if params.offset < 0:
            params.offset = 0

        if params.limit < 1:
            params.limit = 20


        search_params = params.model_dump(exclude_none=True)
        data = get_category_list(db, search_params)

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    return CommonResponse(success=True, message="카테고리 조회 성공", data=data)

def category_upsert(db, params: CategoryCreateOrUpdateRequest) -> CommonResponse:
    """
    카테고리 생성 및 수정 서비스 함수
    - id가 존재하면 수정, 없으면 생성
    """
    insert_mode = True if not params.id and not params.code else False

    upsert_params = params.model_dump(exclude_none=True)

    try:
        # 카테고리 생성
        if insert_mode:
            ext_category = get_category_by_type_and_sort(db, upsert_params.type, upsert_params.sort)
            if ext_category and ext_category.id != category.id:
                raise ValueError("이미 존재하는 type과 sort 조합입니다.")

            result = insert_category_process(db, upsert_params)

        # 카테고리 수정
        else:
            if not upsert_params.get("id"):
                raise ValueError("카테고리 ID가 필요합니다.")

            category = get_category_code_by_id(db, params.id)  # 존재 여부 확인
            if not category:
                raise ValueError("유효하지 않은 카테고리입니다.")

            update_params = {
                "type": upsert_params.get("type", category.type),
                "code": upsert_params.get("code", category.code),
                "value": upsert_params.get("value", category.value),
                "sort": upsert_params.get("sort", category.sort),
                "is_active": upsert_params.get("is_active", category.is_active)
            }

            result = update_category_process(db, category, update_params)

        if not result:
            raise Exception("카테고리 저장에 실패했습니다.")

        return CommonResponse(success=True, message="카테고리 저장 성공", data=None)
    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

# ====================================================================================
# 사용자정보 service
# ====================================================================================
def user_list(db, body: UserListRequest) -> CommonResponse:
    """
    사용자 리스트 조회 서비스 함수
    """
    from app.serializer.users_serialize import serialize_user

    if body.offset < 0:
        body.offset = 0

    if body.limit < 1:
        body.limit = 30

    try:

        total_count = get_user_count(db, params=body.model_dump(exclude_none=True))
        user_result = get_all_users(db, params=body.model_dump(exclude_none=True))

        user_list = [serialize_user(user) for user in user_result]

        data = UserListResponse(
            total=total_count,
            offset=body.offset,
            limit=body.limit,
            user_list=user_list
        )

        return CommonResponse(success=True, message="회원 조회 성공", data=data)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

def user_detail(db, user_hash: str) -> CommonResponse:
    """
    사용자 상세 조회 서비스 함수
    """
    try:
        user = validate_user(db, user_hash)
        user_child = child_list_service(db, {"user_id": user.id})

        serialized_children = [
            ChildSchema(
                child_id=child.id,
                child_name=child.child_name,
                child_birth=child.child_birth,
                child_gender=child.child_gender,
                is_agent=child.is_agent,
                allergies=None
            )
            for child in user_child
        ]

        data = UserDetailResponse(
            user=user,
            child_list=serialized_children
        )

        return CommonResponse(success=True, message="회원 상세 조회 성공", data=data)

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

# ====================================================================================
# 식단 service
# ====================================================================================
def meal_list(db, params: MealListRequest) -> CommonResponse:
    """
    식단 리스트 조회 서비스 함수
    """
    try:
        if params.offset < 0:
            params.offset = 0
        if params.limit < 1:
            params.limit = 30

        if params.nickname:
            params.nickname = params.nickname.strip()
            user = get_user_by_nickname(db, params.nickname)
            if not user:
                raise ValueError("해당 닉네임을 가진 사용자가 존재하지 않습니다.")

            params.user_id = user.id

        if params.category_code:
            category_code = get_category_code_by_id(db, params.category_code)
            if not category_code or category_code.type != "MEALS_CATEGORY":
                raise ValueError("유효하지 않은 카테고리입니다.")

        search_params = params.model_dump(exclude_none=True)

        total = get_meals_count(db, search_params)
        meal_result = get_meals_list(db, search_params, include=["category", "user"])
        meal_list = [meal_serialize(row) for row in meal_result]

        data = MealListResponse(
            offset=params.offset,
            limit=params.limit,
            total=total,
            meal_list=meal_list
        )

        return CommonResponse(success=True, message="식단 조회 성공", data=data)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

def meal_detail(db, meal_hash: str) -> CommonResponse:
    """
    식단 상세 조회 서비스 함수
    """

    try:
        meal_result = get_meals_list(db, {"meal_hash": meal_hash}, include=["category", "user"])
        if not meal_result:
            raise ValueError("유효하지 않은 식단입니다.")

        meal = meal_result[0]
        data = meal_serialize(meal)

        return CommonResponse(success=True, message="식단 상세 조회 성공", data=data)

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

def force_update_meal(db, meal_hash: str, params: MealForceUpdate) -> CommonResponse:
    """
    식단 강제 업데이트 서비스 함수
    - is_active 필드만 업데이트 가능
    - todo : reason 을 추가해서 업데이트 사유 기록하기
    """
    try:
        meal = validate_meal_calendar_view_hash(db, meal_hash)

        params = {
            "is_active": params.is_active if params.is_active is not None else meal.is_active
        }

        result = update_meal_process(db, meal, params)
        if not result:
            raise Exception("식단 강제 업데이트에 실패했습니다.")

        return CommonResponse(success=True, message="식단 강제 업데이트 성공", data=None)

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)