from app.models.feeds import Feeds
from app.models.feeds_tags import FeedsTags
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.models.users import Users
from app.schemas.common_schemas import CommonResponse
from app.schemas.feeds_schemas import FeedsResponse, FeedsUserResponse
from app.models.feeds_images import FeedsImages
from app.models.feeds_tags import FeedsTags
from app.models.feeds_tags_mappers import FeedsTagsMapper
from app.models.feeds_likes import FeedsLikes

def toggle_feed_like(db, feed_id: int, user_hash: str):

    target_user = Users.findByViewHash(db, user_hash)
    if not target_user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    feed = Feeds.findById(db, feed_id)
    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    existing_like = db.query(FeedsLikes).filter(
        FeedsLikes.feed_id == feed_id,
        FeedsLikes.user_id == target_user.id
    ).first()

    """ 좋아요가 이미 존재하면 취소(삭제), 없으면 추가 """
    try:
        if existing_like:
            db.delete(existing_like)
            feed.like_count = feed.like_count - 1 if feed.like_count > 0 else 0
        else:
            new_like = FeedsLikes.create(db, feed_id, target_user.id)
            feed.like_count += 1

            if not new_like:
                raise Exception("좋아요 생성에 실패했습니다.")

        db.commit()
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"좋아요 처리 중 오류가 발생했습니다: {str(e)}", data=None)

    return CommonResponse(success=True, message="좋아요 상태가 성공적으로 변경되었습니다.", data={
        "feed_id": feed_id,
        "like_count": feed.like_count,
        "liked": existing_like is None
    })


# 피드 상세보기
def get_feed_detail(db, feed_id: int):
    feed = Feeds.findById(db, feed_id)

    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    """ 조회수 1 증가 """
    feed.view_count += 1
    db.commit()

    """ User 정보 찾기 """
    user = Users.findById(db, feed.user_id)
    user_hash = user.view_hash if user else None

    """ 태그 목록 조회 """
    tags = FeedsTagsMapper.findTagsByFeedAndTag(db, feed.id)

    """ 이미지 목록 조회 """
    image_list = FeedsImages.findImagesByFeedId(db, feed_id)

    feed_data = FeedsResponse(
        id=feed.id,
        user_id=feed.user_id,
        title=feed.title,
        content=feed.content,
        is_published=feed.is_public,
        view_count=feed.view_count,
        like_count=feed.like_count,
        created_at=feed.created_at,
        updated_at=feed.updated_at,
        tags=tags,
        images=image_list,
        user_hash=user_hash,
        user=FeedsUserResponse(
            nickname=user.nickname,
            profile_image=user.profile_image
        )
    )

    return CommonResponse(success=True, message="", data=feed_data)

# 피드 목록 조회
def list_feeds(db, limit: int, offset: int, user_hash: str = None):

    params = {}
    if user_hash is not None:
        user = Users.findByViewHash(db, user_hash)

        if not user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

        params["user_id"] = user.id

    feeds_list = Feeds.getList(db, params=params, extra={"limit": limit, "offset": offset}).getData()
    return CommonResponse(success=True, message="", data=feeds_list)

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

