from datetime import datetime, timedelta

import sys
import os

# backend 루트 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# attaches/crops/ 디렉토리 내의 파일들을 삭제하는 배치 작업
# - crops 는 프론트앤드에서 이미지 crops 시 임시로 저장하는 디렉토리로, 일정 기간이 지난 파일들을 삭제하여 저장 공간을 확보하기 위함
# - 삭제기간은 6시간 이전으로 설정, 6시간이 지난 파일들은 삭제 대상이 됨
def set_clear_crops_image():
    try:
        crops_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'attaches', 'crops')
        now = datetime.now()
        for filename in os.listdir(crops_dir):
            file_path = os.path.join(crops_dir, filename)
            if os.path.isfile(file_path):
                file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                if now - file_mtime > timedelta(hours=6):
                    os.remove(file_path)
                    # print(f"Deleted: {file_path}")
    except Exception as e:
        print(f"Error occurred while clearing crops images: {str(e)}")

set_clear_crops_image()