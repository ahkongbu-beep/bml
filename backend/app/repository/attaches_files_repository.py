from app.models.attaches_files import AttachesFiles

class AttachesFilesRepository:
    @staticmethod
    def get_attache_files_by_model_id(db, model: str, model_id: int):
        return db.query(AttachesFiles).filter(
            AttachesFiles.img_model == model,
            AttachesFiles.img_model_id == model_id,
            AttachesFiles.is_active == "Y"
        ).all()

    def delete_attache_files_by_model_id(db, model: str, model_id: int):
        db.query(AttachesFiles).filter(
            AttachesFiles.img_model == model,
            AttachesFiles.img_model_id == model_id
        ).delete()
        db.flush()

    @staticmethod
    def create(db, model: str, model_id: int, image_url: str, width: int, height: int, sort_order: int = 0):
        new_file = AttachesFiles(
            img_model=model,
            img_model_id=model_id,
            image_url=image_url,
            width=width,
            height=height,
            sort_order=sort_order,
            is_active="Y"
        )
        db.add(new_file)
        db.flush()
        db.refresh(new_file)
        return new_file