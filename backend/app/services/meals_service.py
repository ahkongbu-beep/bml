"""
식단 캘린더 service 가이드
"""
from app.repository.meals_calendars_repository import MealsCalendarsRepository
from app.schemas.common_schemas import CommonResponse
from app.schemas.meals_schemas import FeedListRequest
from app.libs.hash_utils import generate_sha256_hash
from app.services.ingredients_service import  process_tags, get_ingredient_by_name
from app.services.ingredients_mappers_service import get_ingredient_mappers_by_meal_id, insert_ingredient_mapper, delete_ingredient_mapper
from app.services.attaches_files_service import get_attache_files_by_model_id, soft_delete_file_by_model_id, upload_file, save_upload_file
from app.services.users_service import validate_user, validate_user_id
from app.services.feeds_images_service import create_meal_image
from app.services.denies_users_service import get_denies_user_id_list
from app.services.users_childs_service import get_agent_childs
from app.services.categories_codes_service import get_category_code_by_id
from app.services.meals_calendars_images_service import get_user_month_image_map, delete_calendar_image_by_month, upload_calendar_image
from app.services.meals_comments_service import build_comment_tree, get_comment_list_by_user_meal_id
from app.serializer.meals_serialize import feed_detail_response, get_feed_type_calendars_data

def get_meals_count(db, params={}):
    return MealsCalendarsRepository.get_count(db, params)

def get_meals_list(db, params={}, include=[]):
    result = MealsCalendarsRepository.get_meals_list(db, params, extra={"include": include})
    final = []

    for row in result:
        # SQLAlchemy 2.x: Row는 tuple이 아니지만 _mapping 속성 보유
        # include 없으면 순수 ORM 객체 반환, include 있으면 Row 반환
        has_mapping = hasattr(row, '_mapping')

        if not has_mapping:
            final.append(row)
            continue

        meal = row[0]  # Row[0] = MealsCalendars ORM 객체
        row_dict = dict(row._mapping)

        if "category" in include:
            meal.category_name = row_dict.get("category_name")
            meal.category_id = meal.category_code  # ORM 객체의 category_code를 category_id로 노출

        if "user" in include:
            meal.nickname = row_dict.get("nickname")
            meal.username = row_dict.get("username")
            meal.profile_image = row_dict.get("profile_image")
            meal.user_hash = row_dict.get("user_hash")
            meal.user_id = row_dict.get("user_id", meal.user_id)

        if "image" in include:
            meal.image_url = row_dict.get("image_url")

        if "tags" in include:
            meal.mapped_tags = row_dict.get("mapped_tags")
            meal.mapped_scores = row_dict.get("mapped_scores")
            meal.mapped_ids = row_dict.get("mapped_ids")

        if "child" in include:
            meal.agent_child_id = row_dict.get("agent_child_id")
            meal.child_name = row_dict.get("child_name")
            meal.child_birth = row_dict.get("child_birth", None)
            meal.child_gender = row_dict.get("child_gender", None)
            meal.is_agent = row_dict.get("is_agent", None)
            meal.allergy_names = row_dict.get("allergy_names")
            meal.allergy_codes = row_dict.get("allergy_codes")

        if row_dict.get("is_liked") is not None:
            meal.is_liked = row_dict.get("is_liked")
        else:
            meal.is_liked = False

        meal.refer_info = None
        meal.refer_meal_hash = None
        meal.refer_user_hash = None
        if meal.refer_feed_id and meal.refer_feed_id > 0:
            try:
                refer_meal = validate_meal_calendar_id(db, meal.refer_feed_id)
                refer_user = validate_user_id(db, refer_meal.user_id)
                meal.refer_info = True
                meal.refer_meal_hash = refer_meal.view_hash
                meal.refer_user_hash = refer_user.view_hash
                meal.refer_user_nickname = refer_user.nickname if refer_user else "알 수 없음"
            except Exception:
                pass

        final.append(meal)

    return final

