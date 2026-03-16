"""
회원 service 가이드
- sns_login_type 이 EMAIL 인 경우 password는 필수
- 그 외 sns_login_type 인 경우 sns_id 는 필수
"""
from app.repository.user_repository import UserRepository
from app.repository.meals_comments_repository import MealsCommentsRepository

from app.services.passwords_resets_tokens_service import update_password_reset_token_expire, validate_use_password_reset, create_password_reset_token, validate_password_token
from app.services.users_childs_service import create_child, get_child_by_id, get_child_by_id_and_name, get_list_with_allergies, update_child, delete_child
from app.services.denies_users_service import deny_user_process, get_denies_user_list
from app.services.attaches_files_service import soft_delete_file_by_model_id, upload_file
from app.services.meals_mappers_service import create_meal_mapper, meal_mapper_list_by_id
from app.services.categories_codes_service import get_category_code_by_id
from app.services.foods_items_service import get_allergy_details_by_codes
from app.schemas.users_schemas import UserResponseSchema
from app.schemas.common_schemas import CommonResponse
from app.libs.password_utils import hash_password
from app.services.users_childs_allergies_service import bulk_create_user_child_allergies

def validate_user_id(db, user_id):
    user = UserRepository.findById(db, user_id)
    if not user:
        raise Exception("회원 정보를 찾을 수 없습니다.")
    return user

def validate_user_email_and_name(db, email, name):
    user = UserRepository.get_user_by_email_and_name(db, email, name)
    if not user:
        raise Exception("회원 정보를 찾을 수 없습니다.")
    return user

def validate_user_email(db, email):
    user = UserRepository.get_user_by_email(db, email)
    if not user:
        raise Exception("회원 정보를 찾을 수 없습니다.")
    return user

def validate_user(db, user_hash):
    user = UserRepository.find_by_view_hash(db, user_hash)
    if not user:
        raise Exception("회원 정보를 찾을 수 없습니다.")
    return user

def get_sns_user(db, sns_login_type, sns_id):
    return UserRepository.get_user_by_sns_account(db, sns_login_type, sns_id)

def update_user_last_login(db, user):
    UserRepository.update_last_login(db, user.id)

""" 비밀번호 찾기 """
async def find_password(db, data) -> CommonResponse:

    try:
        user = validate_user_email_and_name(db, data.get("email"), data.get("name"))

        validate_use_password_reset(db, user.id)

        reset_token = create_password_reset_token(db, user.id)
        if not reset_token:
            raise Exception("비밀번호 재설정 토큰 생성에 실패했습니다.")

        return CommonResponse(success=True, message="회원 정보를 확인했습니다.", data={"token": reset_token.token})
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

async def confirm_password_reset(db, data) -> CommonResponse:
    try:
        valid_token = validate_password_token(db, data.get("token"))

        user = validate_user_id(db, valid_token.user_id)

        # 비밀번호 해싱 및 업데이트
        new_password = hash_password(data.get("new_password"))
        UserRepository.update(db, user, {"password": new_password}, is_commit=False)

        # 토큰 사용 처리
        update_password_reset_token_expire(db, valid_token)
        db.commit()

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    return CommonResponse(success=True, message="비밀번호가 성공적으로 초기화되었습니다.", data=None)

def get_my_info(db, data) -> CommonResponse:
    from app.models.feeds import Feeds
    from app.models.feeds_likes import FeedsLikes
    from app.models.meals_calendar import MealsCalendars

    try:
        user = validate_user(db, data["user_hash"])
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    feed_count = db.query(Feeds).filter(Feeds.user_id == user.id).count()
    like_count = db.query(FeedsLikes).filter(FeedsLikes.user_id == user.id).count()
    meal_count = db.query(MealsCalendars).filter(MealsCalendars.user_id == user.id).count()

    result = {
        "feed_count": feed_count,
        "like_count": like_count,
        "meal_count": meal_count
    }

    return CommonResponse(success=True, message="", data=result)

