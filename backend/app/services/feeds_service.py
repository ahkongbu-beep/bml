from app.models.feeds import Feeds
from app.models.feeds_tags import FeedsTags
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.models.users import Users
from app.schemas.common_schemas import CommonResponse
from app.schemas.feeds_schemas import FeedsResponse, FeedsUserResponse, FeedLikeResponseData
from app.models.feeds_images import FeedsImages
from app.models.feeds_tags import FeedsTags
from app.models.categories_codes import CategoriesCodes
from app.models.meals_calendar import MealsCalendars
from app.models.feeds_likes import FeedsLikes
from app.models.denies_users import DeniesUsers
from app.models.feeds_comments import FeedsComments
from app.models.users_childs import UsersChilds
from app.models.users_childs_allergies import UserChildAllergy
import os
from datetime import datetime
from app.schemas.users_schemas import AllergyItemSchema, UserChildItemSchema
from sqlalchemy.exc import SQLAlchemyError
from app.services.tag_services import create_tag_mapper
from app.services.feeds_images_service import copy_image
from app.services.feeds_comments import build_comment_tree
from app.services.users_service import validate_user

async def create_meal_feed(db, meal_calendar: str, body, tags_ids):
    try:
        # 피드 생성
        create_feed_response = _create_feed_internal(
            db,
            user_id=meal_calendar.user_id,
            content=meal_calendar.contents,
            is_public=meal_calendar.is_public,
            is_share_meal_plan='Y',
            category_id=meal_calendar.category_code,
            meal_condition=meal_calendar.meal_condition,
        )

        # mapper 를 등록
        create_tag_mapper(db, "Meals", create_feed_response.id, tags_ids)

        # 이미지 복사
        meal_image = db.query(FeedsImages).filter(
            FeedsImages.img_model == "Meals",
            FeedsImages.img_model_id == meal_calendar.id,
        ).order_by(FeedsImages.sort_order.asc()).first()

        if meal_image:
            is_success = copy_image(
                db,
                origin_model="Meals",
                origin_model_instance=meal_image,
                target_model="Feeds",
                target_model_instance=create_feed_response,
            )

            if is_success == False:
                raise Exception("피드 이미지 복사에 실패했습니다.")

        db.flush()

    except Exception as e:
        db.rollback()
        return

def _create_feed_internal(db, user_id: int, content: str, is_public: str, is_share_meal_plan: str, category_id: int, meal_condition: str):

    try:
        """ feeds 생성 """
        params = {
            "user_id": user_id,
            "content": content,
            "is_public": is_public,
            "category_id": category_id,
            "meal_condition": meal_condition,
            "is_share_meal_plan": is_share_meal_plan
        }

        new_feed = Feeds.create(db, params, is_commit=False)

        if not new_feed:
            raise Exception("피드 생성에 실패했습니다.")

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"피드 생성 중 오류가 발생했습니다: {str(e)}", data=None)

    return new_feed

def toggle_feed_like(db, feed_id: int, user_hash: str):

    target_user = Users.find_by_view_hash(db, user_hash)
    if not target_user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    feed = Feeds.findById(db, feed_id)
    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    existing_like = db.query(FeedsLikes).filter(
        FeedsLikes.feed_id == feed_id,
        FeedsLikes.user_id == target_user.id
    ).first()

    # 좋아요가 이미 존재하면 취소(삭제), 없으면 추가
    try:
        if existing_like:
            # 좋아요 삭제
            db.delete(existing_like)
            # 좋아요 카운트 감소
            feed.like_count = max(0, feed.like_count - 1)
            is_liked = False
        else:
            # 좋아요 추가
            new_like = FeedsLikes(
                feed_id=feed_id,
                user_id=target_user.id
            )
            db.add(new_like)
            # 좋아요 카운트 증가
            feed.like_count += 1
            is_liked = True

        # like_count 값을 미리 저장
        like_count = feed.like_count

        # 한 번에 커밋
        db.commit()

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"좋아요 처리 중 오류가 발생했습니다: {str(e)}", data=None)

    data = FeedLikeResponseData(
        feed_id=feed_id,
        like_count=like_count,
        is_liked=is_liked
    )

    return CommonResponse(success=True, message="좋아요 상태가 성공적으로 변경되었습니다.", data=data)

def increase_view_count(db, feed):
    feed.view_count += 1
    db.commit()

def get_child_and_allergies(db, user_id):
    child = db.query(UsersChilds).filter(
        UsersChilds.user_id == user_id,
        UsersChilds.is_agent == "Y"
    ).first()

    allergies = db.query(UserChildAllergy).filter(
        UserChildAllergy.child_id == child.id
    ).all() if child else []

    return child, allergies

