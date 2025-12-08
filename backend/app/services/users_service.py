"""
회원 service 가이드
- sns_login_type 이 EMAIL 인 경우 password는 필수
- 그 외 sns_login_type 인 경우 sns_id 는 필수
"""
from app.models.users import Users
from app.models.denies_users import DeniesUsers
from app.schemas.users_schemas import UserCreateSchema, UserResponseSchema
from app.schemas.common_schemas import CommonResponse
from app.libs.password_utils import hash_password

# 회원 가입
def create_user(db, user_data) -> CommonResponse:

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

    if user_data.get("sns_id"):
        existing_sns = db.query(Users).filter(
            Users.sns_login_type == user_data.get("sns_login_type"),
            Users.sns_id == user_data.get("sns_id")
        ).first()

        if existing_sns:
            return CommonResponse(success=False, error="이미 존재하는 SNS 계정입니다.", data=None)

    new_user = Users.create(db, user_data)

    """ 이미지 등록 """
    if not new_user :
        return CommonResponse(success=False, error="회원 생성에 실패했습니다.", data=None)

    if user_data.get("file"):
        from app.libs.file_utils import save_upload_file, get_file_url
        import os

        save_dir = os.path.join("attaches", "users", str(new_user.id))
        success, result, original_filename =  save_upload_file(user_data["file"], save_dir)

        if not success:
            return CommonResponse(success=False, error=result, data=None)

        # URL로 변환하여 사용자 프로필 이미지로 설정
        image_url = get_file_url(result)
        new_user.profile_image = image_url
        db.commit()
        db.refresh(new_user)
    else:
        new_user.profile_image = None

    # SQLAlchemy 모델을 Pydantic 모델로 변환
    user_response = UserResponseSchema.model_validate(new_user)
    return CommonResponse(success=True, message="회원이 성공적으로 생성되었습니다.", data=user_response)

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
            from app.libs.file_utils import save_upload_file, delete_file, get_file_url
            import os

            # 기존 프로필 이미지 삭제
            if user.profile_image:
                old_file_path = user.profile_image.replace('http://10.11.1.102:8000/', '')
                if os.path.exists(old_file_path):
                    delete_file(old_file_path)

            # 새 이미지 저장
            save_dir = os.path.join("attaches", "users", str(user.id))
            success, result, original_filename = await save_upload_file(data["file"], save_dir)

            if not success:
                return CommonResponse(success=False, error=result, data=None)

            # URL로 변환하여 데이터에 추가
            image_url = get_file_url(result)
            data["profile_image"] = image_url

        # 사용자 정보 업데이트
        updated_user = Users.update(db, user, data)

    except Exception as e:
        return CommonResponse(success=False, error=f"회원 정보 수정 중 오류가 발생했습니다: {str(e)}", data=None)

    user_response = UserResponseSchema.model_validate(updated_user)
    return CommonResponse(success=True, message=f"회원 정보가 성공적으로 수정되었습니다.", data=user_response)

# 회원차단
def deny_usre_profile(db, user_hash, deny_user_hsah):
    try:
        user = Users.findByViewHash(db, user_hash)

        if not user:
            raise Exception("회원 정보를 찾을 수 없습니다.")

        deny_user = Users.findByViewHash(db, deny_user_hsah)

        if not deny_user:
            raise Exception("차단할 회원 정보를 찾을 수 없습니다.")

        # 차단 처리
        exist_deny_user = DeniesUsers.findByUserIdAndDenyUserId(db, user.id, deny_user.id)
        if exist_deny_user:
            DeniesUsers.deleteByUserIdAndDenyUserId(db, user.id, deny_user.id)
        else:
            DeniesUsers.create(db, {
                "user_id": user.id,
                "deny_user_id": deny_user.id
            })

        return CommonResponse(success=True, message="회원 차단 상태가 성공적으로 변경되었습니다.", data=None)

    except Exception as e:
        return CommonResponse(success=False, error={str(e)}, data=None)

# 회원 프로필 조회
def get_user_profile(db, user_id):

    user = db.query(Users).filter(Users.sns_id == user_id).first()
    if not user:
        return CommonResponse(success=False, error="회원 정보를 찾을 수 없습니다.", data=None)

    user_response = UserResponseSchema.model_validate(user)
    return CommonResponse(success=True, message="", data=user_response)

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

        # 실제 서비스에서는 이메일로 임시 비밀번호 전송 로직 필요
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
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else user.role
    }
    access_token = create_access_token(token_data)

    # 마지막 로그인 시간 업데이트
    Users.update_last_login(db, user.id)

    user_response = UserResponseSchema.model_validate(user)
    return CommonResponse(
        success=True,
        message="로그인에 성공했습니다.",
        data={
            "user": user_response,
            "token": access_token
        }
    )

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
        users_response = [UserResponseSchema.model_validate(user) for user in users]

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


