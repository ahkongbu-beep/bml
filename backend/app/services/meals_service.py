"""
식단 캘린더 service 가이드
"""
import os
from app.models.users import Users
from app.models.meals_calendar import MealsCalendars
from app.models.categories_codes import CategoriesCodes
from app.models.feeds_tags import FeedsTags
from app.models.feeds_images import FeedsImages
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.schemas.common_schemas import CommonResponse
from app.core.config import settings
from app.models.meals_calendars_images import MealsCalendarImage
from app.services.tag_services import create_tag_mapper, process_tags
from app.services.feeds_service import create_meal_feed
from app.services.users_service import validate_user


"""
식단 캘린더 이미지 조회
"""
async def get_calendar_month_image(db, params: dict) -> CommonResponse:
    try:
        user = validate_user(db, params.get('user_hash'))
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    calendar_month_image = db.query(MealsCalendarImage).filter(
        MealsCalendarImage.user_id == user.id,
        MealsCalendarImage.month == params.get("month", ""),
        MealsCalendarImage.is_active == "Y"
    ).order_by(MealsCalendarImage.id.desc()).first()

    return CommonResponse(
        success=True,
        error=None,
        data={
            "image_url": calendar_month_image.image if calendar_month_image else None,
            "month": params.get("month", "")
        }
    )

"""
식단 캘린더 조회
기본 한달 단위로 조회
"""
def list_calendar(db, params: dict) -> CommonResponse:
    if 'user_hash' not in params or not params['user_hash']:
        return CommonResponse(success=False, error="user_hash는 필수 항목입니다.", data=None)

    user = Users.find_by_view_hash(db, params['user_hash'])
    if not user:
        return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

    try:
        calendar_data = MealsCalendars.get_list(db, {
            "user_id": user.id,
            "month": params.get("month", ""),
        }).getData()

        """ 조회된 데이터를 날짜 기준 리스트로 정렬 """
        calendar_list = {}
        for item in calendar_data:
            date_key = item.input_date
            if date_key not in calendar_list:
                calendar_list[date_key] = []
            calendar_list[date_key].append(item)

        return CommonResponse(
            success=True,
            error=None,
            data={
                "month": params.get("month", ""),
                "calendar_list": calendar_list,
            }
        )

    except Exception as e:
        return CommonResponse(
            success=False,
            error="식단 캘린더 조회 중 오류가 발생했습니다. " + str(e),
            data=None
        )

"""
일별 식단 캘린더 존재여부 체크
어떤 식단을 등록했는지 카테고리를 조회
"""
def check_daily_meal(db, params: dict) -> CommonResponse:
    try:
        user = validate_user(db, params.get('user_hash'))
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    meal_calendar = MealsCalendars.findByUserIdAndDate(db, user.id, params['date'])

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
        user = Users.find_by_view_hash(db, user_hash)
        if not user:
            return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

        user_id = user.id

        # 기존 이미지 삭제
        db.query(MealsCalendarImage).filter(
            MealsCalendarImage.user_id == user_id,
            MealsCalendarImage.month == month,
            MealsCalendarImage.is_active == "Y"
        ).delete(synchronize_session=False)

        image_result = await MealsCalendarImage.upload(db, user_id, month, file)

        if not image_result or image_result == False:
            db.rollback()
            return CommonResponse(success=False, error="캘린더 이미지 업로드에 실패했습니다.", data=None)

        new_image = MealsCalendarImage(
            user_id=user_id,
            month=month,
            image=image_result['path'],
            is_active="Y"
        )
        db.add(new_image)
        db.commit()

        return CommonResponse(success=True, error=None, data={"image_url": new_image.image})

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e), data=None)

async def create_meal_calendar(db, user, category_code, body):
    meal_data = {
        "category_code": category_code.id,
        "user_id": user.id,
        "contents": body['contents'],
        "month": body['input_date'][:7],
        "meal_condition": body['meal_condition'],
        "input_date": body['input_date'],
        "is_pre_made": body['is_pre_made'],
        "is_public": body['is_public'],
    }

    meal_calendar = MealsCalendars.create(db, meal_data, is_commit=False)
    db.flush()  # meal_calendar.id를 얻기 위해 flush로 먼저 DB에 반영
    return meal_calendar

async def upload_meal_image(db, meal_calendar, body):
    if body.get('attaches'):
        try:
            file = body['attaches']
            # 파일 확장자 추출
            filename = file.filename or "image.jpg"
            ext = filename.split('.')[-1] if '.' in filename else 'jpg'

            # FeedsImages.upload 사용하여 이미지 저장
            await FeedsImages.upload(db, meal_calendar.id, file, ext, path="Meals", sort_order=0)
        except Exception as e:
            # 이미지 저장 실패해도 식단은 유지
            print(f"이미지 업로드 실패: {str(e)}")

async def validate_meal_calendar(db, user, category_code, body):
    # 중복 캘린더 체크
    exist_meals_calendars = MealsCalendars.findByUserIdAndDate(db, user.id, body['input_date'])
    if exist_meals_calendars:
        for meals in exist_meals_calendars:
            if meals.category_code == category_code.id:
                raise Exception("해당 날짜에 동일한 카테고리의 식단이 등록되어 있습니다.")

