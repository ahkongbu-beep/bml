"""
식단 캘린더 service 가이드
"""
from app.models.users import Users
from app.models.meals_calendar import MealsCalendars
from app.models.categories_codes import CategoriesCodes
from app.models.feeds_tags import FeedsTags
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.schemas.common_schemas import CommonResponse
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

        return CommonResponse(success=True, error=None, data=calendar_list)

    except Exception as e:
        return CommonResponse(success=False, error="식단 캘린더 조회 중 오류가 발생했습니다. " + str(e), data=None)

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

    return CommonResponse(success=True, error=None, data={
        "exist_categories": exist_categories
    })

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
        return CommonResponse(success=False, error="식단 캘린더 생성 중 오류가 발생했습니다. " + str(e), data=None)

    """ 식단 캘린더 생성 """
    try:
        meal_calendar = MealsCalendars.create(db, {
            "category_code": category_code.id,
            "user_id": user.id,
            "title": body['title'],
            "contents": body['contents'],
            "month": body['input_date'][:7],
            "input_date": body['input_date'],
            "view_hash": generate_sha256_hash(user.id, body['input_date'], category_code.code, settings.SECRET_KEY)
        }, is_commit=True)

        """ 태그 매핑 생성 """
        for tag_id in tags_ids:
            FeedsTagsMapper.create(db, {
                "model": "Meal",
                "feed_id": meal_calendar.id,
                "tag_id": tag_id
            }, is_commit=False)
        db.commit()

        return CommonResponse(success=True, error=None, data={
            "meal_calendar_hash": meal_calendar.view_hash,
        })

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error="식단 캘린더 생성 중 오류가 발생했습니다. " + str(e), data=None)