def feed_detail_response(feed, user, category, tags, images, child, allergies, comments, viewer_hash):
    return FeedsResponse(
        id=feed.id,
        user_id=feed.user_id,
        title=feed.title,
        content=feed.content,
        is_published=feed.is_public,
        is_share_meal_plan=feed.is_share_meal_plan,
        view_count=feed.view_count,
        like_count=feed.like_count,
        meal_condition=feed.meal_condition,
        created_at=feed.created_at,
        updated_at=feed.updated_at,
        category_id=feed.category_id,
        category_name=getattr(category, "value", None),
        tags=tags,
        images=images,
        user_hash=viewer_hash,
        user=FeedsUserResponse(
            id=user.id,
            nickname=user.nickname,
            profile_image=user.profile_image,
            user_hash=user.view_hash,
        ),
        childs=UserChildItemSchema(
            child_id=getattr(child, "id", None),
            child_name=getattr(child, "child_name", None),
            child_birth=getattr(child, "child_birth", None),
            child_gender=getattr(child, "child_gender", None),
            is_agent=getattr(child, "is_agent", None),
            allergies=[
                AllergyItemSchema(allergy_code=a.allergy_code, allergy_name=a.allergy_name)
                for a in (allergies or [])
            ]
        ),
        comments=comments
    )

# 피드 상세보기
def get_feed_detail(db, feed_id: int, user_hash: str):
    try:
        user = validate_user(db, user_hash)  # 인증된 사용자만 접근 가능
        if not user:
            raise Exception("존재하지 않는 사용자입니다.")

        feed = Feeds.findById(db, feed_id)
        if not feed:
            raise Exception("존재하지 않는 피드입니다.")

    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    target_user = Users.findById(db, feed.user_id)

    # 조회수 증가
    increase_view_count(db, feed)

    # 태그 목록 조회
    tags = FeedsTagsMapper.findTagsByFeedAndTag(db, "Feed", feed.id)
    # 이미지 목록 조회
    images = FeedsImages.find_images_by_model_id(db, "Feeds", feed_id)
    # 대표자녀 추출 및 알레르기 정보 조회
    child, allergies = get_child_and_allergies(db, target_user.id)

    category = CategoriesCodes.findById(db, feed.category_id) if feed.category_id else None

    comment_list = FeedsComments.get_list(db, {"feed_id": feed.id}, extra={}).getData()
    comments = build_comment_tree(comment_list)

    feed_data = feed_detail_response(
        feed, target_user, category, tags, images, child, allergies, comments, user_hash
    )

    return CommonResponse(success=True, message="", data=feed_data)

def copy_feed(db, user_hash: str, params):

    user = Users.find_by_view_hash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    target_feed = Feeds.findById(db, params.target_feed_id)
    if not target_feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    category_code = CategoriesCodes.findById(db, params.category_code)
    if not category_code:
        return CommonResponse(success=False, error="존재하지 않는 카테고리 코드입니다.", data=None)

    exist_calendar = MealsCalendars.findByUserIdAndDate(db, user.id, params.input_date, category_code.id)
    if exist_calendar:
        return CommonResponse(success=False, error="해당 날짜에 이미 식단이 존재합니다.", data=None)

    try:
        new_calcendar = MealsCalendars.create(db, {
            "user_id": user.id,
            "title": params.title,
            "refer_feed_id": target_feed.id,
            "month": params.input_date[:7],
            "input_date": params.input_date,
            "contents": target_feed.content,
            "category_code": category_code.id,
            "is_public": "Y"
        }, is_commit=False)

        # ID를 가져오기 위해 flush로 먼저 DB에 반영
        db.flush()

        if not new_calcendar:
            raise Exception("식단 복사에 실패했습니다.")


        # 이미지 복사 - 기존 이미지의 파일을 물리적으로 복사하여 새로운 식단에 연결
        feeds_image = db.query(FeedsImages).filter(
            FeedsImages.img_model == "Feeds",
            FeedsImages.img_model_id == target_feed.id
        ).order_by(FeedsImages.sort_order.asc()).first()

        is_result = copy_image(
            db,
            origin_model="Feeds",
            origin_model_instance=feeds_image,
            target_model="Meals",
            target_model_instance=new_calcendar
        )

        if is_result == False:
            raise Exception("피드 이미지 복사에 실패했습니다.")

        db.commit()
        return CommonResponse(success=True, message="피드가 성공적으로 복사되었습니다.", data=None)
    except Exception as e:
        return CommonResponse(success=False, error=f"피드 복사 중 오류가 발생했습니다: {str(e)}", data=None)

