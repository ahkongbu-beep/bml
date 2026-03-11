
from app.models.feeds_tags import FeedsTags
from app.models.feeds_tags_mappers import FeedsTagsMappers

class FeedsTagsMappersRepository:

    """
    feed_id 로 태그 목록 조회
    """
    @staticmethod
    def get_tags_mapper_by_model_and_model_id(session, model: str, feed_id: int):

        result = (
            session.query(FeedsTags.name).join(
                FeedsTagsMappers, FeedsTagsMappers.tag_id == FeedsTags.id
            ).filter(
                FeedsTagsMappers.model == model,
                FeedsTagsMappers.feed_id == feed_id
            ).order_by(FeedsTagsMappers.feed_id.asc()).all()
        )

        return [tag.name for tag in result]

    @staticmethod
    def create(session, params: dict, is_commit: bool = True):
        mapper = FeedsTagsMappers(
            feed_id=params.get("feed_id"),
            tag_id=params.get("tag_id"),
            model=params.get("model")
        )

        session.add(mapper)
        if is_commit:
            session.commit()
            session.refresh(mapper)
        return mapper

    @staticmethod
    def deleteByFeedId(session, model:str, feed_id: int, is_commit: bool = True):
        """
        feed_id 로 매핑 삭제
        """
        try:
            session.query(FeedsTagsMappers).filter(
                FeedsTagsMappers.model == model,
                FeedsTagsMappers.feed_id == feed_id
            ).delete()
        except Exception as e:
            session.rollback()
            return False

        if is_commit:
            session.commit()
        else:
            session.flush()
        return True