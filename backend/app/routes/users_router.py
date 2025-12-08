from fastapi import APIRouter, Depends, File, Form, Form, Request, Query, UploadFile
from app.services import users_service
from app.schemas.users_schemas import UserCreateSchema, UserLoginRequest
from app.schemas.common_schemas import CommonResponse
from app.core.database import get_db
from sqlalchemy.orm import Session
router = APIRouter()

""" 회원 가입 """
@router.post("/create")
async def create_user(
    form_data: UserCreateSchema = Depends(UserCreateSchema.as_form),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    data = form_data.dict()

    if not data.get("sns_login_type"):
        return CommonResponse(success=False, error="회원가입 유형은 필수 항목입니다.", data=None)

    if data.get("sns_login_type") == "EMAIL":
        if not data.get("password"):
            return CommonResponse(success=False, error="EMAIL 회원가입의 경우 비밀번호는 필수 항목입니다.", data=None)

    data["file"] = file

    return users_service.create_user(db, data)

""" 회원 정보 수정 """
@router.put("/update")
async def update_user(
    view_hash: str = Form(...),
    nickname: str = Form(None),
    email: str = Form(None),
    description: str = Form(None),
    child_birth: str = Form(None),
    child_gender: str = Form(None),
    marketing_agree: str = Form(None),
    push_agree: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    data = {
        "view_hash": view_hash,
        "nickname": nickname,
        "email": email,
        "description": description,
        "child_birth": child_birth,
        "child_gender": child_gender,
        "marketing_agree": int(marketing_agree) if marketing_agree else None,
        "push_agree": int(push_agree) if push_agree else None,
        "file": file
    }

    # None 값 제거
    data = {k: v for k, v in data.items() if v is not None}

    if not data.get("view_hash"):
        return {"success": False, "message": "수정을 위한 필수 정보가 없습니다.", "data": None}

    return await users_service.update_user(db, data)


""" 회원 프로필 조회 """
@router.get("/profile")
def get_user_profile(user_id: str = Query(...), db: Session = Depends(get_db)):

    if not user_id:
        return {"success": False, "message": "회원 ID가 필요합니다.", "data": None}

    return users_service.get_user_profile(db, user_id)


""" 비밀번호 초기화 """
@router.put("/reset/password")
async def reset_password(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    if (not data.get("view_hash")):
        return {"success": False, "message": "비밀번호 초기화를 위한 이메일과 이름이 필요합니다.", "data": None}

    return users_service.reset_password(db, data)


""" [관리자] 회원 목록 조회 (검색 포함) """
@router.get("/list")
def get_users_list(
    sns_id: str = Query(None),
    name: str = Query(None),
    nickname: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return users_service.list_users(db, sns_id, name, nickname, page, limit)


""" 회원로그인 """
@router.post("/login")
async def user_login(request: UserLoginRequest, db: Session = Depends(get_db)):
    data = request.dict()

    if not data.get("email") or not data.get("password"):
        return {"success": False, "message": "이메일과 비밀번호를 모두 입력해주세요.", "data": None}

    return users_service.user_login(db, data)

""" 회원 차단 """
@router.put("/denies")
async def deny_usre_profile(request: Request, db: Session = Depends(get_db)):
    data = await request.json()

    if (not data.get("user_hash")):
        return {"success": False, "message": "회원 정보가 없습니다.", "data": None}

    if (not data.get("deny_user_hash")):
        return {"success": False, "message": "차단할 회원 정보가 없습니다.", "data": None}

    return users_service.deny_usre_profile(db, data.get("user_hash"), data.get("deny_user_hash"))
