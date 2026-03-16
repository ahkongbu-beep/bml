"""
인증 관련 서비스
- 이메일 로그인
- 소셜 로그인 (구글, 카카오, 네이버)
- 로그아웃
"""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.repository.meals_mappers_repository import MealsMappersRepository

from app.models.users import Users

from app.services.users_service import validate_user, validate_user_email, get_sns_user, update_user_last_login

from app.schemas.users_schemas import UserResponseSchema
from app.schemas.common_schemas import CommonResponse
from app.schemas.auth_schemas import SocialUserInfo
from app.libs.password_utils import verify_password
from app.libs.jwt_utils import create_access_token, create_refresh_token, verify_token
import httpx
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
    """구글 로그인"""
    try:
        print(f"[Google Login] Starting... ID Token length: {len(id_token) if id_token else 0}")

        # 구글 ID 토큰 검증
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests

        # 환경 변수에서 구글 클라이언트 ID 가져오기
        GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
        GOOGLE_SECRET_KEY = settings.GOOGLE_SECRET_KEY
        GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI

        if not GOOGLE_CLIENT_ID:
            return CommonResponse(success=False, message="서버 설정 오류: Google Client ID가 설정되지 않았습니다.", data=None)

        # ID 토큰 검증 및 사용자 정보 추출
        idinfo = google_id_token.verify_oauth2_token(
            id_token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # serverAuthCode를 refresh_token으로 교환
        actual_refresh_token = None
        if refresh_token:
            try:
                async with httpx.AsyncClient() as client:
                    data = {
                        'code': refresh_token,  # serverAuthCode
                        'client_id': GOOGLE_CLIENT_ID,
                        'client_secret': GOOGLE_SECRET_KEY,
                        'redirect_uri': GOOGLE_REDIRECT_URI,
                        'grant_type': 'authorization_code',
                    }

                    token_response = await client.post(
                        'https://oauth2.googleapis.com/token',
                        data=data
                    )

                    if token_response.status_code == 200:
                        token_data = token_response.json()
                        actual_refresh_token = token_data.get('refresh_token')
                        if actual_refresh_token:
                            print(f"[Google Login] ✅ Refresh token obtained successfully")
                        else:
                            print(f"[Google Login] ⚠️ No refresh_token in response (user already authorized app before)")
                            print(f"[Google Login] 💡 To get refresh_token: Revoke app access at https://myaccount.google.com/permissions")
                    else:
                        print(f"[Google Login] Token exchange failed: {token_response.text}")
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
        return _handle_social_login(db, social_user_info, actual_refresh_token)

    except ValueError as e:
        # 토큰이 유효하지 않음
        print(f"[Google Login] ValueError: {str(e)}")
        return CommonResponse(success=False, message=f"구글 로그인 실패: 유효하지 않은 토큰입니다. {str(e)}", data=None)
    except Exception as e:
        print(f"[Google Login] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return CommonResponse(success=False, message=f"구글 로그인 중 오류가 발생했습니다: {str(e)}", data=None)


async def kakao_login(db: Session, access_token: str) -> CommonResponse:
    """카카오 로그인"""
    try:
        # 카카오 사용자 정보 API 호출
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                return CommonResponse(success=False, message="카카오 사용자 정보를 가져오는데 실패했습니다.", data=None)

            kakao_user = response.json()

            # 사용자 정보 추출
            social_user_info = SocialUserInfo(
                social_id=str(kakao_user['id']),
                email=kakao_user.get('kakao_account', {}).get('email'),
                name=kakao_user.get('kakao_account', {}).get('profile', {}).get('nickname'),
                profile_image=kakao_user.get('kakao_account', {}).get('profile', {}).get('profile_image_url'),
                provider='KAKAO'
            )

            return _handle_social_login(db, social_user_info)

    except Exception as e:
        return CommonResponse(success=False, message=f"카카오 로그인 중 오류가 발생했습니다: {str(e)}", data=None)


async def naver_login(db: Session, access_token: str) -> CommonResponse:
    """네이버 로그인"""
    try:
        # 네이버 사용자 정보 API 호출
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://openapi.naver.com/v1/nid/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                return CommonResponse(success=False, message="네이버 사용자 정보를 가져오는데 실패했습니다.", data=None)

            naver_response = response.json()

            if naver_response.get('resultcode') != '00':
                return CommonResponse(success=False, message="네이버 로그인에 실패했습니다.", data=None)

            naver_user = naver_response.get('response', {})

            # 사용자 정보 추출
            social_user_info = SocialUserInfo(
                social_id=naver_user['id'],
                email=naver_user.get('email'),
                name=naver_user.get('name'),
                profile_image=naver_user.get('profile_image'),
                provider='NAVER'
            )

            return _handle_social_login(db, social_user_info)

    except Exception as e:
        return CommonResponse(success=False, message=f"네이버 로그인 중 오류가 발생했습니다: {str(e)}", data=None)


def _handle_social_login(db: Session, social_info: SocialUserInfo, refresh_token: Optional[str] = None) -> CommonResponse:
    """소셜 로그인 공통 처리"""
    from app.libs.hash_utils import generate_sha256_hash

    # DB에서 사용자 검색
    user = get_sns_user(db, social_info.provider, social_info.social_id)

    # 신규 사용자인 경우 자동 회원가입
    if not user:
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

    # refresh_token 업데이트 (있을 경우)
    if refresh_token and user.referer_token != refresh_token:
        user.referer_token = refresh_token
        db.flush()  # ID 생성 위해 flush
    elif refresh_token:
        print(f"[Social Login] ℹ️ Refresh_token unchanged for user {user.email}")
    else:
        if user.referer_token:
            print(f"[Social Login] ✅ User already has refresh_token in DB")
        else:
            print(f"[Social Login] ❌ User has no refresh_token (revoke app access to get one)")

    user.deleted_at = None
    user.is_active = 1
    user.updated_at = func.now()
    db.flush()

    # 프로필 이미지 업데이트 (소셜 로그인 시 최신 이미지로)
    if social_info.profile_image and user.profile_image != social_info.profile_image:
        user.profile_image = social_info.profile_image
        db.flush()

    db.commit()

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

    user_response = UserResponseSchema.model_validate(user)
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

    # 구글 revoke 처리
    if user.sns_login_type == 'GOOGLE':
        print(f"Revoking Google tokens for user ID: {user.id}, Token: {user.referer_token}")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://oauth2.googleapis.com/revoke',
                    params={'token': user.referer_token},
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                if response.status_code != 200:
                    print(f"Google revoke failed: {response.text}")
        except Exception as e:
            print(f"Error during Google revoke: {str(e)}")

    # 회원 탈퇴 처리 (예: is_active 플래그 변경)
    user.is_active = 0
    user.deleted_at = func.now()
    db.commit()

    return CommonResponse(
        success=True,
        message="회원 탈퇴가 완료되었습니다.",
        data=None
    )


def refresh_access_token(db: Session, refresh_token: str) -> CommonResponse:
    """Refresh Token으로 새로운 Access Token 발급"""
    # Refresh Token 검증
    payload = verify_token(refresh_token)

    if not payload:
        return CommonResponse(
            success=False,
            message="유효하지 않거나 만료된 Refresh Token입니다.",
            data=None
        )

    # token_type 확인
    if payload.get("token_type") != "refresh":
        return CommonResponse(
            success=False,
            message="Refresh Token이 아닙니다.",
            data=None
        )

    # 사용자 확인
    user_hash = payload.get("user_hash")
    if not user_hash:
        return CommonResponse(
            success=False,
            message="토큰에 사용자 정보가 없습니다.",
            data=None
        )

    user = validate_user(db, user_hash)
    if not user:
        return CommonResponse(
            success=False,
            message="사용자를 찾을 수 없습니다.",
            data=None
        )

    if not user.is_active or user.deleted_at:
        return CommonResponse(
            success=False,
            message="비활성화되거나 삭제된 사용자입니다.",
            data=None
        )

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