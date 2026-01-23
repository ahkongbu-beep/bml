"""
식단 캘린더 service 가이드
"""
import os
from app.models.users import Users
from app.models.meals_calendar import MealsCalendars
from app.models.categories_codes import CategoriesCodes
from app.models.feeds_tags import FeedsTags
from app.models.feeds import Feeds
from app.models.feeds_images import FeedsImages
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.schemas.common_schemas import CommonResponse
from app.schemas.meals_schemas import CalendarCopyRequest
from app.core.config import settings
from app.libs.hash_utils import generate_sha256_hash

"""
식단 캘린더 조회
기본 한달 단위로 조회
"""
def list_calendar(db, params: dict) -> CommonResponse:
    if 'user_hash' not in params or not params['user_hash']:
        return CommonResponse(success=False, error="user_hash는 필수 항목입니다.", data=None)

    user = Users.findByViewHash(db, params['user_hash'])
    if not user:
        return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

    try:
        calendar_data = MealsCalendars.getList(db, {
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
            data=calendar_list
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
    user = Users.findByViewHash(db, params['user_hash'])
    if not user:
        return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

    meal_calendar = MealsCalendars.findByUserIdAndDate(db, user.id, params['date'])

    exist_categories = []
    for meal in meal_calendar:
        exist_categories.append(meal.category_code)

    return CommonResponse(
        success=True,
        error=None,
        data={"exist_categories": exist_categories}
    )

async def create_meal(db, body: dict) -> CommonResponse:
    user = Users.findByViewHash(db, body['user_hash'])
    if not user:
        return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

    category_code = CategoriesCodes.findById(db, body['category_id'])
    if not category_code:
        return CommonResponse(success=False, error="유효하지 않은 카테고리 정보입니다.", data=None)

    tags = body.get('tags', [])

    """ 태그 처리 """
    try:
        tags_ids = []
        for tag_name in tags:
            tag = FeedsTags.findOrCreateTag(db, tag_name, is_commit=False)
            tags_ids.append(tag.id)

    except Exception as e:
        print("⭕⭕⭕⭕⭕" + str(e))
        return CommonResponse(success=False, error="식단 캘린더 생성 중 오류가 발생했습니다. " + str(e), data=None)

    """ 중복 캘린더 체크 """
    exist_meals_calendars = MealsCalendars.findByUserIdAndDate(db, user.id, body['input_date'])
    if exist_meals_calendars:
        for meals in exist_meals_calendars:
            if meals.category_code == category_code.id:
                return CommonResponse(success=False, error="해당 날짜에 동일한 카테고리의 식단이 등록되어 있습니다.", data=None)

    """ 식단 캘린더 생성 """
    try:
        meal_data = {
            "category_code": category_code.id,
            "user_id": user.id,
            "title": body['title'],
            "contents": body['contents'],
            "month": body['input_date'][:7],
            "input_date": body['input_date'],
            "view_hash": generate_sha256_hash(user.id, body['input_date'], category_code.code, settings.SECRET_KEY)
        }

        meal_calendar = MealsCalendars.create(db, meal_data, is_commit=True)

        # 이미지 파일 처리 - FeedsImages에 저장
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

        """ 태그 매핑 생성 """
        for tag_id in tags_ids:
            FeedsTagsMapper.create(db, {
                "model": "Meal",
                "feed_id": meal_calendar.id,
                "tag_id": tag_id
            }, is_commit=False)
        db.commit()

        return CommonResponse(
            success=True,
            error=None,
            data={"meal_calendar_hash": meal_calendar.view_hash,}
        )

    except Exception as e:
        db.rollback()
        print("⭕⭕⭕⭕⭕" + str(e))
        return CommonResponse(success=False, error="식단 캘린더 생성 중 오류가 발생했습니다. " + str(e), data=None)

""" 식단 캘린더 수정 """
async def update_meal(db, body: dict) -> CommonResponse:
    user_hash = body.get('user_hash')

    # 사용자 인증
    user = Users.findByViewHash(db, user_hash)

    if not user:
        return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

    # 수정할 식단 캘린더 조회
    meal_calendar = MealsCalendars.findByViewHash(db, body.get('meal_hash'))

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
            tag = FeedsTags.findOrCreateTag(db, tag_name, is_commit=False)
            tags_ids.append(tag.id)

    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 수정 중 오류가 발생했습니다. " + str(e), data=None)
    # 태그 처리 e

    # 식단 캘린더 수정
    try:
        update_params = {
            "input_date": body.get('input_date', meal_calendar.input_date),
            "title": body.get('title', meal_calendar.title),
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
                # 기존 이미지 삭제
                FeedsImages.deleteByFeedId(db, "Meals", meal_calendar.id)

                # 파일 확장자 추출
                filename = file.filename or "image.jpg"
                ext = filename.split('.')[-1] if '.' in filename else 'jpg'

                # FeedsImages.upload 사용하여 이미지 저장
                await FeedsImages.upload(db, meal_calendar.id, file, ext, path="Meals", sort_order=0)
            except Exception as e:
                # 이미지 저장 실패해도 식단 수정은 유지
                print(f"이미지 업로드 실패: {str(e)}")

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error="식단 캘린더 수정 중 오류가 발생했습니다. " + str(e), data=None)

    return CommonResponse(success=True, error=None, data=body)

""" 식단 켈린더 삭제 """
async def delete_meal(db, body: dict) -> CommonResponse:
    if 'user_hash' not in body or not body['user_hash']:
        return CommonResponse(success=False, error="user_hash는 필수 항목입니다.", data=None)

    user = Users.findByViewHash(db, body['user_hash'])
    if not user:
        return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

    meal_calendar = MealsCalendars.findByViewHash(db, body['meal_hash'])
    if not meal_calendar or meal_calendar.user_id != user.id:
        return CommonResponse(success=False, error="삭제할 식단 캘린더 정보를 찾을 수 없습니다.", data=None)

    try:
        db.delete(meal_calendar)
        db.commit()
        return CommonResponse(success=True, error=None, data={"message": "식단 캘린더가 성공적으로 삭제되었습니다."})
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error="식단 캘린더 삭제 중 오류가 발생했습니다. " + str(e), data=None)





