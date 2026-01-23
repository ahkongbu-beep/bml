"""
회원 service 가이드
- sns_login_type 이 EMAIL 인 경우 password는 필수
- 그 외 sns_login_type 인 경우 sns_id 는 필수
"""
from sqlalchemy import func
from app.models.users import Users
from app.models.feeds import Feeds
from app.models.feeds_likes import FeedsLikes
from app.models.meals_calendar import MealsCalendars
from app.models.meals_mappers import MealsMappers
from app.models.categories_codes import CategoriesCodes
from app.models.denies_users import DeniesUsers
from app.models.users_childs import UsersChilds

from app.schemas.users_schemas import UserResponseSchema
from app.schemas.common_schemas import CommonResponse
from app.libs.password_utils import hash_password
from app.core.config import settings
from app.models.feeds_comments import FeedsComments

""" 비밀번호 찾기 """
async def find_password(db, data) -> CommonResponse:
    user = db.query(Users).filter(
        Users.email == data.get("email"),
        Users.name == data.get("name")
    ).first()

    if not user:
        return CommonResponse(success=False, error="일치하는 회원 정보를 찾을 수 없습니다.", data=None)

    from app.models.password_reset_token import PasswordResetToken

    use_count = PasswordResetToken.findByUserIdCount(db, user.id)

    if use_count >= settings.PASSWORD_RESET_DAILY_LIMIT:
        return CommonResponse(success=False, error="오늘은 더 이상 비밀번호 초기화 요청을 할 수 없습니다. 내일 다시 시도해주세요.", data=None)

    import uuid
    token = str(uuid.uuid4())
    expires_at = func.now() + settings.PASSWORD_RESET_TOKEN_EXPIRE_TIME_MINUTES * 60

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )

    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)
    return CommonResponse(success=True, message="회원 정보를 확인했습니다.", data={"token": token})

async def confirm_password_reset(db, data) -> CommonResponse:
    from app.models.password_reset_token import PasswordResetToken

    valid_token = PasswordResetToken.findValidTokenByToken(db, data.get("token"))
    if not valid_token:
        return CommonResponse(success=False, error="유효하지 않거나 만료된 토큰입니다.", data=None)

    # 만료시간 체크
    from datetime import datetime
    if valid_token.expires_at < datetime.utcnow():
        return CommonResponse(success=False, error="토큰이 만료되었습니다.", data=None)

    user = db.query(Users).filter(Users.id == valid_token.user_id).first()
    if not user:
        return CommonResponse(success=False, error="토큰에 연결된 회원 정보를 찾을 수 없습니다.", data=None)

    # 비밀번호 해싱 및 업데이트
    hashed_password = hash_password(data.get("new_password"))
    user.password = hashed_password
    db.commit()
    db.refresh(user)

    # 토큰 사용 처리
    valid_token.used_at = datetime.utcnow()
    db.commit()

    return CommonResponse(success=True, message="비밀번호가 성공적으로 초기화되었습니다.", data=None)