# 회원 가입
async def create_user(db, user_data) -> CommonResponse:

    try:
        if user_data.get("email"):
            # 이메일 중복 체크
            validate_user_email(db, user_data.get("email"))

        if user_data.get("sns_login_type") == "EMAIL" and user_data.get("sns_id").strip() == "":
            user_data["sns_id"] = user_data.get("email").split("@")[0]

        if user_data.get("sns_id"):
            existing_sns = get_sns_user(db, user_data.get("sns_login_type"), user_data.get("sns_id"))

            if existing_sns:
                raise Exception("이미 존재하는 SNS 계정입니다.")

        # 1) 계정등록
        user_param = {
            "sns_login_type": user_data.get("sns_login_type"),
            "sns_id": user_data.get("sns_id"),
            "password": user_data.get("password"),
            "email": user_data.get("email"),
            "nickname": user_data.get("nickname"),
            "marketing_agree": user_data.get("marketing_agree", 0),
            "push_agree": user_data.get("push_agree", 0),
            "profile_image": user_data.get("profile_image"),
            "role": "USER",
        }

        new_user = UserRepository.create(db, user_param, is_commit=False)

        if not new_user :
            raise Exception("회원 생성에 실패했습니다.")

        # user 이미지 등록
        if user_data.get("profile_image"):
            image_params = await upload_file(new_user, user_data["profile_image"], "Users")
            profile_image = image_params["image_url"]
            UserRepository.update(db, new_user, {"profile_image": profile_image}, is_commit=False)
        else:

            raise Exception("프로필 이미지 업로드 실패했습니다.")

        db.flush()

        # 2) 자녀등록
        if user_data.get("children"):
            for child in user_data.get("children"):

                user_child = create_child(
                    db,
                    user_id=new_user.id,
                    child_name=child.get("child_name"),
                    child_birth=child.get("child_birth"),
                    child_gender=child.get("child_gender"),
                    is_agent=child.get("is_agent", "N"),
                )

                db.flush()

                # 2-1) 알레르기 정보 등록
                if child.get("allergies"):
                    allergy_data = get_allergy_details_by_codes(db, child.get("allergies"))

                    if allergy_data:
                        bulk_create_user_child_allergies(db, new_user.id, user_child.id, allergy_data, is_commit=False)

        db.commit()
        db.refresh(new_user)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"회원 가입 중 오류가 발생했습니다: {str(e)}", data=None)

    return CommonResponse(success=True, message="가입이 완료되었습니다.", data=None)

# 회원 정보 수정
async def update_user(db, data):

    if not data.get("view_hash"):
        return CommonResponse(success=False, error="수정을 위한 필수 정보 누락되었습니다.", data=None)

    try:
        """ 등록된 user 를 검색 """
        user = validate_user(db, data["view_hash"])

        """ 프로필 이미지 처리 """
        if data.get("file"):
            # 기존 프로필 이미지 삭제 (soft delete)
            if user.profile_image:
                soft_delete_file_by_model_id(db, model="Users", model_id=user.id)

            # 새 이미지 저장 (리사이징)
            image_params = await upload_file(user.id, data["file"], "Users")

            if not image_params:
                raise Exception("프로필 이미지 업로드 실패했습니다.")

            # 확장자와 사이즈 접미사 제거 (프론트엔드에서 조합)
            data["profile_image"] = image_params["image_url"]
            UserRepository.update(db, user, {"profile_image": data["profile_image"]}, is_commit=False)

        """ 회원 식단 선호도 업데이트 """
        if data.get("meal_group") is not None:
            import json

            # meal_group을 리스트로 변환
            meal_groups = []
            if isinstance(data["meal_group"], str):
                try:
                    meal_groups = json.loads(data["meal_group"])
                except json.JSONDecodeError:
                    meal_groups = []
            elif isinstance(data["meal_group"], list):
                meal_groups = data["meal_group"]

            # 기존 식단 선호도 삭제
            existing_meals = meal_mapper_list_by_id(db, user.id)
            for meal in existing_meals:
                db.delete(meal)
            db.flush()

            # 새로운 식단 선호도 저장
            for category_id in meal_groups:
                category = get_category_code_by_id(db, category_id)

                if not category or category.type != "MEALS_GROUP":
                    db.rollback()
                    return CommonResponse(success=False, error=f"유효하지 않은 선호 식습관 정보가 포함되어 있습니다. (ID: {category_id})", data=None)

                create_meal_mapper(db, meal_id=user.id, category_id=category_id)

            # meal_group은 relationship이므로 Users.update에서 제외
            data.pop("meal_group", None)

        # 사용자 정보 업데이트
        updated_user = UserRepository.update(db, user, data)
        db.commit()
        db.refresh(updated_user)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"회원 정보 수정 중 오류가 발생했습니다: {str(e)}", data=None)

    # 식단 선호도 조회하여 응답에 포함
    meals_mapper = meal_mapper_list_by_id(db, updated_user.id).serialize()
    meal_group_ids = [mapper.category_id for mapper in meals_mapper]

    user_response = UserResponseSchema.model_validate(updated_user)
    user_response_dict = user_response.model_dump()
    user_response_dict["meal_group"] = meal_group_ids
    # profile_image는 그대로 반환 (프론트엔드에서 backend_url과 사이즈 확장자 조합)
    if user_response_dict.get('profile_image'):
        user_response_dict['profile_image'] = user_response_dict['profile_image'].replace('\\', '/')

    return CommonResponse(success=True, message=f"회원 정보가 성공적으로 수정되었습니다.", data=user_response_dict)