def validate_meal_calendar_id(db, meal_id):
    meal_calendar = get_meal_calendar_by_id(db, meal_id)
    if not meal_calendar:
        raise ValueError("식단 캘린더 정보를 찾을 수 없습니다.")
    return meal_calendar

def get_meal_calendar_by_view_hash(db, view_hash):
    return MealsCalendarsRepository.find_by_view_hash(db, view_hash)

def validate_meal_calendar_view_hash(db, view_hash):
    meal_calendar = get_meal_calendar_by_view_hash(db, view_hash)
    if not meal_calendar:
        raise ValueError("식단 캘린더 정보를 찾을 수 없습니다.")
    return meal_calendar

def get_meal_calendars_by_user_id(db, user_id):
    result = MealsCalendarsRepository.get_calendars_by_user_id(db, user_id)
    return len(result) if result else 0

def get_meal_calendar_by_id(db, meal_id: int):
    """
    식단 id 로 조회
    """
    return MealsCalendarsRepository.get_calendar_by_id(db, meal_id)

def get_user_meal_calendar(db, params):
    user_id = params.get('user_id', None)
    input_date = params.get('input_date', None)
    child_id = params.get('child_id', None)
    category_code_id = params.get('category_code_id', None)

    return MealsCalendarsRepository.findByUserIdAndDate(db, user_id, input_date, child_id, category_code_id)

def delete_meal_calendar(db, meal_calendar):
    """
    식단 캘린더 삭제 (hard delete)
    """
    return MealsCalendarsRepository.hard_delete_meal(db, meal_calendar)

def get_deleted_meals(db, params):
    is_active = params.get('is_active', "N")
    search_date = params.get('search_date', None)
    target_id = params.get('target_id', None)
    return MealsCalendarsRepository.get_deleted_meals(db, is_active, search_date, target_id)

def update_meal_process(db, meal_calendar, body):
    """
    식단 캘린더 수정 프로세스
    """
    return MealsCalendarsRepository.update(db, body, {"id": meal_calendar.id}, is_commit=False)

async def generate_meal_calendar_hash(user_id: int, input_date: str, category_code: int, child_id: int) -> str:
    """
    식단 캘린더 view_hash 생성 로직
    - view_hash는 "meal_{user_id}_{input_date}_{category_code}_{child_id}" 형식으로 생성
    """
    from app.core.config import settings
    from datetime import datetime
    # view_hash 생성
    now_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    view_hash = generate_sha256_hash(user_id, input_date, category_code, child_id, now_timestamp, settings.SECRET_KEY)
    return view_hash

async def get_calendar_month_image(db, params: dict) -> CommonResponse:
    """
    식단 캘린더 이미지 조회
    """
    from datetime import datetime
    from dateutil.relativedelta import relativedelta

    try:
        user = validate_user(db, params.get('user_hash'))
    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    meal_image_list = await get_user_month_image_map(db, user.id)

    if not meal_image_list:
        return CommonResponse(success=True, error=None, data={})

    current_month = datetime.now().strftime("%Y-%m")
    sorted_keys = sorted(meal_image_list.keys())

    def find_closest(month_str):
        target = datetime.strptime(month_str, "%Y-%m")

        # 이전 값 중 가장 가까운 것
        prev = None
        for k in sorted_keys:
            k_date = datetime.strptime(k, "%Y-%m")
            if k_date <= target:
                prev = k
            else:
                break

        # 이전이 없으면 가장 첫 값 사용
        if prev:
            return meal_image_list[prev]
        else:
            return meal_image_list[sorted_keys[0]]

    result = {}

    for i in range(-6, 7):
        m = datetime.strptime(current_month, "%Y-%m") + relativedelta(months=i)
        key = m.strftime("%Y-%m")
        result[key] = find_closest(key)

    return CommonResponse(success=True, error=None, data=result)

