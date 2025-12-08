"""
해시 유틸리티 함수들
"""
import hashlib

def generate_sha256_hash(*args) -> str:
    """
    여러 인자들을 연결하여 SHA256 해시값 생성

    Args:
        *args: 해시화할 문자열들

    Returns:
        str: SHA256 해시값 (hex)

    Example:
        >>> generate_sha256_hash("EMAIL", "user123", "홍길동", "hong@example.com", "01012345678")
        'a1b2c3d4e5f6...'
    """
    hash_string = "-".join(str(arg) for arg in args)
    return hashlib.sha256(hash_string.encode('utf-8')).hexdigest()


def generate_md5_hash(*args) -> str:
    """
    여러 인자들을 연결하여 MD5 해시값 생성

    Args:
        *args: 해시화할 문자열들

    Returns:
        str: MD5 해시값 (hex)
    """
    hash_string = "-".join(str(arg) for arg in args)
    return hashlib.md5(hash_string.encode('utf-8')).hexdigest()