# 자녀등록
async def create_user_child(db, user_hash, children):

    try:
        user = validate_user(db, user_hash)

        if not children:
            return CommonResponse(success=False, error="등록할 자녀 정보가 없습니다.", data=None)

        for child in children:
            # 딕셔너리와 객체 모두 지원
            child_id = child.get("child_id") if isinstance(child, dict) else getattr(child, "child_id", None)
            child_name = child.get("child_name") if isinstance(child, dict) else getattr(child, "child_name", None)
            child_birth = child.get("child_birth") if isinstance(child, dict) else getattr(child, "child_birth", None)
            child_gender = child.get("child_gender") if isinstance(child, dict) else getattr(child, "child_gender", None)
            is_agent = child.get("is_agent", "N") if isinstance(child, dict) else getattr(child, "is_agent", "N")
            allergies = child.get("allergies", []) if isinstance(child, dict) else getattr(child, "allergies", [])

            if child_id:
                exist_child = get_child_by_id(db, child_id)

                if exist_child:
                    params = {
                        "child_name": child_name,
                        "child_birth": child_birth,
                        "child_gender": child_gender,
                        "is_agent": is_agent if is_agent else "N"
                    }

                    update_child(db, exist_child, params, is_commit=False)

                    # 알레르기 정보 업데이트
                    if allergies:
                        allergy_data = get_allergy_details_by_codes(db, child.get("allergies"))
                        # 알레르기 코드를 name과 함께 변환
                        bulk_create_user_child_allergies(db, user.id, exist_child.id, allergy_data, is_commit=False)
            else:
                exist_child = get_child_by_id_and_name(db, user.id, child_name)
                if exist_child:
                    db.rollback()
                    raise Exception(f"이미 등록된 자녀명입니다: {child_name}")

                user_child = create_child(
                    db,
                    user_id=user.id,
                    child_name=child_name,
                    child_birth=child_birth,
                    child_gender=child_gender,
                    is_agent=is_agent if is_agent else "N",
                    is_commit=False
                )

                # flush를 호출하여 id를 생성하되 commit은 하지 않음
                db.flush()

                # 알레르기 정보 등록
                if allergies:
                    # 알레르기 코드를 name과 함께 변환
                    bulk_create_user_child_allergies(db, user.id, user_child.id, allergies, is_commit=False)

        db.commit()
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"자녀 정보 등록 중 오류가 발생했습니다: {str(e)}", data=None)

    return CommonResponse(success=True, message="자녀 정보가 성공적으로 등록되었습니다.", data=None)

""" 자녀 정보 삭제 """
async def delete_user_child(db, user_hash: str, child_id: int) -> CommonResponse:

    try:
        user = validate_user(db, user_hash)

        user_child = get_child_by_id(db, child_id)
        if not user_child or user_child.user_id != user.id:
            return CommonResponse(success=False, error="삭제할 자녀 정보를 찾을 수 없습니다.", data=None)

        delete_child(db, user_child, is_commit=False)

        db.commit()
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"자녀 정보 삭제 중 오류가 발생했습니다: {str(e)}", data=None)

    return CommonResponse(success=True, message="자녀 정보를 성공적으로 삭제하였습니다.", data=None)


# 회원차단
async def deny_usre_profile(db, user_hash, deny_user_hash):
    try:
        user = validate_user(db, user_hash)

        if not user:
            raise Exception("회원 정보를 찾을 수 없습니다.")

        deny_user = validate_user(db, deny_user_hash)
        if not deny_user:
            raise Exception("차단할 회원 정보를 찾을 수 없습니다.")

        # 차단 처리
        deny_user_process(db, user.id, deny_user.id)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

# 회원차단 list
def get_deny_users_list(db, user_hash):
    user = validate_user(db, user_hash)

    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

    deny_users = get_denies_user_list(db, user.id)
    return CommonResponse(success=True, message="", data=deny_users)

