from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse, Response
import os
import mimetypes

router = APIRouter()

@router.get("/{file_path:path}")
async def serve_attach(file_path: str):
    full_path = os.path.join("attaches", file_path)

    if not os.path.exists(full_path):
        return Response(status_code=404)

    print(f"⭕⭕⭕⭕⭕⭕⭕⭕full_path", full_path)
    # 기본 mime 추론
    media_type, _ = mimetypes.guess_type(full_path)

    # webp 강제 지정 (핵심)
    if full_path.lower().endswith(".webp"):
        media_type = "image/webp"

    return FileResponse(full_path, media_type=media_type)