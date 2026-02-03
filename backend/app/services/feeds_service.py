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
import os
from datetime import datetime


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
        print(f"⚠️ 좋아요 처리 중 오류: {str(e)}")
        return CommonResponse(success=False, error=f"좋아요 처리 중 오류가 발생했습니다: {str(e)}", data=None)

    data = FeedLikeResponseData(
        feed_id=feed_id,
        like_count=like_count,
        is_liked=is_liked
    )

    return CommonResponse(success=True, message="좋아요 상태가 성공적으로 변경되었습니다.", data=data)

# 피드 상세보기
def get_feed_detail(db, feed_id: int, user_hash: str):

    user = Users.findByViewHash(db, user_hash) if user_hash else None
    if not user:
        return CommonResponse(success=False, error="인증되지않은 사용자입니다.", data=None)

    feed = Feeds.findById(db, feed_id)
    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    if feed.user_id != user.id:
        return CommonResponse(success=False, error="잘못된 접근입니다.")

    """ 조회수 1 증가 """
    feed.view_count += 1
    db.commit()

    """ 태그 목록 조회 """
    tags = FeedsTagsMapper.findTagsByFeedAndTag(db, "Feed", feed.id)

    """ 이미지 목록 조회 """
    image_list = FeedsImages.findImagesByModelId(db, "Feeds", feed_id)

    comment_list = FeedsComments.getList(db, {"feed_id": feed.id}, extra={}).getData()
    build_comment_tree = FeedsComments.build_comment_tree(comment_list)

    comment = []
    for item in build_comment_tree:
        comment.append(item)

    feed_data = FeedsResponse(
        id=feed.id,
        user_id=feed.user_id,
        title=feed.title,
        content=feed.content,
        is_published=feed.is_public,
        is_share_meal_plan=feed.is_share_meal_plan,
        view_count=feed.view_count,
        like_count=feed.like_count,
        created_at=feed.created_at,
        updated_at=feed.updated_at,
        category_id=feed.category_id,
        tags=tags,
        images=image_list,
        user_hash=user_hash,
        user=FeedsUserResponse(
            id=user.id,
            nickname=user.nickname,
            profile_image=user.profile_image,
            user_hash=user.view_hash
        ),
        comments=comment
    )

    return CommonResponse(success=True, message="", data=feed_data)

def copy_feed(db, user_hash: str, params):

    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    target_feed = Feeds.findById(db, params.target_feed_id)
    if not target_feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    category_code = CategoriesCodes.findById(db, params.category_code)
    if not category_code:
        return CommonResponse(success=False, error="존재하지 않는 카테고리 코드입니다.", data=None)

    exist_calendar = MealsCalendars.findByUserIdAndDate(db, user.id, params.input_date)
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
            "category_code": category_code.id
        })

        if not new_calcendar:
            raise Exception("식단 복사에 실패했습니다.")

        """
        이미지 복사
        - 기존 이미지의 파일을 물리적으로 복사하여 새로운 식단에 연결
        """
        import shutil
        from app.libs.hash_utils import generate_sha256_hash

        target_image = db.query(FeedsImages).filter(
            FeedsImages.img_model == "Feeds",
            FeedsImages.img_model_id == target_feed.id,
            FeedsImages.sort_order == 0
        ).first()

        # 타인의 이미지를 복사 (첫 번째 이미지만)
        if target_image:
            try:
                # 원본 파일 경로 (DB에 확장자 없이 저장되어 있음)
                import glob
                original_file_base = target_image.image_url.lstrip('/')

                # 모든 리사이징 사이즈 파일 찾기 (_original, _large, _medium, _small, _thumbnail)
                matching_files = glob.glob(f"{original_file_base}_*.webp")

                if not matching_files:
                    print(f"⚠️ 원본 이미지 파일이 존재하지 않습니다: {original_file_base}_*.webp")
                else:
                    # 새로운 파일명 해시 생성
                    filename_hash = generate_sha256_hash(str(new_calcendar.id), str(datetime.utcnow().timestamp()))

                    # 새로운 파일 경로 생성
                    destination_path = os.path.join(
                        "attaches",
                        "Meals",
                        str(new_calcendar.id)[-2:] if len(str(new_calcendar.id)) >= 2 else "0" + str(new_calcendar.id),
                        str(new_calcendar.id)
                    )
                    os.makedirs(destination_path, exist_ok=True)

                    # 모든 사이즈 파일 복사
                    for original_file_path in matching_files:
                        # 사이즈 추출 (예: _medium, _large)
                        size_suffix = original_file_path.split('_')[-1].replace('.webp', '')

                        # 새 파일명 생성
                        new_filename = f"{filename_hash}_copy_{new_calcendar.id}_{size_suffix}.webp"
                        new_file_path = os.path.join(destination_path, new_filename)

                        # 파일 복사
                        shutil.copy2(original_file_path, new_file_path)

                    # URL 경로 생성 (확장자와 사이즈 접미사 제거)
                    file_url = f"/attaches/Meals/{str(new_calcendar.id)[-2:] if len(str(new_calcendar.id)) >= 2 else '0' + str(new_calcendar.id)}/{str(new_calcendar.id)}/{filename_hash}_copy_{new_calcendar.id}"

                    # DB에 이미지 정보 저장
                    image_params = {
                        "img_model": "Meals",
                        "img_model_id": new_calcendar.id,
                        "image_url": file_url,
                        "sort_order": 0,
                        "width": target_image.width,
                        "height": target_image.height,
                        "is_active": "Y"
                    }

                    FeedsImages.create(db, image_params)
                    print(f"✅ 이미지 복사 완료: {len(matching_files)}개 사이즈")

            except Exception as e:
                print(f"⚠️ 이미지 복사 중 오류: {str(e)}")

        return CommonResponse(success=True, message="피드가 성공적으로 복사되었습니다.", data=None)
    except Exception as e:
        return CommonResponse(success=False, error=f"피드 복사 중 오류가 발생했습니다: {str(e)}", data=None)


