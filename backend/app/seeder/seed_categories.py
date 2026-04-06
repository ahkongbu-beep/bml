import sys
from pathlib import Path

# 프로젝트 루트를 sys.path에 추가
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.categories_codes import CategoriesCodes


# 초기 데이터 정의
SEED_DATA = [
    {"type": "NOTICES_GROUP", "code": "notices_001", "value": "시스템", "sort": 1},
    {"type": "NOTICES_GROUP", "code": "notices_002", "value": "업데이트", "sort": 2},
    {"type": "NOTICES_GROUP", "code": "notices_003", "value": "정책", "sort": 3},
    {"type": "AGE_GROUP", "code": "age_001", "value": "0~3세", "sort": 1},
    {"type": "AGE_GROUP", "code": "age_002", "value": "3~4세", "sort": 2},
    {"type": "AGE_GROUP", "code": "age_003", "value": "5~6세", "sort": 3},
]

def seed_categories():
    db: Session = SessionLocal()

    try:
        for item in SEED_DATA:
            # 이미 존재하는지 확인 (type + code 기준)
            exists = (
                db.query(CategoriesCodes)
                .filter(
                    CategoriesCodes.type == item["type"],
                    CategoriesCodes.code == item["code"],
                )
                .first()
            )

            if exists:
                print(f"✔ Already exists: {item['code']}")
                continue

            # 신규 생성
            category = CategoriesCodes(**item)
            db.add(category)
            print(f"➕ Inserted: {item['code']}")

        db.commit()
        print("🎉 Seeder completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    # 테이블 생성 (없으면 만들어짐)
    CategoriesCodes.__table__.create(bind=engine, checkfirst=True)

    # Seeder 실행
    seed_categories()