async def create_meal(db, body: dict) -> CommonResponse:

    try:
        user = validate_user(db, body.get('user_hash'))
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    category_code = CategoriesCodes.findById(db, body['category_id'])
    if not category_code:
        return CommonResponse(success=False, error="유효하지 않은 카테고리 정보입니다.", data=None)

    """ 태그 처리 """
    try:
        tags_ids = process_tags(db, body.get('ingredients', []))

        """ 중복 캘린더 체크 """
        try:
            await validate_meal_calendar(db, user, category_code, body)
        except Exception as e:
            return CommonResponse(success=False, error=str(e), data=None)

        meal_calendar = await create_meal_calendar(db, user, category_code, body)
        # 파일 업로드
        await upload_meal_image(db, meal_calendar, body)
        # 피드 생성
        await create_meal_feed(db, meal_calendar, body, tags_ids)
        # 재료 Mapper 등록
        create_tag_mapper(db, "Meals", meal_calendar.id, tags_ids)
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
    user_hash = body.get('user_hash')

    # 사용자 인증
    user = Users.find_by_view_hash(db, user_hash)

    if not user:
        return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

    # 수정할 식단 캘린더 조회
    meal_calendar = MealsCalendars.find_by_view_hash(db, body.get('meal_hash'))

    if not meal_calendar or meal_calendar.user_id != user.id:
        return CommonResponse(success=False, error="수정할 식단 캘린더 정보를 찾을 수 없습니다.", data=None)

    if body.get('category_id'):

        category_code = CategoriesCodes.findById(db, body['category_id'])

        if not category_code:
            return CommonResponse(success=False, error="유효하지 않은 카테고리 정보입니다.", data=None)

    # 중복된 날짜의 동일 카테고리 식단 확인
    exist_meals_calendars = MealsCalendars.findByUserIdAndDate(db, user.id, body['input_date'])
    if exist_meals_calendars:
        for meals in exist_meals_calendars:
            if meals.id != meal_calendar.id and meals.category_code == category_code.id:
                return CommonResponse(success=False, error="이미 해당 날짜에 동일한 카테고리의 식단이 등록되어 있습니다.", data=None)

    # 태그 처리 s
    tags = body.get('tags', [])
    try:
        tags_ids = []
        for tag_name in tags:
            tag = FeedsTags.get_or_create_tag(db, tag_name, is_commit=False)
            tags_ids.append(tag.id)

    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 수정 중 오류가 발생했습니다. " + str(e), data=None)
    # 태그 처리 e

    # 식단 캘린더 수정
    try:
        update_params = {
            "input_date": body.get('input_date', meal_calendar.input_date),
            "contents": body.get('contents', meal_calendar.contents),
            "category_code": category_code.id if body.get('category_id') else meal_calendar.category_code
        }

        where_syntax = {
            "id": meal_calendar.id
        }

        success_bool = MealsCalendars.update(db, update_params, where_syntax, is_commit=True)
        if not success_bool:
            return CommonResponse(success=False, error="식단 캘린더 수정에 실패했습니다.", data=None)

        # 이미지 파일 처리 - FeedsImages에 저장
        if body.get('attaches'):
            try:
                file = body['attaches']
                print(f"🖼️ 이미지 업로드 시작 - meal_id: {meal_calendar.id}, filename: {file.filename}")

                # 기존 이미지 삭제
                delete_result = FeedsImages.deleteByFeedId(db, "Meals", meal_calendar.id)
                print(f"🗑️ 기존 이미지 삭제 결과: {delete_result}")

                # 파일 확장자 추출
                filename = file.filename or "image.jpg"
                ext = filename.split('.')[-1] if '.' in filename else 'jpg'

                # FeedsImages.upload 사용하여 이미지 저장
                uploaded_image = await FeedsImages.upload(db, meal_calendar.id, file, ext, path="Meals", sort_order=0)

                if uploaded_image:
                    print(f"✅ 이미지 업로드 성공 - image_id: {uploaded_image.id}, url: {uploaded_image.image_url}")
                else:
                    print(f"❌ 이미지 업로드 실패 - upload returned None")

            except Exception as e:
                # 이미지 저장 실패해도 식단 수정은 유지
                import traceback
                traceback.print_exc()

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error="식단 캘린더 수정 중 오류가 발생했습니다. " + str(e), data=None)

    # 응답 데이터 구성 (UploadFile 제외)
    response_data = {
        "meal_hash": body.get('meal_hash'),
        "user_hash": body.get('user_hash'),
        "category_id": body.get('category_id'),
        "input_date": body.get('input_date'),
        "title": body.get('title'),
        "contents": body.get('contents'),
        "tags": body.get('tags', [])
    }

    return CommonResponse(success=True, error=None, data=response_data)

""" 식단 켈린더 삭제 """
async def delete_meal(db, body: dict) -> CommonResponse:
    if 'user_hash' not in body or not body['user_hash']:
        return CommonResponse(success=False, error="user_hash는 필수 항목입니다.", data=None)

    user = Users.find_by_view_hash(db, body['user_hash'])
    if not user:
        return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

    meal_calendar = MealsCalendars.find_by_view_hash(db, body['meal_hash'])
    if not meal_calendar or meal_calendar.user_id != user.id:
        return CommonResponse(success=False, error="삭제할 식단 캘린더 정보를 찾을 수 없습니다.", data=None)

    try:
        db.delete(meal_calendar)
        db.commit()
        return CommonResponse(success=True, error=None, data={"message": "식단 캘린더가 성공적으로 삭제되었습니다."})
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error="식단 캘린더 삭제 중 오류가 발생했습니다. " + str(e), data=None)