# 피드 목록 조회
def list_feeds(db, type:str, limit: int, offset: int, user_hash: str = None, title: str = None, nickname: str = None, sort_by: str = "created_at", start_date: str = None, end_date: str = None, target_user_hash: str = None):

    params = {}
    if title is not None:
        params["title"] = title

    if nickname is not None:
        params["nickname"] = nickname

    if start_date is not None and end_date is not None:
        params["start_date"] = start_date
        params["end_date"] = end_date

    # target_user_hash가 있으면 해당 사용자의 피드만 조회
    if target_user_hash is not None:
        target_user = Users.findByViewHash(db, target_user_hash)
        if not target_user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)
        params["target_user_id"] = target_user.id

    if user_hash is not None:
        user = Users.findByViewHash(db, user_hash)

        if not user:
            return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

        params["my_user_id"] = user.id  # is_liked 조회를 위해 항상 설정
        params['type'] = type

        if type == "list":
            deny_users = DeniesUsers.findByUserIds(db, user.id)
            deny_users_ids = [du.deny_user_id for du in deny_users]

            params["deny_user_ids"] = deny_users_ids
        else:
            params["user_id"] = user.id

    feeds_list = Feeds.getList(db, params=params, extra={"limit": limit, "offset": offset, "order_by": sort_by}).getData()

    return CommonResponse(success=True, message="", data=feeds_list)

