"""
open ai 유틸리티 함수
"""
import requests
from app.core.config import settings
import os

""" OpenAI API 키 가져오기 """
def get_openai_api_key():
    """OpenAI API 키를 가져옵니다."""
    api_key = settings.OPENAI_API_KEY if hasattr(settings, 'OPENAI_API_KEY') else os.getenv('OPENAI_API_KEY')

    if not api_key:
        raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다.")

    return api_key

""" OpenAI API 호출 함수"""
def openai_call(message_format: list, model="gpt-4o-mini"):

    api_key = get_openai_api_key()
    url = settings.OPENAI_CALL_URL if hasattr(settings, 'OPENAI_CALL_URL') else os.getenv('OPENAI_CALL_URL')

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": model,
        "messages": message_format,
        "max_tokens": 2000
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"OpenAI API 요청 오류: {e}")
        return {"error": str(e)}