def get_my_info(db, data) -> CommonResponse:

    user = Users.findByViewHash(db, data.get("user_hash"))
    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

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

    if user_data.get("email"):
        # 이메일 중복 체크
        existing_user = db.query(Users).filter(Users.email == user_data.get("email")).first()
        if existing_user:
            return CommonResponse(success=False, error="이미 존재하는 이메일입니다.", data=None)

    if user_data.get("phone"):
        # 휴대폰 중복 체크
        phone = user_data.get("phone").replace("-", "")
        existing_user = db.query(Users).filter(Users.phone == phone).first()
        if existing_user:
            return CommonResponse(success=False, error="이미 존재하는 휴대폰 번호입니다.", data=None)

    if user_data.get("sns_login_type") == "EMAIL" and user_data.get("sns_id").strip() == "":
        user_data["sns_id"] = user_data.get("email").split("@")[0]

    if user_data.get("sns_id"):
        existing_sns = db.query(Users).filter(
            Users.sns_login_type == user_data.get("sns_login_type"),
            Users.sns_id == user_data.get("sns_id")
        ).first()

        if existing_sns:
            return CommonResponse(success=False, error="이미 존재하는 SNS 계정입니다.", data=None)

    # meal_group은 relationship이므로 Users 생성 시 제외
    user_create_data = {k: v for k, v in user_data.items() if k not in ['meal_group', 'file']}

    # 1) 계정등록
    new_user = Users.create(db, user_create_data, is_commit=False)

    # 2) 이미지 등록
    if not new_user :
        return CommonResponse(success=False, error="회원 생성에 실패했습니다.", data=None)

    if user_data.get("file"):
        from app.libs.file_utils import save_upload_file_with_resize, get_file_url
        import os

        save_dir = os.path.join("attaches", "users", str(new_user.id))
        success, result, original_filename, created_files = await save_upload_file_with_resize(user_data["file"], save_dir)

        if not success:
            db.rollback()
            return CommonResponse(success=False, error=result, data=None)

        # 확장자와 사이즈 접미사 제거 (프론트엔드에서 조합)
        image_url = get_file_url(result, base_url="")
        # /attaches/users/38/20260122155352_cf7e9e30_medium.webp -> /attaches/users/38/20260122155352_cf7e9e30
        image_path = image_url.replace('\\', '/')

        if '_medium.webp' in image_path:
            image_path = image_path.replace('_medium.webp', '')
        elif '.webp' in image_path:
            # _사이즈.webp 패턴 제거
            image_path = image_path.rsplit('_', 1)[0] if '_' in image_path.rsplit('/', 1)[-1] else image_path.rsplit('.', 1)[0]

        new_user.profile_image = "/" + image_path

    # 3) 회원 식단 선호도 등록
    if user_data.get("meal_group"):
        import json

        # meal_group을 리스트로 변환
        meal_groups = []
        if isinstance(user_data["meal_group"], str):
            try:
                meal_groups = json.loads(user_data["meal_group"])
            except json.JSONDecodeError:
                meal_groups = []
        elif isinstance(user_data["meal_group"], list):
            meal_groups = user_data["meal_group"]

        # 식단 선호도 저장
        for category_id in meal_groups:
            category = CategoriesCodes.findById(db, category_id)

            if not category or category.type != "MEALS_GROUP":
                db.rollback()
                return CommonResponse(success=False, error=f"유효하지 않은 선호 식습관 정보가 포함되어 있습니다. (ID: {category_id})", data=None)

            MealsMappers.create(db, {
                "user_id": new_user.id,
                "category_id": category.id
            }, is_commit=False)

    db.commit()
    db.refresh(new_user)

    # 자식 정보 등록 여부
    user_childs = UsersChilds.findByUserId(db, new_user.id)

    is_child_registered = False
    if user_childs:
        is_child_registered = True

    # SQLAlchemy 모델을 Pydantic 모델로 변환하고 dict로 변환
    user_response = UserResponseSchema.model_validate(new_user)
    user_response_dict = user_response.model_dump()
    user_response_dict["is_child_registered"] = is_child_registered

    return CommonResponse(success=True, message="회원이 성공적으로 생성되었습니다.", data=user_response_dict)

