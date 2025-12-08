"""
비밀번호 암호화 및 검증 유틸리티
argon2-cffi 기반
"""
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError


# Argon2 PasswordHasher 인스턴스 (싱글톤 패턴)
_ph = PasswordHasher()


def hash_password(plain_password: str) -> str:
    """
    평문 비밀번호를 argon2로 해시화

    Args:
        plain_password: 평문 비밀번호

    Returns:
        str: 해시된 비밀번호

    Example:
        >>> hashed = hash_password("mypassword123")
        >>> print(hashed)
        '$argon2id$v=19$m=65536,t=3,p=4$...'
    """
    return _ph.hash(plain_password)


def verify_password(hashed_password: str, plain_password: str) -> bool:
    """
    저장된 해시 비밀번호와 입력된 평문 비밀번호 비교

    Args:
        hashed_password: 데이터베이스에 저장된 해시된 비밀번호
        plain_password: 사용자가 입력한 평문 비밀번호

    Returns:
        bool: 비밀번호 일치 여부

    Example:
        >>> hashed = hash_password("mypassword123")
        >>> verify_password(hashed, "mypassword123")
        True
        >>> verify_password(hashed, "wrongpassword")
        False
    """
    try:
        _ph.verify(hashed_password, plain_password)
        return True
    except (VerifyMismatchError, InvalidHashError):
        return False


def check_needs_rehash(hashed_password: str) -> bool:
    """
    비밀번호 해시가 재해시 필요한지 확인
    (보안 파라미터가 업데이트된 경우)

    Args:
        hashed_password: 저장된 해시 비밀번호

    Returns:
        bool: 재해시 필요 여부
    """
    try:
        return _ph.check_needs_rehash(hashed_password)
    except:
        return True
