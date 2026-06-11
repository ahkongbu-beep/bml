"""
인증 관련 서비스
- 이메일 로그인
- 소셜 로그인 (구글, 카카오, 네이버)
- 로그아웃
"""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.repository.meals_mappers_repository import MealsMappersRepository
from app.repository.user_repository import UserRepository

from app.models.users import Users

from app.services.users_service import validate_user, validate_user_email, get_sns_user, update_user_last_login
from app.services.users_childs_service import UsersChildsRepository

from app.schemas.users_schemas import UserResponse
from app.schemas.common_schemas import CommonResponse
from app.schemas.auth_schemas import SocialUserInfo
from app.libs.password_utils import verify_password
from app.libs.jwt_utils import create_access_token, create_refresh_token, verify_token
from app.libs.redis_client import redis_client
import httpx
import uuid
import json
from app.core.config import settings
from typing import Optional


def email_login(db: Session, email: str, password: str) -> CommonResponse:
    """이메일 로그인"""
    try:
        user = validate_user_email(db, email)

        if not verify_password(user.password, password):
            return CommonResponse(success=False, message="비밀번호가 일치하지 않습니다.", data=None)

    except Exception as e:
        return CommonResponse(success=False, message=str(e), data=None)

    return _generate_login_response(db, user)


async def google_login(db: Session, id_token: str, access_token: Optional[str] = None, refresh_token: Optional[str] = None) -> CommonResponse:
    """
    구글 로그인
    """
    from app.libs.social.google import GoogleOAuth

    try:
        # 구글 ID 토큰 검증 및 사용자 정보 추출
        idinfo = await GoogleOAuth.get_user_info(id_token)

        # serverAuthCode를 refresh_token으로 교환
        actual_refresh_token = None
        if refresh_token:
            try:
                token_data = await GoogleOAuth.exchange_auth_code(refresh_token)
                actual_refresh_token = token_data.get('refresh_token')
            except Exception as e:
                print(f"[Google Login] Token exchange error: {str(e)}")

        # 사용자 정보 추출
        social_user_info = SocialUserInfo(
            social_id=idinfo['sub'],
            email=idinfo.get('email'),
            name=idinfo.get('name'),
            profile_image=idinfo.get('picture'),
            provider='GOOGLE'
        )
        return _handle_social_login(db, social_user_info, actual_refresh_token, access_token=access_token)

    except ValueError as e:
        return CommonResponse(success=False, message=f"구글 로그인 실패: {str(e)}", data=None)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return CommonResponse(success=False, message=f"구글 로그인 중 오류가 발생했습니다: {str(e)}", data=None)

async def kakao_login(db: Session, access_token: str, refresh_token: Optional[str] = None) -> CommonResponse:
    """
    카카오 로그인
    """
    from app.libs.social.kakao import KakaoOAuth

    try:
        # 카카오 사용자 정보 API 호출
        kakao_user = await KakaoOAuth.get_user_info(access_token)

        # 사용자 정보 추출
        social_user_info = SocialUserInfo(
            social_id=str(kakao_user['id']),
            email=kakao_user.get('kakao_account', {}).get('email'),
            name=kakao_user.get('kakao_account', {}).get('profile', {}).get('nickname'),
            profile_image=kakao_user.get('kakao_account', {}).get('profile', {}).get('profile_image_url'),
            provider='KAKAO'
        )

        return _handle_social_login(db, social_user_info, refresh_token, access_token=access_token)

    except ValueError as e:
        return CommonResponse(success=False, message=f"카카오 로그인 실패: {str(e)}", data=None)
    except Exception as e:
        return CommonResponse(success=False, message=f"카카오 로그인 중 오류가 발생했습니다: {str(e)}", data=None)