def validate_feed_params(db, type, cursor, user_hash, view_type, nickname, start_date, end_date, target_user_hash):
    params = {
        "is_deleted": "N"
    }

    # 다음 cursor 정보
    if cursor is not None:
        params["cursor"] = cursor

    if nickname is not None:
        params["nickname"] = nickname

    if start_date is not None and end_date is not None:
        params["start_date"] = start_date
        params["end_date"] = end_date

    # target_user_hash가 있으면 해당 사용자의 피드만 조회
    if target_user_hash is not None:
        target_user = Users.find_by_view_hash(db, target_user_hash)
        if not target_user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)
        params["target_user_id"] = target_user.id

    if user_hash is not None:
        user = Users.find_by_view_hash(db, user_hash)

        if not user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

        params["my_user_id"] = user.id  # is_liked 조회를 위해 항상 설정
        params['type'] = type
        params['view_type'] = view_type

        if type == "list":
            # 차단된 사용자 목록 조회
            deny_users = DeniesUsers.findByUserIds(db, user.id)
            deny_users_ids = [du.deny_user_id for du in deny_users]

            params["deny_user_ids"] = deny_users_ids
        else:
            params["user_id"] = user.id

    return params

""" 피드 목록 조회 """
def list_feeds(db, type:str, limit: int, offset: int, cursor: int = None, user_hash: str = None, view_type: str = "all", title: str = None, nickname: str = None, sort_by: str = "created_at", start_date: str = None, end_date: str = None, target_user_hash: str = None):

    params = validate_feed_params(db, type, cursor, user_hash, view_type, nickname, start_date, end_date, target_user_hash)

    feeds_list = Feeds.get_list(db, params=params, extra={"limit": limit, "offset": offset, "order_by": sort_by}).getData()

    return CommonResponse(success=True, message="", data=feeds_list)

"""
feed 삭제
"""
def delete_feed(db, feed_id, user_hash):
    try:
        # -------------------------
        # 1. 사용자 & 대상 조회
        # -------------------------
        user = Users.find_by_view_hash(db, user_hash)
        if not user:
            return CommonResponse(success=False, error="유효하지 않은 회원정보입니다.", data=None)

        feed = Feeds.findById(db, feed_id)
        if not feed:
            return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

        if feed.user_id != user.id:
            return CommonResponse(success=False, error="피드 삭제 권한이 없습니다.", data=None)
        # -------------------------
        # 2. 이미지 삭제 및 피드 삭제
        # -------------------------
        result = FeedsImages.deleteByFeedId(db, "Feeds", feed.id, is_commit=False)

        if not result["success"]:
            raise Exception(result["error"] or "피드 이미지 삭제에 실패했습니다.")

        is_success = Feeds.delete_by_feed(db, feed.id, is_commit=False)
        if not is_success or is_success == False:
            raise Exception("피드 삭제에 실패했습니다.")

        db.commit()

        return CommonResponse(success=True, message="피드가 성공적으로 삭제되었습니다.", data=None)
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"사용자 조회 중 오류가 발생했습니다: {str(e)}", data=None)

"""
feed 태그 검색
"""
def search_feed_tags(db, query_text: str):
    try:
        tags = db.query(FeedsTags).filter(FeedsTags.name.like(f"%{query_text}%")).all()
        tag_list = [tag.name for tag in tags]

        return CommonResponse(success=True, message="", data=tag_list)
    except Exception as e:
        return CommonResponse(success=False, error=f"피드 태그 검색 중 오류가 발생했습니다: {str(e)}", data=None)

# 피드 수정
async def update_feed(db, feed_id: int, content: str, is_public: str, tags: str, is_share_meal_plan: str, category_id: int, meal_condition: str, files):

    feed = Feeds.findById(db, feed_id)

    if not feed:
        return CommonResponse(success=False, error="삭제되었거나, 존재하지 않는 피드입니다.", data=None)

    if category_id:
        category_code = CategoriesCodes.findById(db, category_id)
        if not category_code:
            return CommonResponse(success=False, error="존재하지 않는 카테고리 코드입니다.", data=None)

        if category_code.type != "MEALS_GROUP":
            return CommonResponse(success=False, error="유효하지 않은 카테고리 코드입니다.", data=None)

    try:
        """ feed 정보 업데이트 """
        update_params = {
            "content": content,
            "is_public": is_public,
            "is_share_meal_plan": is_share_meal_plan,
            "meal_condition": meal_condition,
            "category_id": category_code.id if category_id else 0
        }

        updated_feed = Feeds.update(db, feed.id, update_params, is_commit=False)

        if not updated_feed:
            raise Exception("피드 수정에 실패했습니다.")

        """ tags 업데이트 처리 """
        if tags is not None:
            # 기존 매핑 삭제
            FeedsTagsMapper.deleteByFeedId(db, "Feed", feed.id, is_commit=False)

            # 새로운 태그 매핑 추가
            tag_list = [tag.strip() for tag in tags.split('#') if tag.strip()]

            for tag in tag_list:
                feed_tag = FeedsTags.get_or_create_tag(db, tag, is_commit=False)
                create_tag_mapper(db, "Feed", feed.id, feed_tag.id)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"피드 수정 중 오류가 발생했습니다: {str(e)}", data=None)

    # 이미지 업데이트 처리
    try:
        if files and len(files) > 0:
            # 기존 이미지 삭제
            FeedsImages.deleteByFeedId(db, "Feeds", feed.id)

            # 새로운 이미지 업로드
            for idx, file in enumerate(files):
                if file and file.filename:
                    ext = file.filename.split('.')[-1]
                    await FeedsImages.upload(db, feed.id, file, ext, path="feeds", sort_order=idx)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"피드 이미지 수정 중 오류가 발생했습니다: {str(e)}", data=None)

    # 모든 처리 성공 시 커밋
    db.commit()

    return CommonResponse(success=True, message="피드가 성공적으로 수정되었습니다.", data=None)