"""
feed 삭제
"""
def delete_feed(db, feed_id, user_hash):
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    feed = Feeds.findById(db, feed_id)
    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    if feed.user_id != user.id:
        return CommonResponse(success=False, error="피드 삭제 권한이 없습니다.", data=None)

    # 피드 삭제 및 첨부된 이미지까지 제거
    try:
        result = FeedsImages.deleteByFeedId(db, "Feeds", feed.id)

        if not result["success"]:
            raise Exception(result["error"] or "피드 이미지 삭제에 실패했습니다.")

        return CommonResponse(success=True, message="피드가 성공적으로 삭제되었습니다.", data=None)
    except Exception as e:
        return CommonResponse(success=False, error=f"피드 삭제 중 오류가 발생했습니다: {str(e)}", data=None)

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
async def create_feed(db, user_hash: str, title: str, content: str, is_public: str, tags: str, is_share_meal_plan: str, category_id: int, files):
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

        if category_id:
            category_code = CategoriesCodes.findById(db, category_id)
            if not category_code:
                return CommonResponse(success=False, error="존재하지 않는 카테고리 코드입니다.", data=None)

            if category_code.type != "MEALS_GROUP":
                return CommonResponse(success=False, error="유효하지 않은 카테고리 코드입니다.", data=None)

        """ feeds 생성 """
        params = {
            "user_id": user.id,
            "title": title,
            "content": content,
            "is_public": is_public,
            "category_id": category_code.id if category_id else 0,
        }

        new_feed = Feeds.create(db, params)

        if not new_feed:
            raise Exception("피드 생성에 실패했습니다.")

        if feed_tag_ids:
            """ FeedsTagsMapper 에 feed_id, tag_id 등록 """
            for tag_id in feed_tag_ids:
                mapper_params = {
                    "feed_id": new_feed.id,
                    "tag_id": tag_id,
                    "model": "Feed"
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
                    await FeedsImages.upload(db, new_feed.id, file, ext, path="Feeds", sort_order=idx)

    except Exception as e:
        print(f"⚠️ 이미지 업로드 에러: {str(e)}")

    # 업로드된 이미지 목록 조회
    image_list = FeedsImages.findImagesByModelId(db, "Feeds", new_feed.id)

    # 태그 목록 조회
    tag_list = FeedsTagsMapper.findTagsByFeedAndTag(db, "Feed", new_feed.id)

    # 피드 내용을 식단 리스트에 공유
    if is_share_meal_plan == 'Y':
        # 현재 날짜 Y-M-D
        from datetime import datetime
        from app.services.meals_service import create_meal
        import shutil
        from app.libs.hash_utils import generate_sha256_hash

        input_date = datetime.now().strftime("%Y-%m-%d")

        meal_response = await create_meal(db, {
            "tags": tags,
            "title": title,
            "contents": content,
            "category_id": category_id,
            "input_date": input_date,
            "user_hash": user_hash
        })

        if not meal_response.success:
            print(f"⚠️ 피드 식단 공유 실패: {meal_response.error}")
        else:
            # 식단 생성 성공 시 이미지 복사
            try:
                # 생성된 식단의 ID를 가져오기 위해 DB에서 조회
                from app.models.meals_calendar import MealsCalendars
                meal_calendar = MealsCalendars.findByUserIdAndDate(db, user.id, input_date)

                if meal_calendar:
                    # 가장 최근에 생성된 식단 (방금 생성한 식단)
                    latest_meal = meal_calendar[-1] if isinstance(meal_calendar, list) else meal_calendar

                    # 피드의 첫 번째 이미지 조회
                    feed_image = db.query(FeedsImages).filter(
                        FeedsImages.img_model == "Feeds",
                        FeedsImages.img_model_id == new_feed.id,
                        FeedsImages.sort_order == 0
                    ).first()

                    if feed_image:
                        # 원본 파일 경로 (DB에 확장자 없이 저장되어 있음)
                        import glob
                        original_file_base = feed_image.image_url.lstrip('/')

                        # 모든 리사이징 사이즈 파일 찾기 (_original, _large, _medium, _small, _thumbnail)
                        matching_files = glob.glob(f"{original_file_base}_*.webp")

                        if matching_files:
                            # 새로운 파일명 해시 생성
                            filename_hash = generate_sha256_hash(str(latest_meal.id), str(datetime.utcnow().timestamp()))

                            # 새로운 파일 경로 생성
                            destination_path = os.path.join(
                                "attaches",
                                "Meals",
                                str(latest_meal.id)[-2:] if len(str(latest_meal.id)) >= 2 else "0" + str(latest_meal.id),
                                str(latest_meal.id)
                            )
                            os.makedirs(destination_path, exist_ok=True)

                            # 모든 사이즈 파일 복사
                            for original_file_path in matching_files:
                                # 사이즈 추출 (예: _medium, _large)
                                size_suffix = original_file_path.split('_')[-1].replace('.webp', '')

                                # 새 파일명 생성
                                new_filename = f"{filename_hash}_shared_{size_suffix}.webp"
                                new_file_path = os.path.join(destination_path, new_filename)

                                # 파일 복사
                                shutil.copy2(original_file_path, new_file_path)

                            # URL 경로 생성 (확장자와 사이즈 접미사 제거)
                            file_url = f"/attaches/Meals/{str(latest_meal.id)[-2:] if len(str(latest_meal.id)) >= 2 else '0' + str(latest_meal.id)}/{str(latest_meal.id)}/{filename_hash}_shared"

                            # DB에 이미지 정보 저장
                            image_params = {
                                "img_model": "Meals",
                                "img_model_id": latest_meal.id,
                                "image_url": file_url,
                                "sort_order": 0,
                                "width": feed_image.width,
                                "height": feed_image.height,
                                "is_active": "Y"
                            }

                            FeedsImages.create(db, image_params)
                            print(f"✅ 이미지 복사 완료: {len(matching_files)}개 사이즈")
                        else:
                            print(f"⚠️ 원본 이미지 파일이 존재하지 않습니다: {original_file_base}_*.webp")
            except Exception as e:
                print(f"⚠️ 피드 이미지 식단 복사 중 오류: {str(e)}")

    # SQLAlchemy 객체를 Pydantic 스키마로 변환
    feed_response = FeedsResponse(
        id=new_feed.id,
        user_id=new_feed.user_id,
        title=new_feed.title,
        content=new_feed.content,
        is_published=new_feed.is_public,
        category_id=new_feed.category_id,
        view_count=new_feed.view_count,
        like_count=new_feed.like_count,
        created_at=new_feed.created_at,
        updated_at=new_feed.updated_at,
        tags=tag_list,
        images=image_list,
        user=FeedsUserResponse(
            id=user.id,
            nickname=user.nickname,
            profile_image=user.profile_image,
            user_hash=user.view_hash
        )
    )

    return CommonResponse(success=True, message="피드가 성공적으로 생성되었습니다.", data=feed_response)

# 피드 수정
async def update_feed(db, feed_id: int, title: str, content: str, is_public: str, tags: str, is_share_meal_plan: str, category_id: int, files):

    feed = Feeds.findById(db, feed_id)

    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    if category_id:
        category_code = CategoriesCodes.findById(db, category_id)
        if not category_code:
            return CommonResponse(success=False, error="존재하지 않는 카테고리 코드입니다.", data=None)

        if category_code.type != "MEALS_GROUP":
            return CommonResponse(success=False, error="유효하지 않은 카테고리 코드입니다.", data=None)

    try:
        """ feed 정보 업데이트 """
        update_params = {
            "title": title,
            "content": content,
            "is_public": is_public,
            "is_share_meal_plan": is_share_meal_plan,
            "category_id": category_code.id if category_id else 0
        }

        print("update_params", update_params)

        updated_feed = Feeds.update(db, feed.id, update_params)

        if not updated_feed:
            raise Exception("피드 수정에 실패했습니다.")

        """ tags 업데이트 처리 """
        if tags is not None:
            # 기존 매핑 삭제
            FeedsTagsMapper.deleteByFeedId(db, "Feed", feed.id)

            # 새로운 태그 매핑 추가
            tag_list = [tag.strip() for tag in tags.split('#') if tag.strip()]

            for tag in tag_list:
                feed_tag = FeedsTags.findOrCreateTag(db, tag)

                feed_tag_mapper = FeedsTagsMapper.create(db, {
                    "feed_id": feed.id,
                    "tag_id": feed_tag.id
                })

                if not feed_tag_mapper:
                    raise Exception("피드 태그 매핑 생성에 실패했습니다.")


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

    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    feed = Feeds.findById(db, feed_id)
    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    params = {
        "feed_id": feed_id,
        "user_id": user.id
    }

    result_data = FeedsComments.getList(db, params, extra={"limit": limit, "offset": offset}).getData()

    if not result_data:
        return CommonResponse(success=True, message="댓글이 없습니다.", data=[])

    tree_data = FeedsComments.build_comment_tree(result_data)

    return CommonResponse(success=True, message="", data=tree_data)

""" 피드 댓글 생성 """
def create_feed_comment(db, user_hash: str, feed_id: int, comment: str, parent_hash: str = None):

    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    feed = Feeds.findById(db, feed_id)
    if not feed:
        return CommonResponse(success=False, error="존재하지 않는 피드입니다.", data=None)

    params = {
        "feed_id": feed.id,
        "user_id": user.id,
        "comment": comment,
    }

    parent_id = 0
    if parent_hash:
        parent_comment = FeedsComments.findByViewHash(db, parent_hash)
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
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    comment = FeedsComments.findByViewHash(db, comment_hash)
    if not comment:
        return CommonResponse(success=False, error="존재하지 않는 댓글입니다.", data=None)

    if comment.user_id != user.id:
        return CommonResponse(success=False, error="댓글 삭제 권한이 없습니다.", data=None)

    try:

        if not FeedsComments.deleteById(db, comment.id):
            raise Exception("댓글 삭제에 실패했습니다.")

        return CommonResponse(
            success=True,
            message="댓글이 성공적으로 삭제되었습니다.",
            data=None
        )
    except Exception as e:
        return CommonResponse(
            success=False,
            error=f"댓글 삭제 중 오류가 발생했습니다: {str(e)}",
            data=None
        )

def list_feed_likes(db, user_hash: str, limit: int, offset: int):
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="존재하지 않는 사용자입니다.", data=None)

    feed_like_list = []
    feed_like_result = FeedsLikes.findByLikeUserId(db, user.id, limit, offset)

    for item in feed_like_result:
        data = {
            "feed_id": item.feed_id,
            "title": item.title,
            "content": item.content,
            "feed_image_url": item.feed_image_url,
            "liked_at": item.liked_at
        }
        feed_like_list.append(data)

    return CommonResponse(
        success=True,
        message="",
        data=feed_like_list
    )