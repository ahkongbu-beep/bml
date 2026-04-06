from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import auth_router, notices_router, categories_codes_router, users_router, feeds_router, meals_router, summary_router, communities_router, attaches_router, likes_router, admin_router
from app.middleware import JWTAuthMiddleware
from fastapi.exceptions import RequestValidationError
import os
import app.models  # noqa: F401 - 모델 관계 mapper 등록

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

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):

    errors = []

    for err in exc.errors():
        field = ".".join(str(x) for x in err["loc"][1:])
        errors.append(f"{field}: {err['msg']}")

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "; ".join(errors),
            "data": None
        }
    )


# 정적 파일 서빙 (업로드된 이미지 접근용)
attaches_dir = os.path.join(os.getcwd(), "attaches")
os.makedirs(attaches_dir, exist_ok=True)
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(notices_router, prefix="/notices", tags=["notices"])
app.include_router(categories_codes_router, prefix="/categories_codes", tags=["categories_codes"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(feeds_router, prefix="/feeds", tags=["feeds"])
app.include_router(meals_router, prefix="/meals", tags=["meals"])
app.include_router(likes_router, prefix="/likes", tags=["likes"])
app.include_router(summary_router, prefix="/summaries", tags=["summary"])
app.include_router(communities_router, prefix="/communities", tags=["communities"])
app.include_router(attaches_router, prefix="/attaches", tags=["attaches"])
@app.get("/")
def root():
    return {"message": "Welcome to the BML Backend API"}