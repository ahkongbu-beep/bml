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

class KakaoLoginRequest(BaseModel):
    """카카오 로그인 요청"""
    accessToken: str

class NaverLoginRequest(BaseModel):
    """네이버 로그인 요청"""
    accessToken: str

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
