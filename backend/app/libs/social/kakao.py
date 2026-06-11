import httpx
from app.core.config import settings

class KakaoOAuth:

    ACCESS_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
    REVOKE_TOKEN_URL = "https://kapi.kakao.com/v1/user/logout"
    USER_INFO_URL = "https://kapi.kakao.com/v2/user/me"

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """카카오 액세스 토큰으로 사용자 정보 가져오기"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                KakaoOAuth.USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code != 200:
                raise ValueError(f"카카오 사용자 정보 요청 실패: {response.text}")
            return response.json()

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> dict:
        """카카오 액세스 토큰으로 사용자 정보 가져오기"""
        async with httpx.AsyncClient() as client:

            data = {
                "grant_type": "refresh_token",
                "client_id": settings.KAKAO_REST_API_KEY,
                "refresh_token": refresh_token
            }

            response = await client.post(
                KakaoOAuth.ACCESS_TOKEN_URL,
                data=data
            )
            if response.status_code != 200:
                raise ValueError(f"카카오 액세스 토큰으로 사용자 정보 요청 실패: {response.text}")
            return response.json()

    @staticmethod
    async def unlink_token(access_token: str):
        """카카오 액세스 토큰 폐기 (로그아웃)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                KakaoOAuth.REVOKE_TOKEN_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code != 200:
                raise ValueError(f"카카오 액세스 토큰 폐기 요청 실패: {response.text}")

            return response.json()