""" 피드 댓글 조회 """
def list_feed_comments(db, user_hash, feed_id, limit, offset):

    user = Users.find_by_view_hash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    feed = Feeds.findById(db, feed_id)
    if not feed:
        return CommonResponse(success=False, error="삭제되었거나, 존재하지 않는 피드입니다.", data=None)

    params = {
        "feed_id": feed_id,
        "user_id": user.id,
        "is_deleted": "N"
    }

    result_data = FeedsComments.get_list(db, params, extra={"limit": limit, "offset": offset}).getData()

    if not result_data:
        return CommonResponse(success=True, message="댓글이 없습니다.", data=[])

    comment_tree = build_comment_tree(result_data)

    return CommonResponse(success=True, message="", data=comment_tree)

""" 피드 댓글 생성 """
def create_feed_comment(db, user_hash: str, feed_id: int, comment: str, parent_hash: str = None):

    user = Users.find_by_view_hash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    feed = Feeds.findById(db, feed_id)
    if not feed:
        return CommonResponse(success=False, error="삭제되었거나, 존재하지 않는 피드입니다.", data=None)

    params = {
        "feed_id": feed.id,
        "user_id": user.id,
        "comment": comment,
    }

    parent_id = 0
    if parent_hash:
        parent_comment = FeedsComments.find_by_view_hash(db, parent_hash)
        if not parent_comment:
            return CommonResponse(success=False, error="존재하지 않는 부모 댓글입니다.", data=None)
        parent_id = parent_comment.id

    params["parent_id"] = parent_id
    params["parent_hash"] = parent_hash if parent_id > 0 else ""

    try:
        new_comment = FeedsComments.create(db, params)
        if not new_comment:
            raise Exception("댓글 생성에 실패했습니다.")

        return CommonResponse(success=True, message="댓글이 성공적으로 생성되었습니다.", data=None)

    except Exception as e:
        return CommonResponse(success=False, error=f"댓글 생성 중 오류가 발생했습니다: {str(e)}", data=None)

def delete_feed_comment(db, comment_hash: str, user_hash: str):
    try:
        user = validate_user(db, user_hash)
        if not user:
            raise Exception("존재하지 않는 사용자입니다.")

        comment = FeedsComments.find_by_view_hash(db, comment_hash)
        if not comment:
            return CommonResponse(success=False, error="존재하지 않는 댓글입니다.", data=None)

        if comment.user_id != user.id:
            return CommonResponse(success=False, error="댓글 삭제 권한이 없습니다.", data=None)

        if not FeedsComments.delete_by_id(db, comment.id, is_commit=False):
            raise Exception("댓글 삭제에 실패했습니다.")

        return CommonResponse(
            success=True,
            message="댓글이 성공적으로 삭제되었습니다.",
            data=None
        )

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"댓글 삭제 중 오류가 발생했습니다: {str(e)}", data=None)

""" 내가 좋아요한 피드 목록 조회 """
def list_feed_likes(db, user_hash: str, limit: int, offset: int):
    try:
        user = validate_user(db, user_hash)
        if not user:
            raise Exception("존재하지 않는 사용자입니다.")

        feed_like_list = []
        feed_like_result = FeedsLikes.get_like_user_id(db, user.id, limit, offset)

        for item in feed_like_result:
            data = {
                "feed_id": item.feed_id,
                "title": item.title,
                "content": item.content,
                "feed_image_url": item.feed_image_url,
                "liked_at": item.liked_at
            }
            feed_like_list.append(data)

        return CommonResponse(success=True, message="", data=feed_like_list)
    except Exception as e:
        return CommonResponse(success=False, error=f"사용자 조회 중 오류가 발생했습니다: {str(e)}", data=None)