def get_meal_stage_text(meal_stage, meal_stage_detail):
    from app.constants.meals import MEAL_STAGE_LIST

    meal_stage_map = {
        stage['id']: {
            "label": stage['label'],
            "items": {item['id']: item['label'] for item in stage['items']}
        }
        for stage in MEAL_STAGE_LIST
    }

    # 사용
    meal_stage_text = meal_stage_map.get(meal_stage, {}).get("label", "알 수 없음")
    meal_stage_detail_text = meal_stage_map.get(meal_stage, {}).get("items", {}).get(meal_stage_detail, "알 수 없음")
    return meal_stage_text, meal_stage_detail_text

def validate_feed_params(db, filters: FeedListRequest, user_hash: str):
    params = {
        "is_active": "Y"
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
        try:
            target_user = validate_user(db, filters.target_user_hash)
        except ValueError as e:
            return CommonResponse(success=False, error=str(e), data=None)
        params["target_user_id"] = target_user.id

    if user_hash is not None:
        try:
            user = validate_user(db, user_hash)
        except ValueError as e:
            return CommonResponse(success=False, error=str(e), data=None)

        params["my_user_id"] = user.id  # is_liked 조회를 위해 항상 설정
        params['type'] = filters.type if filters.type else "list"  # 기본값은 "list"
        params['view_type'] = filters.view_type

        if type == "list":
            if filters.view_type == "mine":
                params['is_public'] = None  # 내 피드는 공개/비공개 모두 조회
            else:
                params['is_public'] = "Y"  # 다른 사람 피드는 공개된 것만 조회

            # 차단된 사용자 목록 조회
            params["deny_user_ids"] = get_denies_user_id_list(db, user.id)
        else:
            params["user_id"] = user.id

    if filters.ingredient_name is not None:
        ingredient_ids = []
        for name in filters.ingredient_name:
            ingredient = get_ingredient_by_name(db, name)
            if ingredient:
                ingredient_ids.append(ingredient.id)
        params["ingredient_ids"] = ingredient_ids if ingredient_ids else None

    return params

def get_user_calendar_list(db, user_hash, target_user_hash):
    """
    타인의 캘린더 리스트를 조회
    """
    try:
        validate_user(db, user_hash)
        target_user = validate_user(db, target_user_hash)

        if not target_user:
            raise Exception("존재하지 않는 대상 회원입니다.")

        search_params = {
            "target_user_id": target_user.id,
            "is_active": "Y",
            "is_public": "Y"
        }

        calendar_list = get_meals_list(db, search_params, include=["user", "category", "image", "tags", "child"])
        calendar_data = get_feed_type_calendars_data(calendar_list)
        return CommonResponse(success=True, error=None, data=calendar_data)

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)
    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 조회 중 오류가 발생했습니다. " + str(e), data=None)

def get_user_calendar_detail(db, user_hash, target_user_hash, meal_hash):
    """
    타인의 캘린더 상세 조회
    """
    try:
        user = validate_user(db, user_hash)  # 인증된 사용자만 접근 가능
        meal_calendar = validate_meal_calendar_view_hash(db, meal_hash)
    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)

    target_user = validate_user_id(db, meal_calendar.user_id)

    if target_user_hash != target_user.view_hash:
        return CommonResponse(success=False, error="존재하지 않는 대상 회원입니다.", data=None)

    # Lazy import to avoid circular dependency
    from app.services.feeds_service import get_child_and_allergies, increase_view_count

    # 조회수 증가
    increase_view_count(db, meal_calendar, is_commit=True)

    # 태그 목록 조회
    tags = get_ingredient_mappers_by_meal_id(db, meal_calendar.id)

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

    return CommonResponse(success=True, data=feed_data)

