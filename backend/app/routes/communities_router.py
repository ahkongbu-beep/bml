from fastapi import APIRouter, Depends, Request, Query, Form, File, UploadFile
from app.services import communities_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse
from app.schemas.communities_schemas import CommunityCreateCommentRequest, CommunityListReqest
router = APIRouter()


@router.get("/list")
def get_community_list(request: Request, params: CommunityListReqest = Depends(), db: Session = Depends(get_db)):
    """
    커뮤니티 리스트 조회 API
    """
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="로그인이 필요합니다.")

    params = params.dict()
    return communities_service.get_community_list(db, user_hash, params)

@router.post("/create")
async def create_community(
    request: Request,
    title: str = Form(...),
    contents: str = Form(...),
    category_code: int = Form(...),
    is_secret: str = Form('N'),
    files: list[UploadFile] = File(None),
    db: Session = Depends(get_db)
) -> CommonResponse:
    client_ip = request.client.host

    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, error="로그인이 필요합니다.")

    return await communities_service.create_community(db, user_hash, client_ip, title, contents, category_code, is_secret, files)

""" 커뮤니티 상세 API """
@router.get("/detail/{community_hash}")
def get_community_detail(request: Request, community_hash: str, db: Session = Depends(get_db)) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, error="로그인이 필요합니다.")

    return communities_service.get_community_detail(db, user_hash, community_hash)

""" 커뮤니티 삭제 API """
@router.put("/delete/{community_hash}")
def delete_community(request: Request, community_hash: str, db: Session = Depends(get_db)) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, error="로그인이 필요합니다.")

    return communities_service.delete_community(db, user_hash, community_hash)

""" 커뮤니티 수정 API """
@router.put("/update/{community_hash}")
async def update_community(
    request: Request,
    community_hash: str,
    title: str = Form(...),
    contents: str = Form(...),
    is_secret: str = Form('N'),
    files: list[UploadFile] = File(None),
    db: Session = Depends(get_db)
) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, message="로그인이 필요합니다.")

    return await communities_service.update_community(db, user_hash, community_hash, title, contents, is_secret, files)

""" 커뮤니티 좋아요 API"""
@router.post("/like/{community_hash}")
def like_community(request: Request, community_hash: str, db: Session = Depends(get_db)) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, message="로그인이 필요합니다.")

    return communities_service.like_community(db, user_hash, community_hash)

""" 커뮤니티 댓글 작성 API """
@router.post("/comments/create/{community_hash}")
def create_community_comment(
    request: Request,
    community_hash: str,
    params: CommunityCreateCommentRequest,
    db: Session = Depends(get_db)
) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, message="로그인이 필요합니다.")

    return communities_service.create_community_comment(db, user_hash, community_hash, params)


""" 커뮤니티 댓글 수정 API """
@router.put("/comments/update/{comment_hash}")
def update_community_comment(
    request: Request,
    comment_hash: str,
    params: CommunityCreateCommentRequest,
    db: Session = Depends(get_db)
) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, message="로그인이 필요합니다.")

    return communities_service.update_community_comment(db, user_hash, comment_hash, params)

@router.put("/comments/delete/{comment_hash}")
def delete_community_comment(
    request: Request,
    comment_hash: str,
    db: Session = Depends(get_db)
) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, message="로그인이 필요합니다.")

    return communities_service.delete_community_comment(db, user_hash, comment_hash)


""" 커뮤니티 댓글 조회 API """
@router.get("/comments/{community_hash}")
def get_community_comments(
    request: Request,
    community_hash: str,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, message="로그인이 필요합니다.")

    params = {
        "community_hash": community_hash,
        "limit": limit,
    }

    return communities_service.get_community_comments(db, user_hash, params)