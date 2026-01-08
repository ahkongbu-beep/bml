from sqlalchemy import Column, BigInteger, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.feeds_tags import FeedsTags

class FeedsTagsMapper(Base):
    __tablename__ = "feeds_tags_mappers"

    feed_id = Column(BigInteger, ForeignKey("feeds.id"), primary_key=True)
    tag_id = Column(BigInteger, ForeignKey("feeds_tags.id"), primary_key=True)
    model = Column(String(50), nullable=False, comment="모델명")

    tag = relationship(
        "FeedsTags",
        back_populates="mappers"
    )

    feed = relationship(
        "Feeds",
        back_populates="tags"
    )

    """
    feed_id 로 태그 목록 조회
    """
    @staticmethod
    def findTagsByFeedAndTag(session, model: str, feed_id: int):

        result = (
            session.query(FeedsTags.name).join(
                FeedsTagsMapper, FeedsTagsMapper.tag_id == FeedsTags.id
            ).filter(
                FeedsTagsMapper.model == model,
                FeedsTagsMapper.feed_id == feed_id
            ).all()
        )

        return [tag.name for tag in result]

    @staticmethod
    def create(session, params: dict, is_commit: bool = True):
        mapper = FeedsTagsMapper(
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
    def deleteByFeedId(session, model:str, feed_id: int):
        """
        feed_id 로 매핑 삭제
        """
        session.query(FeedsTagsMapper).filter(
            FeedsTagsMapper.model == model,
            FeedsTagsMapper.feed_id == feed_id
        ).delete()
        session.commit()