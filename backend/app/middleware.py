"""
JWT 인증 미들웨어
Authorization 헤더에서 JWT 토큰을 추출하고 검증하여 request.state에 사용자 정보 저장
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.libs.jwt_utils import verify_token


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    JWT 토큰을 검증하고 request.state에 사용자 정보를 저장하는 미들웨어
    """
    EXCLUDE_PATHS = {
        "/docs",
        "/ads",
        "/advertisers",
        "/openapi.json",
        "/redoc",
    }

    EXCLUDE_PREFIXES = (
        "/advertisers/add",
        "/advertisers/",
        "/auth/naver/callback",
        "/auth/naver/",
        "/auth/exchange"
    )

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # exact path 제외
        if path in self.EXCLUDE_PATHS:
            return await call_next(request)

        # prefix path 제외
        if any(path.startswith(prefix) for prefix in self.EXCLUDE_PREFIXES):
            return await call_next(request)

        # Authorization 헤더에서 토큰 추출
        authorization: str = request.headers.get("Authorization")

        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            # JWT 토큰 검증 및 디코딩
            payload = verify_token(token)

            if payload:
                # 토큰이 유효하면 request.state에 사용자 정보 저장
                request.state.user_hash = payload.get("user_hash")
                request.state.user_id = payload.get("user_id")
                request.state.email = payload.get("email")
                request.state.nickname = payload.get("nickname")
            else:
                # 토큰이 유효하지 않으면 None으로 설정
                request.state.user_hash = None
                request.state.user_id = None
                request.state.email = None
                request.state.nickname = None
        else:
            # Authorization 헤더가 없으면 None으로 설정
            request.state.user_hash = None
            request.state.user_id = None
            request.state.email = None
            request.state.nickname = None

        response = await call_next(request)
        return response
