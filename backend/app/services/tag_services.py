from app.repository.feeds_tags_mappers_repository import FeedsTagsMappersRepository

def create_tag_mapper(db, model, model_id, tag_ids):
    for tag_id in tag_ids:
        FeedsTagsMappersRepository.create(db, {
            "model": model,
            "feed_id": model_id,
            "tag_id": tag_id
        }, is_commit=False)

        db.flush()
