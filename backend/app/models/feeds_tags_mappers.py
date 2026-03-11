from sqlalchemy import Column, BigInteger, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.feeds_tags import FeedsTags

class FeedsTagsMappers(Base):
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
