"""
식단 캘린더 service 가이드
"""
from app.repository.meals_calendars_repository import MealsCalendarsRepository
from app.schemas.common_schemas import CommonResponse
from app.schemas.meals_schemas import FeedListRequest
from app.libs.hash_utils import generate_sha256_hash
from app.services.ingredients_service import  process_tags
from app.services.ingredients_mappers_service import create_ingredient_mapper, delete_ingredient_mapper
from app.services.attaches_files_service import soft_delete_file_by_model_id, upload_file, save_upload_file
from app.services.users_service import validate_user
from app.services.feeds_images_service import create_meal_image
from app.services.denies_users_service import get_denies_user_id_list
from app.services.users_childs_service import get_agent_childs
from app.services.categories_codes_service import get_category_code_by_id
from app.services.meals_calendars_images_service import get_user_month_image_map, delete_calendar_image_by_month, upload_calendar_image

def validate_meal_calendar_id(db, meal_id):
    meal_calendar = get_meal_calendar_by_id(db, meal_id)
    if not meal_calendar:
        raise Exception("식단 캘린더 정보를 찾을 수 없습니다.")
    return meal_calendar

"""
식단 id 로 조회
"""
def get_meal_calendar_by_id(db, meal_id: int):
    return MealsCalendarsRepository.get_calendar_by_id(db, meal_id)

def get_user_meal_calendar(db, params):

    user_id = params.get('user_id', None)
    input_date = params.get('input_date', None)
    child_id = params.get('child_id', None)
    category_code_id = params.get('category_code_id', None)

    return MealsCalendarsRepository.findByUserIdAndDate(db, user_id, input_date, child_id, category_code_id)

"""
식단 캘린더 view_hash 생성 로직
- view_hash는 "meal_{user_id}_{input_date}_{category_code}_{child_id}" 형식으로 생성
"""
async def generate_meal_calendar_hash(user_id: int, input_date: str, category_code: int, child_id: int) -> str:
    from app.core.config import settings
    from datetime import datetime
    # view_hash 생성
    now_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    view_hash = generate_sha256_hash(user_id, input_date, category_code, child_id, now_timestamp, settings.SECRET_KEY)
    return view_hash

"""
식단 캘린더 이미지 조회
"""
async def get_calendar_month_image(db, params: dict) -> CommonResponse:
    try:
        user = validate_user(db, params.get('user_hash'))
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    meal_image_list = {}

    meal_image_list = await get_user_month_image_map(db, user.id)
    return CommonResponse(success=True, error=None, data=meal_image_list)

def validate_feed_params(db, filters: FeedListRequest, user_hash: str, type: str = "list"):
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
            if not target_user:
                raise Exception("존재하지 않는 대상 회원입니다.")

        except Exception as e:
            return CommonResponse(success=False, error=str(e), data=None)
        params["target_user_id"] = target_user.id

    if user_hash is not None:
        try:
            user = validate_user(db, user_hash)
            if not user:
                raise Exception("존재하지 않는 회원입니다.")
        except Exception as e:
            return CommonResponse(success=False, error=str(e), data=None)

        params["my_user_id"] = user.id  # is_liked 조회를 위해 항상 설정
        params['type'] = type
        params['view_type'] = filters.view_type

        if type == "list":
            # 차단된 사용자 목록 조회
            params["deny_user_ids"] = get_denies_user_id_list(db, user.id)
        else:
            params["user_id"] = user.id

    return params

"""
피드형태 식단 캘린더
"""
def get_feed_type_calendar(db, user_hash, filters: FeedListRequest) -> CommonResponse:
    try:
        user = validate_user(db, user_hash)
        if not user:
            raise Exception("유효하지 않은 회원정보입니다.")

        search_params = validate_feed_params(db, filters, user_hash)

        extra = {
            "limit": filters.limit,
            "offset": filters.offset,
            "order_by": filters.sort_by if filters.sort_by else "created_at_desc"
        }
        calendar_list = MealsCalendarsRepository.get_list(db, search_params, extra=extra)
        calendar_data = get_feed_type_calendars_data(calendar_list)

        return CommonResponse(success=True, error=None, data=calendar_data)
    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 조회 중 오류가 발생했습니다. " + str(e), data=None)

