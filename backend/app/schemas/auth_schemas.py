from pydantic import BaseModel, EmailStr
from typing import Optional

class EmailLoginRequest(BaseModel):
    """이메일 로그인 요청"""
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    """구글 로그인 요청"""
    idToken: str
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None

class KakaoLoginRequest(BaseModel):
    """카카오 로그인 요청"""
    accessToken: str
    refreshToken: Optional[str] = None

class NaverLoginRequest(BaseModel):
    """네이버 로그인 요청"""
    accessToken: str
    refreshToken: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    """Refresh Token 요청"""
    refresh_token: str

class SocialUserInfo(BaseModel):
    """소셜 로그인 사용자 정보"""
    social_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    profile_image: Optional[str] = None
    provider: str  # GOOGLE, KAKAO, NAVER

class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str
    token_type: str = "bearer"
    user: dict

class ExchangeTokenRequest(BaseModel):
    """임시 코드 → JWT 교환 요청"""
    code: str

class FcmTokenRequest(BaseModel):
    """FCM 토큰 등록/삭제 요청"""
    fcm_token: str
    platform: Optional[str] = None  # 'android' | 'ios'
