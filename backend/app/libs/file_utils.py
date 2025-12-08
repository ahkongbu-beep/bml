import os
import uuid
from datetime import datetime
from fastapi import UploadFile
from typing import Tuple, Optional

# 업로드 가능한 이미지 확장자
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

# 최대 파일 크기 (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

def get_file_extension(filename: str) -> str:
    """파일 확장자 추출"""
    return os.path.splitext(filename)[1].lower()

def is_allowed_image(filename: str) -> bool:
    """이미지 파일 확장자 검증"""
    ext = get_file_extension(filename)
    return ext in ALLOWED_IMAGE_EXTENSIONS

def generate_unique_filename(original_filename: str) -> str:
    """고유한 파일명 생성 (UUID + 타임스탬프)"""
    ext = get_file_extension(original_filename)
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{ext}"

async def save_upload_file(file: UploadFile, save_dir: str) -> Tuple[bool, str, Optional[str]]:
    """
    업로드된 파일을 저장

    Args:
        file: FastAPI UploadFile 객체
        save_dir: 저장할 디렉토리 경로

    Returns:
        (성공여부, 저장된 파일 경로 or 에러 메시지, 원본 파일명)
    """
    try:
        # 파일 확장자 검증
        if not is_allowed_image(file.filename):
            return False, "지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 가능)", None

        # 파일 크기 검증
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            return False, "파일 크기가 너무 큽니다. (최대 5MB)", None

        # 저장 디렉토리 생성
        os.makedirs(save_dir, exist_ok=True)

        # 고유한 파일명 생성
        new_filename = generate_unique_filename(file.filename)
        file_path = os.path.join(save_dir, new_filename)

        # 파일 저장
        with open(file_path, 'wb') as f:
            f.write(file_content)

        return True, file_path, file.filename

    except Exception as e:
        return False, f"파일 저장 중 오류가 발생했습니다: {str(e)}", None

def delete_file(file_path: str) -> bool:
    """파일 삭제"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"파일 삭제 실패: {str(e)}")
        return False

def get_file_url(file_path: str, base_url: str = "http://10.11.1.102:8000") -> str:
    """
    파일 경로를 URL로 변환

    Args:
        file_path: 실제 파일 경로 (예: attaches/users/20251203120000_abc123.jpg)
        base_url: 기본 URL

    Returns:
        접근 가능한 URL
    """
    # attaches 디렉토리 기준으로 상대 경로 추출
    if 'attaches' in file_path:
        relative_path = file_path.split('attaches')[-1].lstrip(os.sep).replace(os.sep, '/')
        return f"{base_url}/attaches/{relative_path}"
    return file_path