"""
나의 식단 캘린더 조회
기본 한달 단위로 조회
"""
def list_calendar(db, params: dict) -> CommonResponse:
    try:
        user = validate_user(db, params.get('user_hash'))
        if not user:
            raise Exception("유효하지 않은 회원정보입니다.")

        search_params = {
            "user_id": user.id,
            "month": params.get("month", ""),
            "child_id": params.get("child_id", None),
            "is_active": "Y"
        }

        calendar_data = MealsCalendarsRepository.get_list(db, search_params)
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
    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 조회 중 오류가 발생했습니다. " + str(e), data=None)

"""
일별 식단 캘린더 존재여부 체크
어떤 식단을 등록했는지 카테고리를 조회
"""
def check_daily_meal(db, params: dict) -> CommonResponse:
    try:
        user = validate_user(db, params.get('user_hash'))
        if not user:
            raise Exception("유효하지 않은 회원정보입니다.")

        user_childs = get_agent_childs(db, {"user_id": user.id})
        if not user_childs:
            raise Exception("대표 자녀 정보가 없습니다.")

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    meal_calendar = MealsCalendarsRepository.findByUserIdAndDate(db, user.id, user_childs.id, params['date'])

    exist_categories = []
    for meal in meal_calendar:
        exist_categories.append(meal.category_code)

    return CommonResponse(
        success=True,
        error=None,
        data={"exist_categories": exist_categories}
    )

async def upload_calendar_month_image(db, user_hash: str, month: str, file) -> CommonResponse:
    try:
        user = validate_user(db, user_hash)
        if not user:
            return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

        user_id = user.id

        # 기존 이미지 삭제
        delete_calendar_image_by_month(db, user_id, month)
        image_result = await upload_calendar_image(db, user_id, month, file)

        params = {
            "user_id": user_id,
            "month": month,
            "image": "/" + image_result['path'],
            "is_active": "Y"
        }

        new_image = await create_meal_image(db, params)
        if not new_image:
            raise Exception("이미지 저장에 실패했습니다.")

        db.commit()

        return CommonResponse(success=True, error=None, data={"image_url": new_image.image})

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