# 회원 정보 수정
async def update_user(db, data):

    if not data.get("view_hash"):
        return CommonResponse(success=False, error="수정을 위한 필수 정보 누락되었습니다.", data=None)

    try:
        """ 등록된 user 를 검색 """
        user = db.query(Users).filter(Users.view_hash == data["view_hash"]).first()

        if not user:
            return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

        """ 프로필 이미지 처리 """
        if data.get("file"):
            from app.libs.file_utils import save_upload_file_with_resize, delete_file, get_file_url
            import os
            import glob

            # 기존 프로필 이미지 삭제 (모든 사이즈)
            if user.profile_image:
                # 기본 파일 경로에서 디렉토리와 패턴 추출
                old_file_path = user.profile_image.replace(settings.FRONTEND_URL, '')
                if os.path.exists(old_file_path):
                    # 동일 패턴의 모든 파일 삭제 (original, large, medium, small, thumbnail)
                    base_dir = os.path.dirname(old_file_path)
                    base_name = os.path.basename(old_file_path)
                    # _medium.webp 부분을 제거하여 기본 패턴 추출
                    pattern = base_name.rsplit('_', 1)[0] if '_' in base_name else base_name.rsplit('.', 1)[0]
                    for old_file in glob.glob(os.path.join(base_dir, f"{pattern}_*.webp")):
                        delete_file(old_file)

            # 새 이미지 저장 (리사이징)
            save_dir = os.path.join("attaches", "users", str(user.id))
            success, result, original_filename, created_files = await save_upload_file_with_resize(data["file"], save_dir)

            if not success:
                return CommonResponse(success=False, error=result, data=None)

            # 확장자와 사이즈 접미사 제거 (프론트엔드에서 조합)
            image_url = get_file_url(result)
            # /attaches/users/38/20260122155352_cf7e9e30_medium.webp -> /attaches/users/38/20260122155352_cf7e9e30
            image_path = image_url.replace('\\', '/')
            if '_medium.webp' in image_path:
                image_path = image_path.replace('_medium.webp', '')
            elif '.webp' in image_path:
                # _사이즈.webp 패턴 제거
                image_path = image_path.rsplit('_', 1)[0] if '_' in image_path.rsplit('/', 1)[-1] else image_path.rsplit('.', 1)[0]

            data["profile_image"] = "/" + image_path

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
            existing_meals = db.query(MealsMappers).filter(MealsMappers.user_id == user.id).all()
            for meal in existing_meals:
                db.delete(meal)

            # 새로운 식단 선호도 저장
            for category_id in meal_groups:
                category = CategoriesCodes.findById(db, category_id)

                if not category or category.type != "MEALS_GROUP":
                    db.rollback()
                    return CommonResponse(success=False, error=f"유효하지 않은 선호 식습관 정보가 포함되어 있습니다. (ID: {category_id})", data=None)

                MealsMappers.create(db, {
                    "user_id": user.id,
                    "category_id": category.id
                }, is_commit=False)

            # meal_group은 relationship이므로 Users.update에서 제외
            data.pop("meal_group", None)

        # 사용자 정보 업데이트
        updated_user = Users.update(db, user, data)
        db.commit()
        db.refresh(updated_user)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"회원 정보 수정 중 오류가 발생했습니다: {str(e)}", data=None)

    # 식단 선호도 조회하여 응답에 포함
    meals_mapper = MealsMappers.getList(db, updated_user.id).serialize()
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
    user = Users.findByViewHash(db, user_hash)

    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

    try:
        if not children:
            return CommonResponse(success=False, error="등록할 자녀 정보가 없습니다.", data=None)

        for child in children:
            UsersChilds.create(
                db,
                user_id=user.id,
                child_name=child.child_name,
                child_birth=child.child_birth,
                child_gender=child.child_gender,
                is_agent=child.is_agent if child.is_agent else "N",
                is_commit=False
            )
        db.commit()
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"자녀 정보 등록 중 오류가 발생했습니다: {str(e)}", data=None)

    return CommonResponse(success=True, message="자녀 정보가 성공적으로 등록되었습니다.", data=None)

# 회원차단
async def deny_usre_profile(db, user_hash, deny_user_hash):

    user = Users.findByViewHash(db, user_hash)

    if not user:
        raise Exception("회원 정보를 찾을 수 없습니다.")

    deny_user = Users.findByViewHash(db, deny_user_hash)
    if not deny_user:
        raise Exception("차단할 회원 정보를 찾을 수 없습니다.")

    # 차단 처리
    exist_deny_user = DeniesUsers.findByUserIdAndDenyUserId(db, user.id, deny_user.id)

    try:
        if exist_deny_user:
            DeniesUsers.deleteByUserIdAndDenyUserId(db, user.id, deny_user.id)
        else:
            result = DeniesUsers.create(db, {
                "user_id": user.id,
                "deny_user_id": deny_user.id
            })

            if not result:
                raise Exception("회원 차단에 실패했습니다.")

        return CommonResponse(success=True, message="회원 차단 상태가 성공적으로 변경되었습니다.", data=None)

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

