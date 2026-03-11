from app.models.feeds_likes import FeedsLikes
from app.models.feeds_images import FeedsImages
from app.models.feeds import Feeds
from sqlalchemy import func

class FeedsLikesRepository:

    @staticmethod
    def create(session, feed_id: int, user_id: int, is_commit=True):
        like = FeedsLikes(
            feed_id=feed_id,
            user_id=user_id,
            created_at=func.now()
        )
        session.add(like)
        if is_commit:
            session.commit()
        else:
            session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음
        return like

    @staticmethod
    def increment_like_count(session, feed_id: int, is_commit=True):
        session.query(Feeds).filter(Feeds.id == feed_id).update(
            {Feeds.like_count: Feeds.like_count + 1}
        )
        if is_commit:
            session.commit()
        else:
            session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음

    @staticmethod
    def get_like_by_feed_and_user(session, feed_id: int, user_id: int):
        return session.query(FeedsLikes).filter(
            FeedsLikes.feed_id == feed_id,
            FeedsLikes.user_id == user_id
        ).first()

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
                FeedsLikes.feed_id,
                FeedsLikes.created_at.label("liked_at"),
                Feeds.title,
                Feeds.content,
                feed_image_subq.label("feed_image_url"),
            )
            .join(Feeds, FeedsLikes.feed_id == Feeds.id)
            .filter(FeedsLikes.user_id == user_id)
            .order_by(FeedsLikes.created_at.desc())
        )

        return query.all()