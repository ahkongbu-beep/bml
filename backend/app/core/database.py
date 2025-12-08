from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

import ssl
from pathlib import Path

# SSL 인증서 파일 경로 (프로젝트 루트에 ca-certificate.pem 파일 사용)
ssl_cert_path = Path(__file__).parent.parent.parent / "ca-certificate.pem"

if not ssl_cert_path.exists():
    raise FileNotFoundError(f"SSL certificate file not found: {ssl_cert_path}")

# MySQL 연결 시 타임존 설정
connect_args = {
    "init_command": "SET time_zone = '+09:00'",
    "connect_timeout": 10,
}

# SSL 인증서 설정
ssl_context = ssl.create_default_context(cafile=str(ssl_cert_path))
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_REQUIRED
connect_args["ssl"] = ssl_context

# MySQL 연결
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # 연결 끊김 방지
    echo=True,            # 쿼리 로그 출력 (개발용)
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()