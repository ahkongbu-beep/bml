"""
인증 관련 서비스
- 이메일 로그인
- 소셜 로그인 (구글, 카카오, 네이버)
- 로그아웃
"""
from sqlalchemy.orm import Session
from app.models.users import Users
from app.models.meals_mappers import MealsMappers
from app.schemas.users_schemas import UserResponseSchema
from app.schemas.common_schemas import CommonResponse
from app.schemas.auth_schemas import SocialUserInfo
from app.libs.password_utils import verify_password
from app.libs.jwt_utils import create_access_token
import httpx
import os
from typing import Optional


def email_login(db: Session, email: str, password: str) -> CommonResponse:
    """이메일 로그인"""
    user = db.query(Users).filter(Users.email == email).first()

    if not user:
        return CommonResponse(success=False, message="일치하는 회원 정보를 찾을 수 없습니다.", data=None)

    if not verify_password(user.password, password):
        return CommonResponse(success=False, message="비밀번호가 일치하지 않습니다.", data=None)

    return _generate_login_response(db, user)


async def google_login(db: Session, id_token: str, access_token: Optional[str] = None) -> CommonResponse:
    """구글 로그인"""
    try:
        print(f"[Google Login] Starting... ID Token length: {len(id_token) if id_token else 0}")

        # 구글 ID 토큰 검증
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests

        # 환경 변수에서 구글 클라이언트 ID 가져오기
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        print(f"[Google Login] Client ID: {GOOGLE_CLIENT_ID[:20]}..." if GOOGLE_CLIENT_ID else "None")

        if not GOOGLE_CLIENT_ID:
            return CommonResponse(success=False, message="서버 설정 오류: Google Client ID가 설정되지 않았습니다.", data=None)

        print(f"[Google Login] Verifying token...")
        # ID 토큰 검증 및 사용자 정보 추출
        idinfo = google_id_token.verify_oauth2_token(
            id_token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        print(f"[Google Login] Token verified. User: {idinfo.get('email')}")

        # 사용자 정보 추출
        social_user_info = SocialUserInfo(
            social_id=idinfo['sub'],
            email=idinfo.get('email'),
            name=idinfo.get('name'),
            profile_image=idinfo.get('picture'),
            provider='GOOGLE'
        )

        return _handle_social_login(db, social_user_info)

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


def _handle_social_login(db: Session, social_info: SocialUserInfo) -> CommonResponse:
    """소셜 로그인 공통 처리"""
    # DB에서 사용자 검색
    user = db.query(Users).filter(
        Users.sns_id == social_info.social_id,
        Users.sns_login_type == social_info.provider
    ).first()

    # 신규 사용자인 경우 자동 회원가입
    if not user:
        user = Users(
            sns_id=social_info.social_id,
            sns_login_type=social_info.provider,
            email=social_info.email,
            name=social_info.name,
            nickname=social_info.name or f"{social_info.provider}_user",
            profile_image=social_info.profile_image,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 프로필 이미지 업데이트 (소셜 로그인 시 최신 이미지로)
    if social_info.profile_image and user.profile_image != social_info.profile_image:
        user.profile_image = social_info.profile_image
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

    # 마지막 로그인 시간 업데이트
    Users.update_last_login(db, user.id)

    # 식단 선호도 조회
    meals_mapper = MealsMappers.getList(db, user.id).serialize()
    meal_group_ids = [mapper.category_id for mapper in meals_mapper]

    # 자녀 정보 조회
    from app.models.users_childs import UsersChilds
    user_childs = db.query(UsersChilds).filter(
        UsersChilds.user_id == user.id,
        UsersChilds.deleted_at.is_(None)
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
            "token": access_token
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
