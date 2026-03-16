# 이미지 파일을 저장하는 메소드 (리사이징 지원)
from glob import glob
import os

from app.repository.attaches_files_repository import AttachesFilesRepository

def get_attache_files_by_model_id(db, model: str, model_id: int):
    attache_list = AttachesFilesRepository.get_attache_files_by_model_id(db, model=model, model_id=model_id)

    for attache in attache_list:
        attache.image_url = attache.image_url.replace('\\', '/')

    return attache_list

@staticmethod
async def upload_file(model_id: int, file, path: str = "Meals"):
    """
    업로드된 이미지를 여러 사이즈로 리사이징하여 WebP로 저장
    /attaches/{path}/{table.pk 뒤에 2자리}/{table.pk}/{base_filename}_{size}.webp
    ex) /attaches/Feeds/45/12345/20260123120000_abc123_medium.webp

    DB에는 확장자와 사이즈 접미사 없이 저장: /attaches/Feeds/45/12345/20260123120000_abc123
    """
    from app.libs.file_utils import save_upload_file_with_resize, get_file_url

    path = path.capitalize()

    try:
        # 저장 디렉토리 경로
        destination_path = os.path.join(
            "attaches",
            path,
            str(model_id)[-2:] if len(str(model_id)) >= 2 else "0" + str(model_id),
            str(model_id)
        )

        # 이미지 리사이징 및 저장
        success, result, original_filename, created_files = await save_upload_file_with_resize(file, destination_path)

        if not success:
            return None

        # 확장자와 사이즈 접미사 제거 (프론트엔드에서 조합)
        image_url = get_file_url(result, base_url="")
        image_path = image_url.replace('\\', '/')
        if '_medium.webp' in image_path:
            image_path = image_path.replace('_medium.webp', '')
        elif '.webp' in image_path:
            # _사이즈.webp 패턴 제거
            image_path = image_path.rsplit('_', 1)[0] if '_' in image_path.rsplit('/', 1)[-1] else image_path.rsplit('.', 1)[0]

        # 이미지 크기 정보 (medium 사이즈 기준)
        medium_file = next((f for f in created_files if f['size'] == 'medium'), created_files[0])

        # DB에 이미지 정보 저장
        image_params = {
            "image_url": "/" + image_path,
            "width": medium_file['width'],
            "height": medium_file['height'],
        }

        return image_params

    except Exception as e:
        return None

async def save_upload_file(db, model: str, model_id: int, result: dict):
    if model is None or model_id is None:
        raise ValueError("이미지 저장을 위한 필수 정보 누락되었습니다.")

    if result is None:
        raise ValueError("이미지 저장에 실패했습니다.")

    if "image_url" not in result:
        raise ValueError("이미지 URL 정보가 누락되었습니다.")

    AttachesFilesRepository.create(
        db,
        model=model,
        model_id=model_id,
        image_url=result['image_url'],
        width=result['width'],
        height=result['height'],
        sort_order=result.get('sort_order', 0)
    )

"""
해당 경로의 이미지 파일을 삭제하는 메소드
"""
def delete_attache_files_by_model_id(attache_files: list, is_delete: bool = False):

    result = {
        "deleted_files": 0,
        "renamed_files": 0,
        "missing_files": 0,
        "error": None,
    }

    for file in attache_files:
        file_base_path = file.image_url.lstrip('/')

        try:
            matching_files = glob.glob(f"{file_base_path}_*.webp")

            if not matching_files:
                result["missing_files"] += 1
                continue

            for file_path in matching_files:

                if not os.path.exists(file_path):
                    result["missing_files"] += 1
                    continue

                # Hard delete
                if is_delete:
                    os.remove(file_path)
                    result["deleted_files"] += 1

                # Soft delete (rename)
                else:
                    dir_name = os.path.dirname(file_path)
                    base_name = os.path.basename(file_path)

                    name, ext = os.path.splitext(base_name)

                    new_name = f"{name}_delete{ext}"
                    new_path = os.path.join(dir_name, new_name)

                    os.rename(file_path, new_path)
                    result["renamed_files"] += 1

        except Exception as e:
            result["error"] = str(e)

    return result

def soft_delete_file_by_model_id(session, model: str, model_id: int):

    result = {
        "success": False,
        "deleted_files": 0,
        "missing_files": 0,
        "db_deleted": False,
        "error": None,
    }

    attache_files = get_attache_files_by_model_id(
        session, model=model, model_id=model_id
    )

    # 파일 삭제 (soft delete)
    file_result = delete_attache_files_by_model_id(attache_files, is_delete=False)

    result["deleted_files"] = file_result["deleted_files"]
    result["missing_files"] = file_result["missing_files"]

    # DB 삭제
    try:
        AttachesFilesRepository.delete_attache_files_by_model_id(
            session, model=model, model_id=model_id
        )

        session.commit()

        result["db_deleted"] = True
        result["success"] = True

    except Exception as e:
        session.rollback()
        result["error"] = str(e)

    return result

def copy_attache_file(origin_model: str, origin_model_instance, target_model: str, target_model_instance):
    from app.libs.hash_utils import generate_sha256_hash
    from datetime import datetime
    from app.models.feeds_images import FeedsImages
    import shutil

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
            image_url = f"/attaches/{target_model}/{str(target_model_instance.id)[-2:] if len(str(target_model_instance.id)) >= 2 else '0' + str(target_model_instance.id)}/{str(target_model_instance.id)}/{filename_hash}_shared"

            return {
                "image_url": image_url,
                "width": origin_model_instance.width,
                "height": origin_model_instance.height,
            }
        else:
            raise FileNotFoundError("원본 이미지 파일을 찾을 수 없습니다.")

    except Exception as e:
        print(f"⚠️ 이미지 복사 중 오류: {str(e)}")
        return False