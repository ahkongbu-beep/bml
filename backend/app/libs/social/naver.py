import httpx
from app.core.config import settings

class NaverOAuth:
    """네이버 OAuth 관련 기능을 담당하는 클래스"""
    ACCESS_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
    REVOKE_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
    USER_INFO_URL = "https://openapi.naver.com/v1/nid/me"

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """네이버 액세스 토큰으로 사용자 정보 가져오기"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                NaverOAuth.USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code != 200:
                raise ValueError(f"네이버 사용자 정보 요청 실패: {response.text}")

            naver_response = response.json()
            if naver_response.get('resultcode') != '00':
                raise ValueError(f"네이버 로그인 실패: resultcode={naver_response.get('resultcode')}")

            return naver_response.get('response', {})

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> dict:
        """네이버 액세스 토큰으로 사용자 정보 가져오기"""
        async with httpx.AsyncClient() as client:

            data = {
                "grant_type": "refresh_token",
                "client_id": settings.NAVER_CLIENT_ID,
                "client_secret": settings.NAVER_SECRET_KEY,
                "refresh_token": refresh_token
            }

            response = await client.get(
                NaverOAuth.ACCESS_TOKEN_URL,
                params=data
            )
            if response.status_code != 200:
                raise ValueError(f"네이버 액세스 토큰으로 사용자 정보 요청 실패: {response.text}")
            return response.json()

    @staticmethod
    async def revoke_token(access_token: str):
        """네이버 액세스 토큰 폐기 (로그아웃)"""
        async with httpx.AsyncClient() as client:

            params = {
                "grant_type": "delete",
                "client_id": settings.NAVER_CLIENT_ID,
                "client_secret": settings.NAVER_SECRET_KEY,
                "access_token": access_token,
                "service_provider": "NAVER"
            }

            response = await client.get(
                NaverOAuth.REVOKE_TOKEN_URL,
                params=params
            )

            return response
