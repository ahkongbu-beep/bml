from fastapi import APIRouter, Depends, Request, Query, UploadFile, UploadFile, File, Form
from app.services import feeds_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse
from app.schemas.feeds_schemas import FeedCopyRequest, FeedCreateCommentRequest
router = APIRouter()

""" 피드 해쉬태그 검색 """
@router.get("/tags/search")
def search_feed_tags(query_text: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    return feeds_service.search_feed_tags(db, query_text)

""" 피드 좋아요 토글 """
@router.post("/like/{feed_id}/toggle")
def toggle_feed_like(feed_id: int, request: Request, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return feeds_service.toggle_feed_like(db, feed_id, user_hash)

@router.get("/detail/{feed_id}")
def get_feed_detail(feed_id: int, request: Request, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    return feeds_service.get_feed_detail(db, feed_id, user_hash)

@router.post("/copy")
def copy_feed(request: Request, params: FeedCopyRequest, db: Session = Depends(get_db)):

    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return feeds_service.copy_feed(db, user_hash, params=params)

@router.get("/list")
def list_feeds(
    request: Request,
    db: Session = Depends(get_db),
    type: str = Query("list"),
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    cursor: int = Query(None),
    title: str=Query(None),
    nickname: str=Query(None),
    sort_by: str=Query("created_at"),
    start_date: str=Query(None),
    end_date: str=Query(None),
    target_user_hash: str=Query(None)
):
    user_hash = getattr(request.state, "user_hash", None)
    return feeds_service.list_feeds(db, type=type, limit=limit, offset=offset, cursor=cursor, user_hash=user_hash, title=title, nickname=nickname, sort_by=sort_by, start_date=start_date, end_date=end_date, target_user_hash=target_user_hash)

@router.post("/comments/create")
def create_feed_comment(request: Request, comment_request: FeedCreateCommentRequest, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash or not comment_request.feed_id or not comment_request.comment:
        return CommonResponse(success=False, error="인증 및 feed_id, comment는 필수 항목입니다.", data=None)

    return feeds_service.create_feed_comment(
        db=db,
        user_hash=user_hash,
        feed_id=comment_request.feed_id,
        comment=comment_request.comment,
        parent_hash=comment_request.parent_hash
    )

@router.delete("/comments/{comment_hash}")
def delete_feed_comment(comment_hash: str, request: Request, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return feeds_service.delete_feed_comment(
        db=db,
        comment_hash=comment_hash,
        user_hash=user_hash
    )

@router.get("/comments/list")
def list_feed_comments(request: Request, feed_id: int = Query(...), limit: int = Query(10, ge=1), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)
    return feeds_service.list_feed_comments(db, user_hash, feed_id, limit, offset)

@router.post("/create")
async def create_feed(
    request: Request,
    title: str = Form(...),
    content: str = Form(...),
    is_public: str = Form('Y'),
    tags: str = Form(''),
    category_id: int = Form(0),
    meal_condition: str = Form('2'),
    is_share_meal_plan: str = Form('N'),
    files: list[UploadFile] = File(None),   # 여러 파일 지원
    db: Session = Depends(get_db)
):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    if title.strip() == "" or content.strip() == "":
        return CommonResponse(success=False, error="title과 content는 필수 항목입니다.", data=None)

    return await feeds_service.create_feed(
        db=db,
        user_hash=user_hash,
        title=title,
        content=content,
        is_public=is_public,
        tags=tags,
        is_share_meal_plan=is_share_meal_plan,
        category_id=category_id,
        meal_condition=meal_condition,
        files=files
    )

@router.put("/update/{feed_id}")
async def update_feed(
    feed_id: int,
    title: str = Form(...),
    content: str = Form(...),
    is_public: str = Form('Y'),
    tags: str = Form(''),
    is_share_meal_plan: str = Form('N'),
    category_id: int = Form(0),
    meal_condition: str = Form('2'),
    files: list[UploadFile] = File(None),   # 여러 파일 지원
    db: Session = Depends(get_db)
):

    if title.strip() == "" or content.strip() == "":
        return CommonResponse(success=False, error="title과 content는 필수 항목입니다.", data=None)

    return await feeds_service.update_feed(
        db=db,
        feed_id=feed_id,
        title=title,
        content=content,
        is_public=is_public,
        tags=tags,
        is_share_meal_plan=is_share_meal_plan,
        category_id=category_id,
        meal_condition=meal_condition,
        files=files
    )

@router.delete("/delete/{feed_id}")
def delete_feed(feed_id: int, request: Request, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return feeds_service.delete_feed(
        db=db,
        feed_id=feed_id,
        user_hash=user_hash
    )

""" 좋아요 리스트 """
@router.get("/like/list")
def list_feed_likes(request: Request, limit: int = Query(30, ge=1), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return feeds_service.list_feed_likes(db, user_hash, limit, offset)