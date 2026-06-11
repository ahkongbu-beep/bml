from app.repository.ingredients_repository import IngredientsRepository
from app.repository.ingredients_requests_repository import IngredientsRequestRepository
from app.serializer.ingredient_serialize import build_ingredient_response
from app.schemas.common_schemas import CommonResponse
from app.services.users_service import validate_user, get_admin_users

def process_tags(db, ingredients):
    """
    ingredients 처리 - 두 가지 형식 모두 지원
    형식1: [{'id': 38, 'name': '단호박씨', 'score': 0.6}]
    """
    result = []
    for ingredient in ingredients:
        ing_id = None
        ing_name = None
        ing_score = 0

        ing_id = ingredient.get("id")
        ing_name = ingredient.get("name")
        ing_score = ingredient.get("score", 0)

        if ing_id is None or ing_name is None:
            continue

        tag = IngredientsRepository.get_ingredient_by_id(db, ing_id)
        # tag 존재하고 name 일치
        if tag and tag.name == ing_name:
            result.append({
                "id": tag.id,
                "score": ing_score
            })

    return result

def get_ingredient_by_id(db, ingredient_id):
    return IngredientsRepository.get_ingredient_by_id(db, ingredient_id)

def get_ingredient_by_similar_keyword(db, query_text):
    query_text = query_text.strip()
    ingredients = IngredientsRepository.get_like_ingredient_by_name(db, query_text)
    return [ingredient.name for ingredient in ingredients]

def get_ingredient_list(db, params):
    search_params = {}
    if params.get("category"):
        search_params["category"] = params.get("category")

    if params.get("name"):
        search_params["name"] = params.get("name")

    result = IngredientsRepository.get_list(db, search_params)
    return [build_ingredient_response(ingredient) for ingredient in result]

def get_ingredient_by_name(db, ingredient_name):
    ingredient = IngredientsRepository.get_ingredient_by_name(db, ingredient_name)
    if ingredient:
        return build_ingredient_response(ingredient)
    return None

def get_ingredients_join_nutrient(db):
    return IngredientsRepository.get_ingredients_join_nutrient(db)

def ingredient_request(db, user_hash, body):
    """
    사용자 요청으로 새로운 재료 추가
    """
    from app.libs.utils.fcm import send_fcm
    # 새로운 재료 추가
    try:
        user = validate_user(db, user_hash)

        if isinstance(body.names, list):
            ingredient_names = body.names
        else:
            ingredient_names = body.names.split(',')

        err_message = []
        for ingredient_name in ingredient_names:
            ingredient_name = ingredient_name.strip()
            if not ingredient_name:
                err_message.append("재료 이름은 필수입니다.")

            # 이미 존재하는지 확인
            existing = IngredientsRequestRepository.get_ingredient_request(db, user.id, ingredient_name)
            if existing:
                if existing.status == 'Y':
                    err_message.append("이미 존재하는 재료입니다.")
                    continue
                else:
                    err_message.append("이미 요청되어 승인 대기 중입니다.")
                    continue

            new_ingredient = IngredientsRequestRepository.create_ingredient_request(db, user.id, ingredient_name)
            if not new_ingredient:
                err_message.append("재료 요청 생성 실패")
                continue

        if err_message:
            raise Exception(", ".join(err_message))

        db.commit()

        admin_users = get_admin_users(db)
        for admin in admin_users:
            if not admin.fcm_token:
                continue

            res = send_fcm(
                token=admin.fcm_token,
                title="새로운 재료 요청",
                body=f"{user.nickname}님이 '{body.names}' 재료 추가를 요청했습니다.",
                data={
                    "type": "ingredient_request",
                    "screen": "AdminIngredientRequests"
                }
            )
            if isinstance(res, dict) and res.get("error") == "unregistered":
                admin.fcm_token = None
                db.commit()

        return CommonResponse(success=True, message="재료 요청되었습니다.", data=None)
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, message=str(e), data=None)