def get_feed_type_calendar(db, user_hash, filters: FeedListRequest) -> CommonResponse:
    """
    피드형태 식단 캘린더
    """
    try:
        validate_user(db, user_hash)

        search_params = validate_feed_params(db, filters, user_hash)

        search_params.update({
            "limit": filters.limit,
            "offset": filters.offset,
            "order_by": filters.sort_by if filters.sort_by else "created_at_desc",
        })

        meal_list = get_meals_list(db, search_params, include=["user", "category", "image", "tags", "child"])
        meal_result = get_feed_type_calendars_data(meal_list)

        return CommonResponse(success=True, error=None, data=meal_result)
    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)
    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 조회 중 오류가 발생했습니다. " + str(e), data=None)

def list_calendar(db, params: dict) -> CommonResponse:
    """
    나의 식단 캘린더 조회
    기본 한달 단위로 조회
    """
    try:
        user = validate_user(db, params.get('user_hash'))

        search_params = {
            "month": params.get("month", ""),
            "child_id": params.get("child_id", None),
            "view_type": params.get("view_type"),
            "is_active": "Y"
        }

        if params.get("view_type") == "mine":
            search_params['my_user_id'] = user.id
        else:
            search_params['user_id'] = user.id

        calendar_data = get_meals_list(db, search_params, include=["user", "category", "image", "tags", "child"])

        result = get_feed_type_calendars_data(calendar_data)  # 데이터 가공 (피드 형태로 변환)
        # 조회된 데이터를 날짜 기준 리스트로 정렬
        calendar_list = {}
        for v in result:
            date_key = v.input_date
            if date_key not in calendar_list:
                calendar_list[date_key] = []
            calendar_list[date_key].append(v)

        data = {
            "month": params.get("month", ""),
            "calendar_list": calendar_list,
        }

        return CommonResponse(success=True, error=None, data=data)

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)
    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 조회 중 오류가 발생했습니다. " + str(e), data=None)

def check_daily_meal(db, params: dict) -> CommonResponse:
    """
    일별 식단 캘린더 존재여부 체크
    어떤 식단을 등록했는지 카테고리를 조회
    """
    try:
        user = validate_user(db, params.get('user_hash'))
        user_childs = get_agent_childs(db, {"user_id": user.id})
        if not user_childs:
            raise ValueError("대표 자녀 정보가 없습니다.")

        meal_calendar = MealsCalendarsRepository.findByUserIdAndDate(db, user.id, user_childs.id, params['date'])

        exist_categories = []
        for meal in meal_calendar:
            exist_categories.append(meal.category_code)

        return CommonResponse(success=True, error=None, data={"exist_categories": exist_categories})
    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

async def upload_calendar_month_image(db, user_hash: str, month: str, file) -> CommonResponse:
    """
    식단 캘린더 월별 이미지 업로드
    """
    try:
        user = validate_user(db, user_hash)
        user_id = user.id

        # 기존 이미지 삭제
        delete_calendar_image_by_month(db, user_id, month)
        image_result = await upload_calendar_image(db, user_id, month, file)

        new_image = await create_meal_image(db, {
            "user_id": user_id,
            "month": month,
            "image": "/" + image_result['path'],
            "is_active": "Y"
        })

        if not new_image:
            raise Exception("이미지 저장에 실패했습니다.")

        db.commit()

        return CommonResponse(success=True, error=None, data={"image_url": new_image.image})

    except ValueError as e:
        return CommonResponse(success=False, error=str(e), data=None)
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

async def insert_meal_proccess(db, user, category_code, body):
    """
    식단 캘린더 등록
    """
    meal_data = {
        "category_code": category_code.id,
        "user_id": user.id,
        "child_id": body['child_id'],
        "contents": body['contents'],
        "refer_feed_id": body['refer_feed_id'],
        "month": body['input_date'][:7],
        "meal_condition": body.get('meal_condition', None),
        "input_date": body['input_date'],
        "is_pre_made": body['is_pre_made'],
        "view_count": 0,
        "like_count": 0,
        "is_active": "Y",
        "is_public": body['is_public'],
        "view_hash": body['view_hash'],
        "meal_stage": body.get('meal_stage', 0),
        "meal_stage_detail": body.get('meal_stage_detail', "")
    }

    if not body.get("child_id"):
        user_child = get_agent_childs(db, {"user_id": user.id})
        if not user_child:
            raise Exception("대표 자녀 정보가 없습니다.")
        meal_data["child_id"] = user_child.id

    meal_calendar = MealsCalendarsRepository.create(db, meal_data, is_commit=False)
    db.flush()  # meal_calendar.id를 얻기 위해 flush로 먼저 DB에 반영
    return meal_calendar