async def naver_callback(db: Session, code: str, state: str) -> CommonResponse:
    """
    네이버 로그인 콜백 처리
    - code: 네이버에서 발급한 인증 코드
    - state: CSRF 방지용 상태값
    결과를 Redis에 저장하고 1회성 temp_code를 반환합니다.
    """
    print(f"[Naver Callback] ▶ code={code!r}, state={state!r}")
    try:
        # 네이버 액세스 토큰 요청
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://nid.naver.com/oauth2.0/token",
                params={
                    "grant_type": "authorization_code",
                    "client_id": settings.NAVER_CLIENT_ID,
                    "client_secret": settings.NAVER_SECRET_KEY,
                    "code": code,
                    "state": state
                }
            )

            print(f"[Naver Callback] token_response status={token_response.status_code}")
            print(f"[Naver Callback] token_response body={token_response.text}")

            if token_response.status_code != 200:
                return CommonResponse(success=False, message="네이버 액세스 토큰을 가져오는데 실패했습니다.", data=None)

            token_data = token_response.json()
            access_token = token_data.get("access_token")
            print(f"[Naver Callback] access_token={'✅ 존재' if access_token else '❌ 없음'}")

            if not access_token:
                return CommonResponse(success=False, message="네이버 액세스 토큰이 응답에 없습니다.", data=None)

            # 액세스 토큰으로 사용자 정보 가져오기 → JWT 발급
            login_result = await naver_login(db, access_token)
            print(f"[Naver Callback] naver_login result: success={login_result.success}, message={login_result.message!r}")
            if not login_result.success:
                return login_result

            # 1회성 임시 코드 생성 후 Redis에 30초 TTL로 저장
            temp_code = uuid.uuid4().hex

            def _json_default(obj):
                if hasattr(obj, 'isoformat'):
                    return obj.isoformat()
                raise TypeError(f'Object of type {obj.__class__.__name__} is not JSON serializable')

            redis_client.setex(
                f"temp_code:{temp_code}",
                30,
                json.dumps(login_result.data, default=_json_default)
            )
            print(f"[Naver Callback] ✅ temp_code={temp_code} → Redis 저장 완료 (30s TTL)")

            return CommonResponse(success=True, message="임시 코드가 발급되었습니다.", data={"temp_code": temp_code})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return CommonResponse(success=False, message=f"네이버 로그인 콜백 처리 중 오류가 발생했습니다: {str(e)}", data=None)


def exchange_temp_code(temp_code: str) -> CommonResponse:
    """
    임시 코드(temp_code)를 JWT 토큰으로 교환 (1회성, 30초 TTL)
    """
    key = f"temp_code:{temp_code}"
    raw = redis_client.get(key)
    if not raw:
        return CommonResponse(success=False, message="유효하지 않거나 만료된 코드입니다.", data=None)

    # 1회성: 조회 즉시 삭제
    redis_client.delete(key)

    return CommonResponse(success=True, message="로그인에 성공했습니다.", data=json.loads(raw))

async def naver_login(db: Session, access_token: str, refresh_token: Optional[str] = None) -> CommonResponse:
    """네이버 로그인"""
    from app.libs.social.naver import NaverOAuth

    try:
        # 네이버 사용자 정보 API 호출
        naver_user = await NaverOAuth.get_user_info(access_token)

        # 사용자 정보 추출
        social_user_info = SocialUserInfo(
            social_id=naver_user['id'],
            email=naver_user.get('email'),
            name=naver_user.get('name'),
            profile_image=naver_user.get('profile_image'),
            provider='NAVER'
        )

        return _handle_social_login(db, social_user_info, access_token=access_token, refresh_token=refresh_token)

    except ValueError as e:
        return CommonResponse(success=False, message=f"네이버 로그인 실패: {str(e)}", data=None)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return CommonResponse(success=False, message=f"네이버 로그인 중 오류가 발생했습니다: {str(e)}", data=None)


def _handle_social_login(db: Session, social_info: SocialUserInfo, refresh_token: Optional[str] = None, access_token: Optional[str] = None) -> CommonResponse:
    """소셜 로그인 공통 처리"""
    from app.libs.hash_utils import generate_sha256_hash

    # DB에서 사용자 검색
    user = get_sns_user(db, social_info.provider, social_info.social_id)

    # 신규 사용자인 경우 자동 회원가입
    if not user:

        if not social_info.email:
            social_info.email = f"{social_info.provider}_{social_info.social_id}@example.com"

        # view_hash 생성
        view_hash = generate_sha256_hash(
            social_info.provider,
            social_info.social_id,
            social_info.name or '',
            social_info.email or '',
            ''  # phone (소셜 로그인은 전화번호 없음)
        )

        user = Users(
            sns_id=social_info.social_id,
            sns_login_type=social_info.provider,
            email=social_info.email,
            name=social_info.name,
            nickname=social_info.name or f"{social_info.provider}_user",
            profile_image=social_info.profile_image,
            is_active=True,
            view_hash=view_hash,
            phone='',  # 소셜 로그인은 전화번호 없음
            referer_token=refresh_token,  # refresh_token 저장
            access_token=access_token,  # access_token 저장
            created_at=func.now(),
        )
        db.add(user)
        db.flush()  # ID 생성 위해 flush
        db.refresh(user)
    else:
        # 기존 사용자: view_hash가 없다면 생성
        if not user.view_hash:
            view_hash = generate_sha256_hash(
                user.sns_login_type.value if hasattr(user.sns_login_type, 'value') else user.sns_login_type,
                user.sns_id,
                user.name or '',
                user.email or '',
                user.phone or ''
            )

            user.view_hash = view_hash
            db.flush()  # ID 생성 위해 flush

    # access_token 업데이트 (있을 경우)
    if access_token and user.access_token != access_token:
        user.access_token = access_token
        db.flush()

    # refresh_token 업데이트 (있을 경우)
    if refresh_token and user.referer_token != refresh_token:
        user.referer_token = refresh_token
        db.flush()  # ID 생성 위해 flush

    user.deleted_at = None
    user.is_active = "1"
    user.updated_at = func.now()
    db.flush()

    # 프로필 이미지 업데이트 (소셜 로그인 시 최신 이미지로)
    if social_info.profile_image and user.profile_image != social_info.profile_image:
        user.profile_image = social_info.profile_image
        db.flush()

    try:
        db.commit()
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
        raise

    return _generate_login_response(db, user)