# 회원 프로필 조회
def get_user_profile(db, user_hash, user_id):
    from app.models.feeds import Feeds
    from app.models.feeds_likes import FeedsLikes
    from app.models.meals_calendar import MealsCalendars

    if user_id:
        user = UserRepository.findById(db, user_id)
    else:
        user = validate_user(db, user_hash)

    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

    # 통계 정보 조회
    feed_count = db.query(Feeds).filter(Feeds.user_id == user.id).count()
    like_count = db.query(FeedsLikes).filter(FeedsLikes.user_id == user.id).count()
    meal_count = db.query(MealsCalendars).filter(MealsCalendars.user_id == user.id).count()

    # 식단 선호도 조회
    meals_mapper = meal_mapper_list_by_id(db, user.id).serialize()
    meal_group_ids = [mapper.category_id for mapper in meals_mapper]

    # 자녀 정보 조회 s
    user_childs = get_list_with_allergies(db, user.id)

    # user_childs.allergy_names, allergy_codes 는 문자열로 반환되므로 리스트로 변환
    for child in user_childs:
        if child.get("allergy_names"):
            child["allergy_names"] = child["allergy_names"].split(',')
        else:
            child["allergy_names"] = []
        if child.get("allergy_codes"):
            child["allergy_codes"] = child["allergy_codes"].split(',')
        else:
            child["allergy_codes"] = []
    # 자녀 정보 조회 e

    user_response = UserResponseSchema.model_validate(user)
    user_response_dict = user_response.model_dump()

    # profile_image는 그대로 반환 (프론트엔드에서 backend_url과 사이즈 확장자 조합)
    if user_response_dict.get('profile_image'):
        user_response_dict['profile_image'] = user_response_dict['profile_image'].replace('\\', '/')
    user_response_dict["meal_group"] = meal_group_ids
    user_response_dict["feed_count"] = feed_count
    user_response_dict["like_count"] = like_count
    user_response_dict["meal_count"] = meal_count
    user_response_dict["user_childs"] = user_childs
    return CommonResponse(success=True, message="", data=user_response_dict)


""" 회원 검증 email or phone """
def confirm_user(db, search_type, user_email: str = None, user_phone: str = None) -> CommonResponse:
    from app.models.users import Users
    query = db.query(Users)

    if search_type == 'email':
        query = query.filter(Users.email == user_email)
    if search_type == 'phone':
        phone_cleaned = user_phone.replace("-", "")
        query = query.filter(Users.phone == phone_cleaned)

    user = query.first()

    if not user:
        return CommonResponse(success=False, error="해당 정보로 가입된 계정이 없습니다.", data=None)

    return CommonResponse(success=True, message="회원 정보를 일치합니다.", data={"user_hash": user.view_hash})

""" 비밀번호 초기화 """
def reset_password(db, data):

    try:
        import random
        import string
        user = validate_user(db, data.get("view_hash"))

        # 임시 비밀번호 생성
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))

        # 비밀번호 해싱
        hashed_password = hash_password(temp_password)

        # 비밀번호 업데이트
        user.password = hashed_password
        db.commit()
        db.refresh(user)

        # TODO : 이메일 또는 휴대폰으로 임시 비밀번호를 전송
        if data.get("type") == "email":
            # 이메일로 임시 비밀번호 전송 로직 (생략)
            pass
        elif data.get("type") == "phone":
            # 휴대폰으로 임시 비밀번호 전송 로직 (생략)
            pass

        return CommonResponse(success=True, message="비밀번호가 성공적으로 초기화되었습니다.", data={"temp_password": temp_password})

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"비밀번호 초기화 중 오류가 발생했습니다: {str(e)}", data=None)

""" 회원 로그인 """
def user_login(db, data):

    user = UserRepository.get_user_by_email(db, data.get("email"))
    if not user:
        return CommonResponse(success=False, error="일치하는 회원 정보를 찾을 수 없습니다.", data=None)

    from app.libs.password_utils import verify_password

    if not verify_password(user.password, data.get("password")):
        return CommonResponse(success=False, error="비밀번호가 일치하지 않습니다.", data=None)

    # JWT 토큰 생성
    from app.libs.jwt_utils import create_access_token
    token_data = {
        "user_id": user.id,
        "user_hash": user.view_hash,
        "email": user.email,
        "nickname": user.nickname,
        "role": user.role.value if hasattr(user.role, 'value') else user.role
    }
    access_token = create_access_token(token_data)

    # 마지막 로그인 시간 업데이트
    UserRepository.update_last_login(db, user.id)

    # 식단 선호도 조회
    meals_mapper = meal_mapper_list_by_id(db, user.id).serialize()
    meal_group_ids = [mapper.category_id for mapper in meals_mapper]

    user_response = UserResponseSchema.model_validate(user)
    user_response_dict = user_response.model_dump()
    user_response_dict["meal_group"] = meal_group_ids

    return CommonResponse(
        success=True,
        message="로그인에 성공했습니다.",
        data={
            "user": user_response_dict,
            "token": access_token
        }
    )

