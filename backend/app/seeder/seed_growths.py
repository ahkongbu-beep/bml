"""
성장 데이터 시드 스크립트
growths 테이블에 초기 데이터 삽입용
엑셀 파일을 읽어서 성장 데이터를 삽입하는 로직 구현예정
파일 경로:
- ./files/grwoth_height.xlsx
- ./files/grwoth_weight.xlsx
"""


import sys
from pathlib import Path
import pandas as pd

# 프로젝트 루트를 sys.path에 추가
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.repository.growths_repository import GrowthsRepository

def seed_growths():
    db: Session = SessionLocal()

    success_cnt = 0

    # types = ['height', 'weight', 'header']
    types = ['header']
    for type in types:
        data = excel_reader(type)

        for _, row in data.iterrows():
            months = row['months']
            gender = row['gender']

            if pd.isna(months) or pd.isna(gender):
                print(f"Skipping row with missing months or gender: {row}")
                continue

            for percentile in ['3rd', '5th', '10th', '15th', '25th', '50th', '75th', '85th', '90th', '95th', '97th']:
                percent_value = row[percentile]
                if pd.isna(percent_value):
                    continue

                growth = GrowthsRepository.add_growth(db, {
                    "type": type,
                    "months": months,
                    "percent": percentile,
                    "value": percent_value,
                    "gender": gender,
                    "is_active":'Y'
                })

                if growth:
                    success_cnt += 1
                else:
                    print(f"Failed to insert growth data: {type}, {months} months, {gender}, {percentile} percentile")

    db.commit()
    print(f"성장 데이터 시드 완료. 총 {success_cnt}개 삽입됨.")

def excel_reader(type):
    file_path = backend_path / 'app/seeder/files' / f'growth_{type}.xlsx'
    df = pd.read_excel(file_path)
    return df

if __name__ == "__main__":
    # 테이블 생성 (없으면 만들어짐)
        # Seeder 실행
    seed_growths()