async def upload_meal_image(db, meal_calendar, body):
    if body.get('attaches'):
        try:
            result = await upload_file(meal_calendar.id, body['attaches'], path="Meals")
            await save_upload_file(db, model="Meals", model_id=meal_calendar.id, result=result)

        except Exception as e:
            # 이미지 저장 실패해도 식단은 유지
            print(f"이미지 업로드 실패: {str(e)}")

async def validate_meal_calendar(db, user, category_code, body):
    # 중복 캘린더 체크
    exist_meals_calendars = MealsCalendarsRepository.findByUserIdAndDate(db, user.id, body['child_id'], body['input_date'])
    if exist_meals_calendars:
        for meals in exist_meals_calendars:
            if meals.category_code == category_code.id:
                raise Exception("해당 날짜에 동일한 카테고리의 식단이 등록되어 있습니다.")

async def create_meal(db, body: dict) -> CommonResponse:
    try:
        user = validate_user(db, body.get('user_hash'))

        category_code = get_category_code_by_id(db, body['category_id'])
        if not category_code:
            return CommonResponse(success=False, error="유효하지 않은 카테고리 정보입니다.", data=None)

        # 동일 식단 여부 체크
        await validate_meal_calendar(db, user, category_code, body)

        body['view_hash'] = await generate_meal_calendar_hash(user.id, body['input_date'], category_code.id, body['child_id'])

        exist_meal = get_meal_calendar_by_view_hash(db, body['view_hash'])
        if exist_meal:
            raise Exception("이미 존재하는 식단 캘린더입니다.")

        meal_calendar = await insert_meal_proccess(db, user, category_code, body)

        # 이미지 파일 업로드
        await upload_meal_image(db, meal_calendar, body)

        # 재료 Mapper 등록
        if body.get('ingredients'):
            # [{'id': 12, 'name': '당근', 'score': 0.6}, ...]
            ingredients_list = body.get('ingredients', [])
            ingredient_result = process_tags(db, ingredients_list)

            if len(ingredients_list) != len(ingredient_result):
                raise Exception("재료 정보 중 확인되지 않는 재료가 있습니다.")

            # ingredient_result는 [{'id': 38, 'score': 0.6}, ...] 형태
            insert_ingredient_mapper(db, meal_calendar.id, ingredient_result)

        # 최종 commit
        db.commit()

        return CommonResponse(
            success=True,
            message="식단 캘린더가 성공적으로 생성되었습니다.",
            data={"meal_calendar_hash": meal_calendar.view_hash}
        )

    except ValueError as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error="식단 캘린더 생성 중 오류가 발생했습니다. " + str(e), data=None)

