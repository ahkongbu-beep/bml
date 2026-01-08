# 가상머신 실행
& C:/monorepo/bml/backend/venv/Scripts/Activate.ps1

# fastapi 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000  