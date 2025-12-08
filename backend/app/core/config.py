from dotenv import load_dotenv
import os

load_dotenv()


class Settings():
    # 데이터베이스 설정
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # API 설정
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "BML Backend API"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # CORS 설정
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    BACKEND_SHOP_URL : str = os.getenv("BACKEND_SHOP_URL", "http://10.11.1.102:8000")

settings = Settings()
