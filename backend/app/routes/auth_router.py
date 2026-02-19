from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth_schemas import (
    EmailLoginRequest,
    GoogleLoginRequest,
    KakaoLoginRequest,
    NaverLoginRequest,
    RefreshTokenRequest
)
from app.schemas.common_schemas import CommonResponse
from app.services import auth_service

router = APIRouter()


@router.post("/login", response_model=CommonResponse)
async def email_login(
    request: EmailLoginRequest,
    db: Session = Depends(get_db)
):
    """
    이메일 로그인

    - **email**: 사용자 이메일
    - **password**: 비밀번호
    """
    return auth_service.email_login(db, request.email, request.password)


@router.post("/google", response_model=CommonResponse)
async def google_login(
    request: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """
    구글 소셜 로그인

    - **idToken**: 구글 ID 토큰 (필수)
    - **accessToken**: 구글 액세스 토큰 (선택)

    ## 프론트엔드 설정 필요
    1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
    2. 환경 변수 설정: GOOGLE_CLIENT_ID

    ## 응답
    - 기존 사용자: 로그인 처리
    - 신규 사용자: 자동 회원가입 후 로그인
    """
    print(f"[Auth Router] Received Google login request")
    print(f"[Auth Router] idToken present: {bool(request.idToken)}")
    print(f"[Auth Router] idToken length: {len(request.idToken) if request.idToken else 0}")

    if not request.idToken:
        return CommonResponse(success=False, message="ID 토큰이 필요합니다.", data=None)

    return await auth_service.google_login(db, request.idToken, request.accessToken, request.refreshToken)


@router.post("/kakao", response_model=CommonResponse)
async def kakao_login(
    request: KakaoLoginRequest,
    db: Session = Depends(get_db)
):
    """
    카카오 소셜 로그인

    - **accessToken**: 카카오 액세스 토큰

    ## 응답
    - 기존 사용자: 로그인 처리
    - 신규 사용자: 자동 회원가입 후 로그인
    """
    return await auth_service.kakao_login(db, request.accessToken)


@router.post("/naver", response_model=CommonResponse)
async def naver_login(
    request: NaverLoginRequest,
    db: Session = Depends(get_db)
):
    """
    네이버 소셜 로그인

    - **accessToken**: 네이버 액세스 토큰

    ## 응답
    - 기존 사용자: 로그인 처리
    - 신규 사용자: 자동 회원가입 후 로그인
    """
    return await auth_service.naver_login(db, request.accessToken)


@router.post("/logout", response_model=CommonResponse)
async def logout(
    db: Session = Depends(get_db)
):
    """
    로그아웃

    JWT 기반 인증에서는 프론트엔드에서 토큰을 삭제하는 것으로 로그아웃이 완료됩니다.
    이 엔드포인트는 필요 시 로그 기록 등의 추가 처리를 위해 사용할 수 있습니다.
    """
    return await auth_service.logout(db, "")

@router.post("/refresh", response_model=CommonResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh Token으로 새로운 Access Token 발급

    - **refresh_token**: Refresh Token

    ## 응답
    - 새로운 Access Token 반환
    """
    return auth_service.refresh_access_token(db, request.refresh_token)

@router.delete("/deny", response_model=CommonResponse)
async def remove_deny_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    회원 탈퇴
    """

    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, message="사용자 인증이 필요합니다.", data=None)

    return await auth_service.remove_deny_user(db, user_hash)