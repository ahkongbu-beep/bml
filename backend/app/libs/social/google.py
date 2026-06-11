import httpx
from app.core.config import settings

class GoogleOAuth:

    @staticmethod
    async def get_user_info(id_token_str: str) -> dict:
        """구글 ID 토큰 검증 및 사용자 정보 추출"""
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests

        GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
        if not GOOGLE_CLIENT_ID:
            raise ValueError("서버 설정 오류: Google Client ID가 설정되지 않았습니다.")

        idinfo = google_id_token.verify_oauth2_token(
            id_token_str,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )
        return idinfo

    @staticmethod
    async def exchange_auth_code(auth_code: str) -> dict:
        """serverAuthCode를 refresh_token으로 교환"""
        GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
        GOOGLE_SECRET_KEY = settings.GOOGLE_SECRET_KEY
        GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI

        async with httpx.AsyncClient() as client:
            data = {
                'code': auth_code,
                'client_id': GOOGLE_CLIENT_ID,
                'client_secret': GOOGLE_SECRET_KEY,
                'redirect_uri': GOOGLE_REDIRECT_URI,
                'grant_type': 'authorization_code',
            }
            response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=data
            )
            if response.status_code != 200:
                raise ValueError(f"구글 토큰 교환 실패: {response.text}")
            return response.json()

    @staticmethod
    async def revoke_token(referer_token: str):
        """구글 액세스 토큰 폐기 (로그아웃)"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://oauth2.googleapis.com/revoke',
                    params={'token': referer_token},
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                if response.status_code != 200:
                    print(f"⭕⭕Google revoke failed: {response.text}")

        except Exception as e:
            print(f"⭕⭕Error during Google revoke: {str(e)}")