async def change_password(db, user_hash, data) -> CommonResponse:
    try:
        user = validate_user(db, user_hash)

        from app.libs.password_utils import verify_password

        if not verify_password(user.password, data.get("current_password")):
            return CommonResponse(success=False, error="현재 비밀번호가 일치하지 않습니다.", data=None)

        # 비밀번호 해싱 및 업데이트
        hashed_password = hash_password(data.get("new_password"))
        user.password = hashed_password
        db.commit()
        db.refresh(user)

        return CommonResponse(success=True, message="비밀번호가 성공적으로 변경되었습니다.", data=None)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"비밀번호 변경 중 오류가 발생했습니다: {str(e)}", data=None)

""" 회원 로그아웃 """
async def user_logout(db, user_hash):
    """
    JWT 기반 인증에서는 서버에서 별도 로그아웃 처리가 불필요합니다.
    프론트엔드에서 토큰을 삭제하면 로그아웃이 완료됩니다.

    향후 필요 시 구현 가능한 기능:
    - 로그아웃 시간 기록 (last_logout_at 컬럼 추가 시)
    - 토큰 블랙리스트 관리 (Redis 사용)
    - 로그아웃 이벤트 로깅
    """

    # 사용자 존재 여부만 확인
    validate_user(db, user_hash)

    # JWT 토큰은 프론트엔드에서 삭제하므로 서버에서는 추가 작업 불필요
    return CommonResponse(success=True, message="로그아웃에 성공했습니다.", data=None)

# [관리자] 회원 목록 조회 (검색 포함)
def list_users(db, sns_id: str = None, name: str = None, nickname: str = None, page: int = 1, limit: int = 20):
    from app.models.users import Users
    try:
        query = db.query(Users).filter(Users.deleted_at == None)

        # 검색 필터
        if sns_id:
            query = query.filter(Users.sns_id.like(f"%{sns_id}%"))
        if name:
            query = query.filter(Users.name.like(f"%{name}%"))
        if nickname:
            query = query.filter(Users.nickname.like(f"%{nickname}%"))

        # 전체 건수
        total = query.count()

        # 페이징
        offset = (page - 1) * limit
        users = query.order_by(Users.created_at.desc()).offset(offset).limit(limit).all()

        # Pydantic 모델로 변환
        # profile_image 처리
        users_response = [UserResponseSchema.model_validate(user) for user in users]
        for user_response_dict in users_response:
            if user_response_dict.get('profile_image'):
                user_response_dict['profile_image'] = user_response_dict['profile_image'].replace('\\', '/')

        total_pages = (total + limit - 1) // limit

        return CommonResponse(
            success=True,
            message="",
            data={
                "users": users_response,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages
            }
        )

    except Exception as e:
        return CommonResponse(success=False, error=f"회원 목록 조회 중 오류가 발생했습니다: {str(e)}", data=None)

""" 사용자 이메일 계정 찾기 user_name and user_phone """
def confirm_email(db, user_name: str, user_phone: str) -> CommonResponse:
    user = UserRepository.get_user_by_name_and_phone(db, user_name, user_phone)

    if not user:
        return CommonResponse(success=False, error="일치하는 회원 정보를 찾을 수 없습니다.", data=None)

    return CommonResponse(success=True, message="회원 정보를 일치합니다.", data={"email": user.email})


""" [관리자] 회원 상세 프로필 """
def get_user_admin_profile(db, user_hash: str):
    user = validate_user(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

    comments = MealsCommentsRepository.list_by_user_id(db, user.id)

    comments_response = []
    for comment in comments:
        comment_data = {
            "feed_id": comment.feed_id,
            "parent_id": comment.parent_id,
            "comment": comment.comment,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "deleted_at": comment.deleted_at,
            "is_owner": True,
            "view_hash": comment.view_hash,
            "parent_hash": comment.parent_hash,
            "children": []
        }
        comments_response.append(comment_data)

    # feeds = Feeds.get_list(db, {"user_id": user.id}).getData()

    data = {
        "user": UserResponseSchema.model_validate(user),
        "comments": comments_response,
        # "feeds": feeds
    }

    return CommonResponse(success=True, message="", data=data)
