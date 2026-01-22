from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

import ssl
import os
import tempfile
import atexit
from pathlib import Path

# -------------------------
# SSL 인증서 경로 처리
# -------------------------

_temp_cert_file = None  # 임시 파일 추적용

def cleanup_temp_cert():
    """애플리케이션 종료 시 임시 인증서 파일 삭제"""
    global _temp_cert_file
    if _temp_cert_file and os.path.exists(_temp_cert_file):
        try:
            os.unlink(_temp_cert_file)
        except Exception as e:
            print(f"Failed to delete temp cert file: {e}")

# 종료 시 임시 파일 정리 등록
atexit.register(cleanup_temp_cert)

def get_ssl_context():
    """
    1. Render: 환경변수 CA_CERT_PEM 사용
    2. Local: ca-certificate.pem 파일 사용
    3. Disable SSL: USE_SSL=false 환경변수로 비활성화 가능
    """
    global _temp_cert_file

    # SSL 비활성화 옵션 (개발용)
    if os.getenv("USE_SSL", "true").lower() == "false":
        return None

    pem_content = os.getenv("CA_CERT_PEM")

    if pem_content:
        # Render 환경 - 환경변수에서 인증서 읽기
        with tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".pem") as f:
            f.write(pem_content)
            _temp_cert_file = f.name
            ssl_cert_path = f.name
        print(f"Using SSL certificate from environment variable (temp file: {ssl_cert_path})")
    else:
        # 로컬 환경 - 파일 시스템에서 인증서 읽기
        ssl_cert_path = Path(__file__).parent.parent.parent / "ca-certificate.pem"
        if not ssl_cert_path.exists():
            raise FileNotFoundError(
                f"SSL certificate file not found: {ssl_cert_path}\n"
                f"Please ensure ca-certificate.pem exists or set CA_CERT_PEM environment variable"
            )
        print(f"Using SSL certificate from file: {ssl_cert_path}")

    ssl_context = ssl.create_default_context(cafile=str(ssl_cert_path))
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_REQUIRED

    return ssl_context


# -------------------------
# MySQL connect args
# -------------------------

connect_args = {
    "init_command": "SET time_zone = '+09:00'",
    "connect_timeout": 10,
}

# SSL 설정 추가
ssl_context = get_ssl_context()
if ssl_context:
    connect_args["ssl"] = ssl_context

# -------------------------
# SQLAlchemy Engine
# -------------------------

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # 연결 끊김 방지
    echo=True,            # 쿼리 로그 출력 (개발용, 운영에서는 False 추천)
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()