from app.models.feeds_tags import FeedsTags

class FeedsTagsRepository:
    @staticmethod
    def get_like_name_by_one_data(session, query_text: str):
        return session.query(FeedsTags).filter(FeedsTags.name.like(f"{query_text}%")).all()

    @staticmethod
    def create(db, params):
        new_feed_tag = FeedsTags.create(db, params)
        return new_feed_tag

    @staticmethod
    def delete_by_feed_id(db, feed_id):
        FeedsTags.delete_by_feed_id(db, feed_id)

    @staticmethod
    def find_tags_by_feed_id(db, feed_id):
        tags = FeedsTags.find_tags_by_feed_id(db, feed_id)
        return tags

    @staticmethod
    def get_or_create_tag(session, tag_name: str, is_commit=True):

        tag_name = tag_name.replace("#", "").strip()
        tag = session.query(FeedsTags).filter(FeedsTags.name == tag_name).first()

        if not tag:
            tag = FeedsTags(name=tag_name)
            session.add(tag)
            if is_commit:
                session.commit()
                session.refresh(tag)
            else:
                session.flush()  # flush로 ID 생성
        return tag