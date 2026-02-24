from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import declarative_base
from app.core.database import Base
from app.models.users import Users
from app.models.feeds import Feeds
from app.models.feeds_images import FeedsImages

class CommunitiesLikes(Base):
    __tablename__ = "communities_likes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('community_id', 'user_id', name='unique_community_user'),
    )

    @staticmethod
    def create(session, community_id: int, user_id: int):
        like = CommunitiesLikes(
            community_id=community_id,
            user_id=user_id,
            created_at=func.now()
        )
        session.add(like)
        session.commit()
        session.refresh(like)
        return like

    @staticmethod
    def get_like_user_id(session, user_id: int, limit=30, offset=0):
        feed_image_subq = (
            session.query(FeedsImages.image_url)
            .filter(FeedsImages.img_model == "Feeds")
            .filter(FeedsImages.img_model_id == Feeds.id)
            .order_by(FeedsImages.id.asc())
            .limit(1)
            .correlate(Feeds)
            .scalar_subquery()
        )

        query = (
            session.query(
                CommunitiesLikes.community_id,
                CommunitiesLikes.created_at.label("liked_at"),
                Feeds.title,
                Feeds.content,
                feed_image_subq.label("feed_image_url"),
            )
            .join(Feeds, CommunitiesLikes.community_id == Feeds.id)
            .filter(CommunitiesLikes.user_id == user_id)
            .order_by(CommunitiesLikes.created_at.desc())
        )

        return query.all()