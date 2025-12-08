"""
JWT 토큰 생성 및 검증 유틸리티
"""
import jwt
from datetime import datetime, timedelta
from typing import Dict, Optional

# JWT 설정 (실제 환경에서는 환경변수로 관리)
SECRET_KEY = "your-secret-key-change-this-in-production"  # 실제로는 환경변수로 관리
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT Access Token 생성

    Args:
        data: 토큰에 포함할 데이터 (user_id, email 등)
        expires_delta: 만료 시간 (기본값: 7일)

    Returns:
        str: JWT 토큰
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def verify_token(token: str) -> Optional[Dict]:
    """
    JWT 토큰 검증 및 디코딩

    Args:
        token: JWT 토큰 문자열

    Returns:
        Dict: 토큰에 포함된 데이터 또는 None (검증 실패 시)
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        # 토큰 만료
        return None
    except jwt.JWTError:
        # 토큰 검증 실패
        return None
