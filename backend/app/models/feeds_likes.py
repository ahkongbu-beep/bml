from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, UniqueConstraint
from app.core.database import Base

class FeedsLikes(Base):
    __tablename__ = "feeds_likes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    feed_id = Column(Integer, ForeignKey("feeds.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('feed_id', 'user_id', name='unique_feed_user'),
    )
