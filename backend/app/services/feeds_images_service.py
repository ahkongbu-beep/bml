# (db, meal_image, "Feeds", create_feed_response.id, is_commit=False)
import datetime
import os
import shutil
from app.libs.hash_utils import generate_sha256_hash
from datetime import datetime

# source_image: Meals 모델의 이미지 복사 서비스
def copy_image(db, origin_model: str, origin_model_instance, target_model: str, target_model_instance):
    from app.models.feeds_images import FeedsImages

    try:
        import glob
        original_file_base = origin_model_instance.image_url.lstrip('/')

        # 모든 리사이징 사이즈 파일 찾기 (_original, _large, _medium, _small, _thumbnail)
        matching_files = glob.glob(f"{original_file_base}_*.webp")

        if matching_files:
            # 새로운 파일명 해시 생성
            filename_hash = generate_sha256_hash(str(target_model_instance.id), str(datetime.utcnow().timestamp()))

            # 새로운 파일 경로 생성
            destination_path = os.path.join(
                "attaches",
                target_model,
                str(target_model_instance.id)[-2:] if len(str(target_model_instance.id)) >= 2 else "0" + str(target_model_instance.id),
                str(target_model_instance.id)
            )

            os.makedirs(destination_path, exist_ok=True)

            # 모든 사이즈 파일 복사
            for original_file_path in matching_files:
                # 사이즈 추출 (예: _medium, _large)
                size_suffix = original_file_path.split('_')[-1].replace('.webp', '')

                # 새 파일명 생성
                new_filename = f"{filename_hash}_shared_{size_suffix}.webp"
                new_file_path = os.path.join(destination_path, new_filename)

                # 파일 복사
                shutil.copy2(original_file_path, new_file_path)

            # URL 경로 생성 (확장자와 사이즈 접미사 제거)
            file_url = f"/attaches/{target_model}/{str(target_model_instance.id)[-2:] if len(str(target_model_instance.id)) >= 2 else '0' + str(target_model_instance.id)}/{str(target_model_instance.id)}/{filename_hash}_shared"

            # DB에 이미지 정보 저장
            new_image = FeedsImages(
                img_model=target_model,
                img_model_id=target_model_instance.id,
                image_url=file_url,
                sort_order=0,
                width=origin_model_instance.width,
                height=origin_model_instance.height,
                is_active="Y"
            )
            db.add(new_image)
            db.flush()
            return True
        else:
            raise FileNotFoundError("원본 이미지 파일을 찾을 수 없습니다.")

    except Exception as e:
        print(f"⚠️ 이미지 복사 중 오류: {str(e)}")
        db.rollback()
        return False