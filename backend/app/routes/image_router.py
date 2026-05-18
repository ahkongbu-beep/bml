from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps
import io
import os
import uuid

router = APIRouter()

CROP_DIR = os.path.join(os.getcwd(), "attaches", "crops")
os.makedirs(CROP_DIR, exist_ok=True)


@router.post("/crop")
async def crop_image(
    file: UploadFile = File(...),
    origin_x: int = Form(...),
    origin_y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
    quality: int = Form(80),
):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))
        # EXIF 방향 적용 - React Native Image.getSize()와 동일한 기준으로 맞춤
        img = ImageOps.exif_transpose(img)

        img_w, img_h = img.size
        # clamp to image bounds
        origin_x = max(0, min(origin_x, img_w - 1))
        origin_y = max(0, min(origin_y, img_h - 1))
        width = max(1, min(width, img_w - origin_x))
        height = max(1, min(height, img_h - origin_y))

        cropped = img.crop((origin_x, origin_y, origin_x + width, origin_y + height))

        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(CROP_DIR, filename)

        if cropped.mode in ("RGBA", "P"):
            cropped = cropped.convert("RGB")

        cropped.save(filepath, "JPEG", quality=quality)

        return JSONResponse(content={
            "success": True,
            "data": {"uri": f"/attaches/crops/{filename}"},
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)},
        )