"""
feed 생성
1. user_id 로 Users 테이블 조회
2. tags 가 있을 경우 feeds_tags 조회 / 없으면 등록 후 사용
3. Feeds 테이블에 feed 등록
4. FeedsTagsMapper 테이블에 feed_id, tag_id 등록
 - tags 는 #으로 구분되며 여러개가 있을 수 있음
 - ex) #tag1#tag2#tag3
"""
async def create_feed(db, user_hash: str, title: str, content: str, is_public: str, tags: str, files):
    print(f"⭕⭕⭕ 피드 생성 시작: {title}")
    print(f"⭕⭕⭕ 태그: {tags}")
    print(f"⭕⭕⭕ user_hash: {user_hash}...")
    print(f"⭕⭕⭕ 이미지 업로드 시작: {len(files)}개")

    user = Users.findByViewHash(db, user_hash)

    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    try:
        """ tags 가 있으면 feeds_tags 에서 조회 """
        feed_tag_ids = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split('#') if tag.strip()]

            for tag in tag_list:

                feed_tag = FeedsTags.findOrCreateTag(db, tag)
                feed_tag_ids.append(feed_tag.id)
                # FeedsTagsMapper 에 feed_id, tag_id 등록은 feed 생성 후 처리

        """ feeds 생성 """
        params = {
            "user_id": user.id,
            "title": title,
            "content": content,
            "is_public": is_public,
        }

        new_feed = Feeds.create(db, params)

        if not new_feed:
            raise Exception("피드 생성에 실패했습니다.")

        if feed_tag_ids:
            """ FeedsTagsMapper 에 feed_id, tag_id 등록 """
            for tag_id in feed_tag_ids:
                mapper_params = {
                    "feed_id": new_feed.id,
                    "tag_id": tag_id
                }

                feed_tag_mapper = FeedsTagsMapper.create(db, mapper_params)

                if not feed_tag_mapper:
                    raise Exception("피드 태그 매핑 생성에 실패했습니다.")

        db.commit()

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"피드 생성 중 오류가 발생했습니다: {str(e)}", data=None)

    # 이미지 업로드는 트랜잭션 외부에서 처리
    try:
        if files and len(files) > 0:
            for idx, file in enumerate(files):
                if file and file.filename:
                    ext = file.filename.split('.')[-1]
                    feed_image = await FeedsImages.upload(db, new_feed.id, file, ext, path="feeds", sort_order=idx)

                    if not feed_image:
                        print(f"⚠️ 피드 이미지 {idx + 1} 업로드 실패")
                    else:
                        print(f"✅ 피드 이미지 {idx + 1} 업로드 성공: {feed_image.image_url}")
    except Exception as e:
        print(f"⚠️ 이미지 업로드 에러: {str(e)}")

    # 업로드된 이미지 목록 조회
    image_list = FeedsImages.findImagesByFeedId(db, new_feed.id)

    # 태그 목록 조회
    tag_list = FeedsTagsMapper.findTagsByFeedAndTag(db, new_feed.id)

    # SQLAlchemy 객체를 Pydantic 스키마로 변환
    feed_response = FeedsResponse(
        id=new_feed.id,
        user_id=new_feed.user_id,
        title=new_feed.title,
        content=new_feed.content,
        is_published=new_feed.is_public,
        view_count=new_feed.view_count,
        like_count=new_feed.like_count,
        created_at=new_feed.created_at,
        updated_at=new_feed.updated_at,
        tags=tag_list,
        images=image_list,
        user=FeedsUserResponse(
            nickname=user.nickname,
            profile_image=user.profile_image
        )
    )

    return CommonResponse(success=True, message="피드가 성공적으로 생성되었습니다.", data=feed_response)

# 피드 수정
async def update_feed(db, feed_id: int, title: str, content: str, is_public: str, tags: str, files):

    feed = Feeds.findById(db, feed_id)

    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    try:
        """ feed 정보 업데이트 """
        update_params = {
            "title": title,
            "content": content,
            "is_public": is_public
        }

        updated_feed = Feeds.update(db, feed.id, update_params)

        if not updated_feed:
            raise Exception("피드 수정에 실패했습니다.")

        """ tags 업데이트 처리 """
        if tags is not None:
            # 기존 매핑 삭제
            FeedsTagsMapper.deleteByFeedId(db, feed.id)

            # 새로운 태그 매핑 추가
            tag_list = [tag.strip() for tag in tags.split('#') if tag.strip()]

            for tag in tag_list:
                feed_tag = FeedsTags.findOrCreateTag(db, tag)

                mapper_params = {
                    "feed_id": feed.id,
                    "tag_id": feed_tag.id
                }

                feed_tag_mapper = FeedsTagsMapper.create(db, mapper_params)

                if not feed_tag_mapper:
                    raise Exception("피드 태그 매핑 생성에 실패했습니다.")

        db.commit()

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"피드 수정 중 오류가 발생했습니다: {str(e)}", data=None)

    # 이미지 업데이트는 트랜잭션 외부에서 처리
    try:
        if files and len(files) > 0:
            # 기존 이미지 삭제
            FeedsImages.deleteByFeedId(db, feed.id)

            print(f"⭕⭕⭕ 이미지 업데이트 시작: {len(files)}개")
            # 새로운 이미지 업로드
            for idx, file in enumerate(files):
                if file and file.filename:
                    ext = file.filename.split('.')[-1]
                    feed_image = await FeedsImages.upload(db, feed.id, file, ext, path="feeds", sort_order=idx)
                    if not feed_image:
                        print(f"⚠️ 피드 이미지 {idx + 1} 업로드 실패")
                    else:
                        print(f"✅ 피드 이미지 {idx + 1} 업로드 성공: {feed_image.image_url}")
    except Exception as e:
        print(f"⚠️ 이미지 업로드 에러: {str(e)}")

    return CommonResponse(success=True, message="피드가 성공적으로 수정되었습니다.", data=None)