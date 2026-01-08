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
    BACKEND_SHOP_URL : str = os.getenv("BACKEND_SHOP_URL", "http://172.30.1.3:8000")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    PASSWORD_RESET_TOKEN_EXPIRE_TIME_MINUTES: int = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_TIME_MINUTES", "10"))
    PASSWORD_RESET_DAILY_LIMIT: int = int(os.getenv("PASSWORD_RESET_DAILY_LIMIT", "5"))
    OPENAI_API_KEY:str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_CALL_URL:str = os.getenv("OPENAI_CALL_URL", "")
    STATIC_BASE_URL:str = os.getenv("STATIC_BASE_URL", "http://172.30.1.3:8000/")
    FREE_SUMMARY_AGENT_COUNT:int = int(os.getenv("FREE_SUMMARY_AGENT_COUNT", "10"))
    PROMPT_TEMPLATES_DIR: str = os.getenv("PROMPT_TEMPLATES_DIR", "prompts")
settings = Settings()
