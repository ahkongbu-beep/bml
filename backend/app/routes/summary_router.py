from fastapi import APIRouter, Depends, Request, Query
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.summary_schemas import SummaryFeedRequest
from app.schemas.common_schemas import CommonResponse
from app.services import summary_service
router = APIRouter()

@router.post("/feed/item")
async def feed_summary(request: Request, body: SummaryFeedRequest, db: Session = Depends(get_db)):
    params = body.dict()
    params['user_hash'] = getattr(request.state, "user_hash", None)
    return await summary_service.feed_summary(db, params)

""" 프론트용 : AI 요약 검색 """
@router.get("/search")
async def search_summary(
    request: Request,
    model: str = Query(None, description="model"),
    model_id: int = Query(None, description="model_id"),
    query: str = Query(None, description="사용자 질의 검색어"),
    limit: int = Query(10, description="limit"),
    offset: int = Query(0, description="offset"),
    db: Session = Depends(get_db)
):
    user_hash = getattr(request.state, "user_hash", None)
    return await summary_service.search_summary(db, user_hash, model, model_id, query, limit, offset)

"""
관리자용: AI 요약 리스트 조회
"""
@router.get("/lists")
async def list_summaries(
    user_hash: str = Query(None, description="사용자 hash"),
    model: str = Query(None, description="model"),
    model_id: int = Query(None, description="model_id"),
    search_type: str = Query(None, description="검색 타입 (question, answer)"),
    search_value: str = Query(None, description="검색 값"),
    limit: int = Query(10, description="limit"),
    offset: int = Query(0, description="offset"),
    db: Session = Depends(get_db)
):
    return await summary_service.list_summaries(db, user_hash, model, model_id, search_type, search_value, limit, offset)