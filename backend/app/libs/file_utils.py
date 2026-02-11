import os
import uuid
from datetime import datetime
from fastapi import UploadFile
from typing import Tuple, Optional, List, Dict
from PIL import Image
import io

# 업로드 가능한 이미지 확장자
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

# 최대 파일 크기 (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

# 이미지 리사이즈 설정 (width 기준)
IMAGE_SIZES = {
    'original': None,      # 원본 크기 유지
    'large': 1200,         # 큰 사이즈
    'medium': 800,         # 중간 사이즈
    'small': 400,          # 작은 사이즈
    'thumbnail': 150,      # 썸네일
}

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

def get_file_url(file_path: str, base_url: str = "", remove_size_suffix: bool = False) -> str:
    """
    파일 경로를 URL로 변환

    Args:
        file_path: 실제 파일 경로 (예: attaches/users/20251203120000_abc123.jpg)
        base_url: 기본 URL
        remove_size_suffix: True일 경우 _medium.webp, _large.webp 등의 접미사 제거

    Returns:
        접근 가능한 URL
    """
    if not base_url:
        result_path = file_path
    else:
        # attaches 디렉토리 기준으로 상대 경로 추출
        if 'attaches' in file_path:
            relative_path = file_path.split('attaches')[-1].lstrip(os.sep).replace(os.sep, '/')
            result_path = f"{base_url}/attaches/{relative_path}"
        else:
            result_path = file_path

    # 사이즈 접미사 제거 (프론트엔드에서 조합하기 위함)
    if remove_size_suffix:
        result_path = result_path.replace('\\', '/')
        if '_medium.webp' in result_path:
            result_path = result_path.replace('_medium.webp', '')
        elif '.webp' in result_path:
            # _사이즈.webp 패턴 제거
            result_path = result_path.rsplit('_', 1)[0] if '_' in result_path.rsplit('/', 1)[-1] else result_path.rsplit('.', 1)[0]

    return result_path

def resize_and_convert_to_webp(image_content: bytes, base_filename: str, save_dir: str) -> Tuple[bool, List[Dict[str, str]], str]:
    """
    이미지를 여러 사이즈로 리사이징하고 WebP 형식으로 변환

    Args:
        image_content: 이미지 바이트 데이터
        base_filename: 기본 파일명 (확장자 없이)
        save_dir: 저장할 디렉토리

    Returns:
        (성공여부, 생성된 파일 정보 리스트, 에러 메시지)
    """
    try:
        # 이미지 열기
        img = Image.open(io.BytesIO(image_content))

        # RGBA로 변환 (투명도 지원)
        if img.mode in ('RGBA', 'LA', 'P'):
            # 투명 배경을 흰색으로 변환
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # 저장 디렉토리 생성
        os.makedirs(save_dir, exist_ok=True)

        created_files = []
        original_width, original_height = img.size

        # 각 사이즈별로 이미지 생성
        for size_name, target_width in IMAGE_SIZES.items():
            if target_width is None:
                # original 사이즈는 원본 크기 유지
                resized_img = img
                width, height = original_width, original_height
            elif target_width >= original_width:
                # 타깃 크기가 원본보다 크면 원본 크기 사용
                resized_img = img
                width, height = original_width, original_height
            else:
                # 비율 유지하며 리사이징
                ratio = target_width / original_width
                new_height = int(original_height * ratio)
                resized_img = img.resize((target_width, new_height), Image.Resampling.LANCZOS)
                width, height = target_width, new_height

            # WebP 파일명 생성
            filename = f"{base_filename}_{size_name}.webp"
            file_path = os.path.join(save_dir, filename)

            # WebP로 저장 (품질 85)
            resized_img.save(file_path, 'WEBP', quality=85, method=6)

            created_files.append({
                'size': size_name,
                'width': width,
                'height': height,
                'path': file_path,
                'filename': filename
            })

        return True, created_files, ""

    except Exception as e:
        return False, [], f"이미지 변환 중 오류가 발생했습니다: {str(e)}"

async def save_upload_file_with_resize(file: UploadFile, save_dir: str) -> Tuple[bool, str, Optional[str], List[Dict]]:
    """
    업로드된 파일을 여러 사이즈로 리사이징하여 WebP로 저장

    Args:
        file: FastAPI UploadFile 객체
        save_dir: 저장할 디렉토리 경로

    Returns:
        (성공여부, 대표 파일 경로 or 에러 메시지, 원본 파일명, 생성된 파일 목록)
    """
    try:
        # 파일 확장자 검증
        if not is_allowed_image(file.filename):
            return False, "지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 가능)", None, []

        # 파일 크기 검증
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            return False, "파일 크기가 너무 큽니다. (최대 5MB)", None, []

        # 고유한 기본 파일명 생성 (확장자 없이)
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        base_filename = f"{timestamp}_{unique_id}"

        # 이미지 리사이징 및 WebP 변환
        success, created_files, error_msg = resize_and_convert_to_webp(file_content, base_filename, save_dir)

        if not success:
            return False, error_msg, None, []

        # 대표 이미지는 medium 사이즈 (없으면 처음 생성된 파일)
        main_file = next((f for f in created_files if f['size'] == 'medium'), created_files[0])

        return True, main_file['path'], file.filename, created_files

    except Exception as e:
        return False, f"파일 저장 중 오류가 발생했습니다: {str(e)}", None, []
