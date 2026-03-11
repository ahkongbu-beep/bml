
from app.repository.feeds_tags_repository import FeedsTagsRepository
from app.repository.feeds_tags_mappers_repository import FeedsTagsMappersRepository

def process_tags(db, ingredients):
    tag_ids = []
    for tag_name in ingredients:
        tag = FeedsTagsRepository.get_or_create_tag(db, tag_name, is_commit=False)
        db.flush()
        tag_ids.append(tag.id)
    return tag_ids

def create_tag_mapper(db, model, model_id, tag_ids):

    for tag_id in tag_ids:
        FeedsTagsMappersRepository.create(db, {
            "model": model,
            "feed_id": model_id,
            "tag_id": tag_id
        }, is_commit=False)

        db.flush()
