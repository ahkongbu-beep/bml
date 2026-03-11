"""
식단 캘린더 service 가이드
"""

from app.repository.user_repository import UserRepository
from app.repository.meals_calendars_repository import MealsCalendarsRepository
from app.repository.categories_codes_repository import CategoriesCodesRepository
from app.repository.feeds_images_repository import FeedsImagesRepository
from app.repository.feeds_tags_mappers_repository import FeedsTagsMappersRepository
from app.repository.meals_calendars_images_repository import MealsCalendarsImagesRepository
from app.repository.users_childs_repository import UsersChildsRepository

from app.schemas.common_schemas import CommonResponse
from app.schemas.meals_schemas import FeedListRequest

from app.libs.hash_utils import generate_sha256_hash
from app.services.tag_services import create_tag_mapper, process_tags
from app.services.feeds_service import create_meal_feed
from app.services.users_service import validate_user
from app.services.feeds_images_service import create_meal_image
from app.repository.denies_users_repository import DeniesUsersRepository

"""
식단 캘린더 view_hash 생성 로직
- view_hash는 "meal_{user_id}_{input_date}_{category_code}_{child_id}" 형식으로 생성
"""
async def generate_meal_calendar_hash(user_id: int, input_date: str, category_code: int, child_id: int) -> str:
    from app.core.config import settings
    # view_hash 생성
    view_hash = generate_sha256_hash(user_id, input_date, category_code, child_id, settings.SECRET_KEY)
    return view_hash

"""
식단 캘린더 이미지 조회
"""
async def get_calendar_month_image(db, params: dict) -> CommonResponse:
    try:
        user = validate_user(db, params.get('user_hash'))
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    meal_calendars = await MealsCalendarsImagesRepository.get_active_user(db, user.id, order_by="month desc")

    meal_image_list = {}

    for calendar_month_image in meal_calendars:
        meal_image_list[calendar_month_image.month] = calendar_month_image.image

    return CommonResponse(
        success=True,
        error=None,
        data=meal_image_list
    )

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
        target_user = UserRepository.find_by_view_hash(db, filters.target_user_hash)
        if not target_user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)
        params["target_user_id"] = target_user.id

    if user_hash is not None:
        user = UserRepository.find_by_view_hash(db, user_hash)

        if not user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

        params["my_user_id"] = user.id  # is_liked 조회를 위해 항상 설정
        params['type'] = type
        params['view_type'] = filters.view_type

        if type == "list":
            # 차단된 사용자 목록 조회
            deny_users = DeniesUsersRepository.findByUserIds(db, user.id)
            deny_users_ids = [du.deny_user_id for du in deny_users]

            params["deny_user_ids"] = deny_users_ids
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

        calendar_data = MealsCalendarsRepository.get_list(db, search_params, extra=extra).getData()

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

        calendar_data = MealsCalendarsRepository.get_list(db, search_params).getData()

        # 조회된 데이터를 날짜 기준 리스트로 정렬
        calendar_list = {}
        for item in calendar_data:
            date_key = item.input_date
            if date_key not in calendar_list:
                calendar_list[date_key] = []
            calendar_list[date_key].append(item)

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

        user_childs = UsersChildsRepository.getAgentChild(db, user.id)
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
        user = UserRepository.find_by_view_hash(db, user_hash)
        if not user:
            return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

        user_id = user.id

        # 기존 이미지 삭제
        MealsCalendarsImagesRepository.delete_active_calendar_images_by_month(
            db,
            user_id,
            month
        )

        image_result = await MealsCalendarsImagesRepository.upload(db, user_id, month, file)

        if not image_result or image_result == False:
            raise Exception("이미지 업로드에 실패했습니다.")

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
            # 파일 확장자 추출
            filename = file.filename or "image.jpg"
            ext = filename.split('.')[-1] if '.' in filename else 'jpg'

            # FeedsImagesRepository.upload 사용하여 이미지 저장
            await FeedsImagesRepository.upload(db, meal_calendar.id, file, ext, path="Meals", sort_order=0)
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

        category_code = CategoriesCodesRepository.get_one_data(db, body['category_id'])
        if not category_code:
            return CommonResponse(success=False, error="유효하지 않은 카테고리 정보입니다.", data=None)

        tags_ids = process_tags(db, body.get('ingredients', []))

        await validate_meal_calendar(db, user, category_code, body)

        view_hash = await generate_meal_calendar_hash(user.id, body['input_date'], category_code.id, body['child_id'])
        findByHash = MealsCalendarsRepository.find_by_view_hash(db, view_hash)

        if findByHash:
            raise Exception("이미 존재하는 hash 입니다. 다시 시도해주세요.")

        body['view_hash'] = view_hash

        meal_calendar = await create_meal_calendar(db, user, category_code, body)
        # 파일 업로드
        await upload_meal_image(db, meal_calendar, body)

        # 재료 Mapper 등록
        create_tag_mapper(db, "Meals", meal_calendar.id, tags_ids)
        # 최종 commit
        db.commit()

        return CommonResponse(
            success=True,
            message="식단 캘린더가 성공적으로 생성되었습니다.",
            data={"meal_calendar_hash": meal_calendar.view_hash}
        )
    except Exception as e:
        db.rollback()
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
            category_code = CategoriesCodesRepository.get_one_data(db, body['category_id'])
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
            return CommonResponse(success=False, error="식단 캘린더 수정에 실패했습니다.", data=None)
        # -------------------------
        # 5. 태그 동기화 (replace 방식)
        # -------------------------
        if 'ingredients' in body:
            ingredients = body.get('ingredients', [])

            FeedsTagsMappersRepository.deleteByFeedId(db, "Meals", meal_calendar.id, is_commit=False)

            if ingredients:
                tag_ids = process_tags(db, ingredients)
                create_tag_mapper(db, "Meals", meal_calendar.id, tag_ids)

        # -------------------------
        # 6. 이미지 처리 (완전 교체)
        # -------------------------
        if body.get('attaches'):
            file = body['attaches']

            # 기존 이미지 삭제
            FeedsImagesRepository.deleteByFeedId(db, "Meals", meal_calendar.id, is_commit=False)

            filename = file.filename or "image.jpg"
            ext = filename.split('.')[-1] if '.' in filename else 'jpg'

            # 업로드 실패하면 전체 rollback 됨
            await FeedsImagesRepository.upload(
                db,
                meal_calendar.id,
                file,
                ext,
                path="Meals",
                sort_order=0
            )

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
            error="식단 캘린더 수정 중 오류가 발생했습니다.",
            data=None
        )

""" 식단 켈린더 삭제 """
async def delete_meal(db, body: dict) -> CommonResponse:
    try:
        # -------------------------
        # 1. 사용자 & 대상 조회
        # -------------------------
        user = validate_user(db, body.get('user_hash'))
        if not user:
            return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

        meal_calendar = MealsCalendarsRepository.find_by_view_hash(db, body['meal_hash'])
        if not meal_calendar or meal_calendar.user_id != user.id:
            return CommonResponse(success=False, error="삭제할 식단 캘린더 정보를 찾을 수 없습니다.", data=None)
        # -------------------------
        # 2. 이미지 삭제
        # -------------------------
        FeedsImagesRepository.deleteByFeedId(db, "Meals", meal_calendar.id, is_commit=False)
        db.delete(meal_calendar)
        db.commit()
        return CommonResponse(success=True, message="식단 캘린더가 성공적으로 삭제되었습니다.", data=None)
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