def _generate_login_response(db: Session, user: Users) -> CommonResponse:
    """로그인 응답 생성 (공통)"""
    # JWT 토큰 생성
    token_data = {
        "user_id": user.id,
        "user_hash": user.view_hash,
        "email": user.email,
        "nickname": user.nickname,
        "role": user.role.value if hasattr(user.role, 'value') else user.role
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # 마지막 로그인 시간 업데이트
    update_user_last_login(db, user)

    # 식단 선호도 조회
    meals_mapper = MealsMappersRepository.get_list(db, user.id).serialize()
    meal_group_ids = [mapper.category_id for mapper in meals_mapper]

    # 자녀 정보 조회
    from app.models.users_childs import UsersChilds
    user_childs = db.query(UsersChilds).filter(
        UsersChilds.user_id == user.id
    ).all()

    childs_data = [{
        "id": child.id,
        "child_name": child.child_name,
        "child_birth": child.child_birth.strftime('%Y-%m-%d') if child.child_birth else None,
        "child_gender": child.child_gender,
        "is_agent": child.is_agent
    } for child in user_childs]

    user_response = UserResponse.model_validate(user)
    user_response_dict = user_response.model_dump()
    user_response_dict["meal_group"] = meal_group_ids
    user_response_dict["user_childs"] = childs_data

    return CommonResponse(
        success=True,
        message="로그인에 성공했습니다.",
        data={
            "user": user_response_dict,
            "token": access_token,
            "refresh_token": refresh_token
        }
    )


async def logout(db: Session, user_hash: str) -> CommonResponse:
    """
    로그아웃
    JWT 기반 인증에서는 서버에서 별도 로그아웃 처리가 불필요합니다.
    프론트엔드에서 토큰을 삭제하면 로그아웃이 완료됩니다.
    """
    # 필요시 로그아웃 시간 기록 또는 토큰 블랙리스트 관리 가능
    return CommonResponse(
        success=True,
        message="로그아웃 되었습니다.",
        data=None
    )


async def remove_deny_user(db: Session, user_hash: str) -> CommonResponse:
    """
    회원 탈퇴
    """
    user = validate_user(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="회원 정보를 찾을 수 없습니다.", data=None)

    # 소셜 로그인 revoke 처리
    if user.sns_login_type == 'GOOGLE':
        from app.libs.social.google import GoogleOAuth
        try:
            await GoogleOAuth.revoke_token(user.referer_token)
        except Exception as e:
            print(f"⭕⭕Error during Google revoke: {str(e)}")

    elif user.sns_login_type == 'NAVER':
        from app.libs.social.naver import NaverOAuth

        try:
            access_token = user.access_token
            # access_token이 없으면 refresh_token으로 갱신
            if not access_token and user.referer_token:
                try:
                    token_info = await NaverOAuth.refresh_access_token(user.referer_token)
                    access_token = token_info.get("access_token")
                except Exception as e:
                    print(f"⭕⭕Naver token refresh failed: {str(e)}")

            if access_token:
                await NaverOAuth.revoke_token(access_token)

        except Exception as e:
            print(f"⭕⭕Error during Naver revoke: {str(e)}")

    elif user.sns_login_type == 'KAKAO':
        from app.libs.social.kakao import KakaoOAuth

        try:
            access_token = user.access_token
            # access_token이 없으면 refresh_token으로 갱신
            if not access_token and user.referer_token:
                try:
                    token_info = await KakaoOAuth.refresh_access_token(user.referer_token)
                    access_token = token_info.get("access_token")
                except Exception as e:
                    print(f"⭕⭕Kakao token refresh failed: {str(e)}")

            if access_token:
                await KakaoOAuth.unlink_token(access_token)

        except Exception as e:
            print(f"⭕⭕Error during Kakao unlink: {str(e)}")

    # 회원 탈퇴 처리 (예: is_active 플래그 변경)
    user.is_active = 0
    user.deleted_at = func.now()
    user.referer_token = None  # Refresh Token 제거
    user.access_token = None  # Access Token 제거
    user.refresh_token = None  # Refresh Token 제거

    # 탈퇴한 사용자의 FCM 토큰도 제거
    UserRepository.clear_fcm_token(db, user.id, None)

    # 탈퇴한 사용자 아이정보 제거
    user_childs = UsersChildsRepository.get_childs_by_user_id(db, user.id)
    for child in user_childs:
        UsersChildsRepository.delete(db, child, is_commit=False)

    from app.repository.meals_calendars_repository import MealsCalendarsRepository

    # 올린 피드 비활성화 처리
    meal_list = MealsCalendarsRepository.get_calendars_by_user_id(db, user.id)

    if meal_list:
        MealsCalendarsRepository.update(db, {
            "is_active": "N",
            "is_public": "N",
        }, {"user_id": user.id}, is_commit=False)

    # 커뮤니티 게시글 비활성화 처리
    from app.repository.communities_repository import CommunitiesRepository

    community_list = CommunitiesRepository.get_my_community_list(db, user.id)

    if community_list:

        CommunitiesRepository.update(db, {
            "is_active": "N",
        }, {"user_id": user.id}, is_commit=False)

    db.commit()

    return CommonResponse(
        success=True,
        message="회원 탈퇴가 완료되었습니다.",
        data=None
    )

def refresh_access_token(db: Session, refresh_token: str) -> CommonResponse:
    """
    Refresh Token으로 새로운 Access Token 발급
    """
    # Refresh Token 검증
    payload = verify_token(refresh_token)

    if not payload:
        return CommonResponse(success=False, message="유효하지 않거나 만료된 Refresh Token입니다.", data=None)

    # token_type 확인
    if payload.get("token_type") != "refresh":
        return CommonResponse(success=False, message="Refresh Token이 아닙니다.", data=None)

    # 사용자 확인
    user_hash = payload.get("user_hash")
    if not user_hash:
        return CommonResponse(success=False, message="토큰에 사용자 정보가 없습니다.", data=None)

    user = validate_user(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="사용자를 찾을 수 없습니다.", data=None)

    if not user.is_active or user.deleted_at:
        return CommonResponse(success=False, message="비활성화되거나 삭제된 사용자입니다.", data=None)

    # 새로운 Access Token 생성
    token_data = {
        "user_id": user.id,
        "user_hash": user.view_hash,
        "email": user.email,
        "nickname": user.nickname,
        "role": user.role.value if hasattr(user.role, 'value') else user.role
    }
    new_access_token = create_access_token(token_data)

    return CommonResponse(
        success=True,
        message="Access Token이 갱신되었습니다.",
        data={
            "token": new_access_token
        }
    )


def register_fcm_token(db: Session, user_hash: str, fcm_token: str) -> CommonResponse:
    """
    FCM 토큰 등록
    """
    try:
        user = validate_user(db, user_hash)
    except ValueError:
        return CommonResponse(success=False, message="사용자를 찾을 수 없습니다.", data=None)

    UserRepository.update_fcm_token(db, user.id, fcm_token)
    return CommonResponse(success=True, message="FCM 토큰이 등록되었습니다.", data=None)


def unregister_fcm_token(db: Session, user_hash: str, fcm_token: str) -> CommonResponse:
    """
    FCM 토큰 삭제
    """
    try:
        user = validate_user(db, user_hash)
    except ValueError:
        return CommonResponse(success=False, message="사용자를 찾을 수 없습니다.", data=None)

    UserRepository.clear_fcm_token(db, user.id, fcm_token)
    return CommonResponse(success=True, message="FCM 토큰이 삭제되었습니다.", data=None)

def send_mail(type: str, title: str, email: str):
    pass