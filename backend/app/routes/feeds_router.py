from fastapi import APIRouter, Depends, Request, Query, UploadFile, UploadFile, File, Form
from app.services import feeds_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse
from app.schemas.feeds_schemas import FeedLikeToggleRequest
router = APIRouter()

""" 피드 해쉬태그 검색 """
@router.get("/tags/search")
def search_feed_tags(query_text: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    return feeds_service.search_feed_tags(db, query_text)

""" 피드 좋아요 토글 """
@router.post("/like/{feed_id}/toggle")
def toggle_feed_like(feed_id: int, request: FeedLikeToggleRequest, db: Session = Depends(get_db)):

    if not request.user_hash:
        return CommonResponse(success=False, error="user_hash는 필수 항목입니다.", data=None)

    return feeds_service.toggle_feed_like(db, feed_id, request.user_hash)

@router.get("/detail/{feed_id}")
def get_feed_detail(feed_id: int, db: Session = Depends(get_db)):
    return feeds_service.get_feed_detail(db, feed_id)

@router.get("/list")
def list_feeds(db: Session = Depends(get_db), limit: int = Query(10, ge=1), offset: int = Query(0, ge=0), user_hash: str = Query(None)):
    return feeds_service.list_feeds(db, limit=limit, offset=offset, user_hash=user_hash)

@router.post("/create")
async def create_feed(
    user_hash: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    is_public: str = Form('Y'),
    tags: str = Form(''),
    files: list[UploadFile] = File(None),   # 여러 파일 지원
    db: Session = Depends(get_db)
):

    if title.strip() == "" or content.strip() == "":
        return CommonResponse(success=False, error="title과 content는 필수 항목입니다.", data=None)

    return await feeds_service.create_feed(
        db=db,
        user_hash=user_hash,
        title=title,
        content=content,
        is_public=is_public,
        tags=tags,
        files=files
    )

@router.put("/update/{feed_id}")
async def update_feed(
    feed_id: int,
    title: str = Form(...),
    content: str = Form(...),
    is_public: str = Form('Y'),
    tags: str = Form(''),
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
        files=files
    )