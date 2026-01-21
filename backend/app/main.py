from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.routes import notices_router, categories_codes_router, users_router, feeds_router, meals_router, summary_router, dashboard_router, communities_router
from app.middleware import JWTAuthMiddleware
import os


app = FastAPI(title="BML Backend API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT 인증 미들웨어 추가
app.add_middleware(JWTAuthMiddleware)

# 정적 파일 서빙 (업로드된 이미지 접근용)
attaches_dir = os.path.join(os.getcwd(), "attaches")
os.makedirs(attaches_dir, exist_ok=True)
app.mount("/attaches", StaticFiles(directory=attaches_dir), name="attaches")

app.include_router(notices_router, prefix="/notices", tags=["notices"])
app.include_router(categories_codes_router, prefix="/categories_codes", tags=["categories_codes"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(feeds_router, prefix="/feeds", tags=["feeds"])
app.include_router(meals_router, prefix="/meals", tags=["meals"])
app.include_router(summary_router, prefix="/summaries", tags=["summary"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
app.include_router(communities_router, prefix="/communities", tags=["communities"])

@app.get("/")
def root():
    return {"message": "Welcome to the BML Backend API"}