async def create_meal_calendar(db, user, category_code, body):

    meal_data = {
        "category_code": category_code.id,
        "user_id": user.id,
        "child_id": body['child_id'],
        "contents": body['contents'],
        "refer_feed_id": body['refer_feed_id'],
        "month": body['input_date'][:7],
        "meal_condition": body['meal_condition'],
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

    meal_calendar = MealsCalendarsRepository.create(db, meal_data, is_commit=False)
    db.flush()  # meal_calendar.id를 얻기 위해 flush로 먼저 DB에 반영
    return meal_calendar

async def upload_meal_image(db, meal_calendar, body):
    if body.get('attaches'):
        try:
            file = body['attaches']

            # FeedsImagesRepository.upload 사용하여 이미지 저장
            result = await upload_file(meal_calendar.id, file, path="Meals")
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
        if not user:
            return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

        category_code = get_category_code_by_id(db, body['category_id'])
        if not category_code:
            return CommonResponse(success=False, error="유효하지 않은 카테고리 정보입니다.", data=None)

        # 동일 식단 여부 체크
        await validate_meal_calendar(db, user, category_code, body)

        view_hash = await generate_meal_calendar_hash(user.id, body['input_date'], category_code.id, body['child_id'])
        findByHash = MealsCalendarsRepository.find_by_view_hash(db, view_hash)

        if findByHash:
            raise Exception("이미 존재하는 hash 입니다. 다시 시도해주세요.")

        body['view_hash'] = view_hash

        meal_calendar = await create_meal_calendar(db, user, category_code, body)

        print("⭕⭕⭕⭕")
        print("식단 캘린더 생성 완료, ID:", meal_calendar.id)
        print("식단 캘린더 해시:", body)
        print("⭕⭕⭕⭕")

        # 이미지 파일 업로드
        await upload_meal_image(db, meal_calendar, body)

        # 재료 Mapper 등록
        ingredient_ids = process_tags(db, body.get('ingredients', []))

        if body.get('ingredients'):
            if len(body.get('ingredients')) != len(ingredient_ids):
                raise Exception("재료 정보 중 확인되지 않는 재료가 있습니다.")

            create_ingredient_mapper(db, meal_calendar.id, ingredient_ids)  # meal_id는 캘린더 생성 후 업데이트

        # 최종 commit
        db.commit()

        return CommonResponse(
            success=True,
            message="식단 캘린더가 성공적으로 생성되었습니다.",
            data={"meal_calendar_hash": meal_calendar.view_hash}
        )
    except Exception as e:
        db.rollback()
        print("⭕⭕", str(e))
        return CommonResponse(
            success=False,
            error="식단 캘린더 생성 중 오류가 발생했습니다. " + str(e),
            data=None
        )

""" 식단 캘린더 수정 """
async def update_meal(db, body: dict) -> CommonResponse:

    try:
        # -------------------------
        # 1. 사용자 & 대상 조회
        # -------------------------
        user = validate_user(db, body.get('user_hash'))
        if not user:
            return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

        # 수정할 식단 캘린더 조회
        meal_calendar = MealsCalendarsRepository.find_by_view_hash(db, body.get('meal_hash'))
        if not meal_calendar or meal_calendar.user_id != user.id:
            return CommonResponse(success=False, error="수정할 식단 캘린더 정보를 찾을 수 없습니다.", data=None)
        # -------------------------
        # 2. 카테고리 검증
        # -------------------------
        category_code = None
        if body.get('category_id'):
            category_code = get_category_code_by_id(db, body['category_id'])
            if not category_code:
                return CommonResponse(success=False, error="유효하지 않은 카테고리 정보입니다.", data=None)
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

        success = MealsCalendarsRepository.update(db, update_params, {"id": meal_calendar.id}, is_commit=False)

        if not success:
            db.rollback()
            raise Exception("식단 캘린더 업데이트에 실패했습니다.")
        # -------------------------
        # 5. 재료 동기화 (replace 방식)
        # -------------------------
        if 'ingredients' in body:
            ingredients = body.get('ingredients', [])

            # 기존 재료 삭제
            delete_ingredient_mapper(db, meal_calendar.id)

            if ingredients:
                ingredient_ids = process_tags(db, ingredients)

                if len(ingredients) != len(ingredient_ids):
                    db.rollback()
                    raise Exception("재료 정보 중 확인되지 않는 재료가 있습니다.")

                create_ingredient_mapper(db, meal_calendar.id, ingredient_ids)

        # -------------------------
        # 6. 이미지 처리 (완전 교체)
        # -------------------------
        if body.get('attaches'):
            # 기존 이미지 삭제
            soft_delete_file_by_model_id(db, "Meals", meal_calendar.id)
            # 업로드 실패하면 전체 rollback 됨
            upload_meal_image(db, meal_calendar, body)

        # -------------------------
        # 7. 최종 commit
        # -------------------------
        db.commit()

        return CommonResponse(
            success=True,
            message="식단 캘린더 수정되었습니다.",
            data={"meal_hash": body.get('meal_hash')}
        )

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()

        return CommonResponse(
            success=False,
            error=str(e),
            data=None
        )

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
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

"""
피드 형태 식단 리스트
"""
def get_feed_type_calendars_data(result):

    try:

        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.meals_schemas import MealsCalendarResponse
        from app.schemas.feeds_schemas import FeedsUserResponse
        from app.schemas.users_schemas import UserChildItemSchema, AllergyItemSchema

        return [
            MealsCalendarResponse(
                id=v.id,
                title=v.title,
                contents=v.contents,
                input_date=f"{v.input_date.year}-{v.input_date.month}-{v.input_date.day}",
                month=v.month,
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
                mapped_tags=v.mapped_tags.split(',') if v.mapped_tags else [],
                user=FeedsUserResponse(
                    id=v.user_id,
                    nickname=v.nickname,
                    profile_image=v.profile_image if v.profile_image else None,
                    user_hash=v.user_hash
                ),
                childs=UserChildItemSchema(
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
