from fastapi import APIRouter, Depends, Request, Query
from app.services import communities_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse
from app.schemas.communities_schemas import CommunityCreateCommentRequest, CommunityCreateRequest, CommunityUpdateRequest
router = APIRouter()

""" 커뮤니티 관련 API """
@router.get("/list")
def get_community_list(
    request: Request,
    # 📌 필수 or 거의 필수
    category_code: int | None = Query(None, description="카테고리"),
    is_notice: str | None = Query(None, description="공지 여부 Y/N"),
    is_secret: str | None = Query("N" , description="비밀글 Y/N"),
    # 🔍 검색
    keyword: str | None = Query(None, description="제목/내용 검색"),
    user_nickname: str | None = Query(None, description="회원 닉네임 검색"),
    # 📅 기간 필터
    month: str | None = Query(None, description="YYYY-MM"),
    start_date: str | None = Query(None, description="시작일 YYYY-MM-DD"),
    end_date: str | None = Query(None, description="종료일 YYYY-MM-DD"),
    # 🔄 정렬
    sort_by: str | None = Query("latest", description="latest/likes/views"),
    # ⬇️ 무한스크롤용 (핵심)
    cursor: int | None = Query(None, description="마지막 community.id"),
    my_only: str | None = Query(None, description="내가 쓴 글만 Y/N"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="로그인이 필요합니다.")

    params = {
        "category_code": category_code,
        "is_notice": is_notice,
        "is_secret": is_secret,
        "keyword": keyword,
        "user_nickname": user_nickname,
        "month": month,
        "start_date": start_date,
        "end_date": end_date,
        "sort_by": sort_by,
        "cursor": cursor,
        "my_only": my_only,
        "limit": limit,
    }

    return communities_service.get_community_list(db, user_hash, params)

@router.post("/create")
def create_community(request: Request, params: CommunityCreateRequest, db: Session = Depends(get_db)) -> CommonResponse:
    client_ip = request.client.host

    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, error="로그인이 필요합니다.")

    return communities_service.create_community(db, user_hash, client_ip, params)

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
def update_community(request: Request, community_hash: str, params: CommunityUpdateRequest, db: Session = Depends(get_db)) -> CommonResponse:
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, message="로그인이 필요합니다.")

    return communities_service.update_community(db, user_hash, community_hash, params)

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