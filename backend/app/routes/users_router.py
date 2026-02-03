from fastapi import APIRouter, Depends, File, Form, Form, Request, Query, UploadFile
from app.services import users_service
from app.schemas.users_schemas import UserCreateSchema, UserLoginRequest, UserMyInfoRequest, UserFindPasswordRequest, UserPasswordConfirmRequest, SearchUserPasswordConfirmRequest, SearchUserAccountConfirmRequest, UserChildRegistRequest, UserChildItemSchema, UserChildDeleteRequest
from app.schemas.common_schemas import CommonResponse
from app.core.database import get_db
from sqlalchemy.orm import Session
from typing import List
router = APIRouter()

""" 비밀번호 찾기 """
@router.post("/password/find")
async def find_password(request: UserFindPasswordRequest, db: Session = Depends(get_db)):
    data = request.dict()
    if (not data.get("email")) or (not data.get("name")):
        return CommonResponse(success=False, message="비밀번호 찾기를 위한 이메일과 이름이 필요합니다.", data=None)

    return await users_service.find_password(db, data)

""" 비밀번호 초기화 """
@router.put("/password/confirm")
async def confirm_password_reset(request: UserPasswordConfirmRequest, db: Session = Depends(get_db)):
    data = request.dict()
    if (not data.get("token")) or (not data.get("new_password")):
        return CommonResponse(success=False, message="비밀번호 초기화를 위한 토큰과 새 비밀번호가 필요합니다.", data=None)

    return await users_service.confirm_password_reset(db, data)


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

    return await users_service.create_user(db, data)

""" 회원 정보 수정 """
@router.put("/update")
async def update_user(
    request: Request,
    nickname: str = Form(None),
    email: str = Form(None),
    description: str = Form(None),
    child_birth: str = Form(None),
    child_gender: str = Form(None),
    child_age_group: int = Form(None),
    meal_group: str = Form(None),
    marketing_agree: str = Form(None),
    push_agree: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    user_hash = getattr(request.state, "user_hash", None)

    if user_hash is None:
        return CommonResponse(success=False, error="사용자 인증이 필요합니다.", data=None)

    data = {
        "view_hash": user_hash,
        "nickname": nickname,
        "email": email,
        "description": description,
        "child_birth": child_birth,
        "child_gender": child_gender,
        "child_age_group": child_age_group,
        "meal_group": meal_group,
        "marketing_agree": int(marketing_agree) if marketing_agree else None,
        "push_agree": int(push_agree) if push_agree else None,
        "file": file
    }

    # None 값 제거
    data = {k: v for k, v in data.items() if v is not None}

    if not user_hash:
        return CommonResponse(success=False, error="회원 식별을 위한 정보가 없습니다.", data=None)

    return await users_service.update_user(db, data)

""" 자녀 정보 등록 """
@router.post("/children/create")
async def create_user_child(request: Request, body: List[UserChildItemSchema], db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)
    print("user_hash:", user_hash)

    if not user_hash:
        return CommonResponse(success=False, message="사용자 인증이 필요합니다.", data=None)

    return await users_service.create_user_child(db, user_hash, body)

""" 자녀 정보 삭제 """
@router.delete("/children/delete")
async def delete_user_child(request: Request, body: UserChildDeleteRequest, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, message="사용자 인증이 필요합니다.", data=None)

    return await users_service.delete_user_child(db, user_hash, body.child_id)


""" 회원 프로필 조회 """
@router.get("/profile")
def get_user_profile(user_hash: str = Query(''), user_id: str = Query(''), db: Session = Depends(get_db)):
    return users_service.get_user_profile(db, user_hash, user_id)

""" 내 정보 조회(좋아요, 피드등록 etc) """
@router.post("/me")
def get_my_info(request: Request, db: Session = Depends(get_db)):

    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, message="사용자 인증이 필요합니다.", data=None)

    data = {
        "user_hash": user_hash
    }
    return users_service.get_my_info(db, data)


""" 회원 조회 이메일 찾기 name and phone """
@router.post("/confirm/email")
def confirm_email(request: SearchUserAccountConfirmRequest, db: Session = Depends(get_db)):
    if (not request.user_name) or (not request.user_phone):
        return CommonResponse(success=False, message="이메일로 회원 조회를 하려면 이름과 휴대폰 번호 정보가 필요합니다.", data=None)

    return users_service.confirm_email(db, request.user_name, request.user_phone)


""" 회원 조회 비밀번호찾기 email or phone """
@router.post("/confirm/user")
def confirm_user(request: SearchUserPasswordConfirmRequest, db: Session = Depends(get_db)):
    if (request.search_type not in ['email', 'phone']):
        return CommonResponse(success=False, message="회원 조회 유형은 email 또는 phone 이어야 합니다.", data=None)

    if request.search_type == 'email' and (not request.user_email):
        return CommonResponse(success=False, message="이메일로 회원 조회를 하려면 이메일 정보가 필요합니다.", data=None)

    if request.search_type == 'phone' and (not request.user_phone):
        return CommonResponse(success=False, message="휴대폰 번호로 회원 조회를 하려면 휴대폰 번호 정보가 필요합니다.", data=None)

    return users_service.confirm_user(db, request.search_type, request.user_email, request.user_phone)

""" 비밀번호 초기화 """
@router.put("/reset/password")
async def reset_password(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    if (not data.get("view_hash")):
        return CommonResponse(success=False, message="비밀번호 초기화를 위한 이메일과 이름이 필요합니다.", data=None)

    return users_service.reset_password(db, data)

""" 회원 차단 """
@router.post("/denies")
async def deny_usre_profile(request: Request, db: Session = Depends(get_db)):
    data = await request.json()

    user_hash = getattr(request.state, "user_hash", None)

    if (not data.get("deny_user_hash")):
        return CommonResponse(success=False, message="차단할 회원 정보가 없습니다.", data=None)

    return await users_service.deny_usre_profile(db, user_hash, data.get("deny_user_hash"))

""" 회원 차단 목록 조회 """
@router.get("/denies")
def get_deny_users_list(request: Request, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, message="회원 정보가 없습니다.", data=None)

    return users_service.get_deny_users_list(db, user_hash)


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



""" [관리자] 회원 상세 프로필 """
@router.get("/profile/detail")
def get_user_admin_profile(user_hash: str = Query(...), db: Session = Depends(get_db)):
    if not user_hash:
        return CommonResponse(success=False, message="회원 정보가 없습니다.", data=None)

    return users_service.get_user_admin_profile(db, user_hash)