""" 식단 캘린더 수정 """
async def update_meal(db, body: dict) -> CommonResponse:
    try:
        # -------------------------
        # 1. 사용자 & 대상 조회
        # -------------------------
        user = validate_user(db, body.get('user_hash'))

        # 수정할 식단 캘린더 조회
        meal_calendar = MealsCalendarsRepository.find_by_view_hash(db, body.get('meal_hash'))
        if not meal_calendar or meal_calendar.user_id != user.id:
            raise ValueError("수정할 식단 캘린더 정보를 찾을 수 없습니다.")
        # -------------------------
        # 2. 카테고리 검증
        # -------------------------
        category_code = None
        if body.get('category_id'):
            category_code = get_category_code_by_id(db, body['category_id'])
            if not category_code:
                raise ValueError("유효하지 않은 카테고리 정보입니다.")
        # -------------------------
        # 3. 중복 식단 검증
        # -------------------------
        input_date = body.get("input_date", meal_calendar.input_date)
        target_category = category_code.id if category_code else meal_calendar.category_code
        exist_meals = MealsCalendarsRepository.findByUserIdAndDate(db, user.id, meal_calendar.child_id, input_date)

        if exist_meals:
            for exist_meal in exist_meals:
                if exist_meal.id != meal_calendar.id and exist_meal.category_code == target_category:
                    return CommonResponse(success=False, error="이미 해당 날짜에 동일한 카테고리의 식단이 등록되어 있습니다.", data=None)
        # -------------------------
        # 🔥 트랜잭션 시작
        # -------------------------
        # 4. 식단 업데이트
        update_params = {
            "input_date": input_date,
            "contents": body.get('contents', meal_calendar.contents),
            "category_code": target_category,
            "meal_condition": body.get('meal_condition', meal_calendar.meal_condition),
            "is_pre_made": body.get('is_pre_made', meal_calendar.is_pre_made),
            "is_public": body.get('is_public', meal_calendar.is_public),
            "meal_stage": body.get('meal_stage', meal_calendar.meal_stage),
            "meal_stage_detail": body.get('meal_stage_detail', meal_calendar.meal_stage_detail),
        }

        success = update_meal_process(db, meal_calendar, update_params)

        if not success:
            db.rollback()
            raise Exception("식단 캘린더 업데이트에 실패했습니다.")
        # -------------------------
        # 5. 재료 동기화 (replace 방식)
        # -------------------------
        if 'ingredients' in body:
            ingredients_list = body.get('ingredients', [])

            # 기존 재료 삭제
            delete_ingredient_mapper(db, meal_calendar.id)

            if ingredients_list:
                # [{'id': 12, 'name': '당근', 'score': 0.6}, ...]
                ingredient_result = process_tags(db, ingredients_list)

                if len(ingredients_list) != len(ingredient_result):
                    db.rollback()
                    raise Exception("재료 정보 중 확인되지 않는 재료가 있습니다.")

                # ingredient_result는 [{'id': 38, 'score': 0.6}, ...] 형태
                # id와 score를 모두 전달
                insert_ingredient_mapper(db, meal_calendar.id, ingredient_result)

        # -------------------------
        # 6. 이미지 처리 (완전 교체)
        # -------------------------
        if body.get('attaches'):
            # 기존 이미지 삭제
            soft_delete_file_by_model_id(db, "Meals", meal_calendar.id)
            # 업로드 실패하면 전체 rollback 됨
            await upload_meal_image(db, meal_calendar, body)

        # -------------------------
        # 7. 최종 commit
        # -------------------------
        db.commit()

        return CommonResponse(success=True, message="식단 캘린더 수정되었습니다.", data={"meal_hash": body.get('meal_hash')})

    except ValueError as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

""" 식단 켈린더 삭제 """
async def delete_meal(db, body: dict) -> CommonResponse:
    try:
        # -------------------------
        # 1. 사용자 & 대상 조회
        # -------------------------
        user = validate_user(db, body.get('user_hash'))

        meal_calendar = MealsCalendarsRepository.find_by_view_hash(db, body['meal_hash'])
        if not meal_calendar or meal_calendar.user_id != user.id:
            return CommonResponse(success=False, error="삭제할 식단 캘린더 정보를 찾을 수 없습니다.", data=None)
        # -------------------------
        # 2. 이미지 삭제
        # -------------------------
        soft_delete_file_by_model_id(db, "Meals", meal_calendar.id)

        # -------------------------
        # 3. meal_calendar 삭제 (soft delete)
        # -------------------------
        MealsCalendarsRepository.soft_delete(db, meal_calendar, is_commit=False)

        db.commit()
        return CommonResponse(success=True, message="식단 캘린더가 성공적으로 삭제되었습니다.", data=None)
    except ValueError as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)