# 회원차단 list
def get_deny_users_list(db, user_hash):
    user = Users.findByViewHash(db, user_hash)

    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

    deny_users = DeniesUsers.findDenyUsersByUserId(db, user.id).serialize()
    return CommonResponse(success=True, message="", data=deny_users)

# 회원 프로필 조회
def get_user_profile(db, user_hash, user_id):

    if user_id:
        user = Users.findById(db, user_id)
    else:
        user = Users.findByViewHash(db, user_hash)

    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

    # 통계 정보 조회
    feed_count = db.query(Feeds).filter(Feeds.user_id == user.id).count()
    like_count = db.query(FeedsLikes).filter(FeedsLikes.user_id == user.id).count()
    meal_count = db.query(MealsCalendars).filter(MealsCalendars.user_id == user.id).count()

    # 식단 선호도 조회
    meals_mapper = MealsMappers.getList(db, user.id).serialize()
    meal_group_ids = [mapper.category_id for mapper in meals_mapper]

    user_response = UserResponseSchema.model_validate(user)
    user_response_dict = user_response.model_dump()
    # profile_image는 그대로 반환 (프론트엔드에서 backend_url과 사이즈 확장자 조합)
    if user_response_dict.get('profile_image'):
        user_response_dict['profile_image'] = user_response_dict['profile_image'].replace('\\', '/')
    user_response_dict["meal_group"] = meal_group_ids
    user_response_dict["feed_count"] = feed_count
    user_response_dict["like_count"] = like_count
    user_response_dict["meal_count"] = meal_count
    return CommonResponse(success=True, message="", data=user_response_dict)


""" 회원 검증 email or phone """
def confirm_user(db, search_type, user_email: str = None, user_phone: str = None) -> CommonResponse:
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

    user = db.query(Users).filter(Users.view_hash == data.get("view_hash")).first()

    if not user:
        return CommonResponse(success=False, error="일치하는 회원 정보를 찾을 수 없습니다.", data=None)

    try:
        import random
        import string

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

    user = db.query(Users).filter(
        Users.email == data.get("email")
    ).first()

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
    Users.update_last_login(db, user.id)

    # 식단 선호도 조회
    meals_mapper = MealsMappers.getList(db, user.id).serialize()
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
    user = Users.findByViewHash(db, user_hash)

    # JWT 토큰은 프론트엔드에서 삭제하므로 서버에서는 추가 작업 불필요
    return CommonResponse(success=True, message="로그아웃에 성공했습니다.", data=None)

# [관리자] 회원 목록 조회 (검색 포함)
def list_users(db, sns_id: str = None, name: str = None, nickname: str = None, page: int = 1, limit: int = 20):
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
    user = db.query(Users).filter(
        Users.name == user_name,
        Users.phone == user_phone.replace("-", "")
    ).first()

    if not user:
        return CommonResponse(success=False, error="일치하는 회원 정보를 찾을 수 없습니다.", data=None)

    return CommonResponse(success=True, message="회원 정보를 일치합니다.", data={"email": user.email})


""" [관리자] 회원 상세 프로필 """
def get_user_admin_profile(db, user_hash: str):
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

    comments = db.query(FeedsComments).filter(FeedsComments.user_id == user.id).all()

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

    feeds = Feeds.getList(db, {"user_id": user.id}).getData()

    data = {
        "user": UserResponseSchema.model_validate(user),
        "comments": comments_response,
        "feeds": feeds
    }

    return data
