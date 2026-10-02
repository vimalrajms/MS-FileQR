from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uuid

app = FastAPI(title="MS FileQR API")

# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# UPLOAD DIRECTORY
# -----------------------------

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount(
    "/files",
    StaticFiles(directory=UPLOAD_DIR),
    name="files"
)

# -----------------------------
# FILE SETTINGS
# -----------------------------

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
}

MAX_SIZE = 100 * 1024 * 1024


# -----------------------------
# HOME
# -----------------------------

@app.get("/")
def home():
    return {
        "success": True,
        "app": "MS FileQR",
        "status": "online"
    }


# -----------------------------
# UPLOAD
# -----------------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    # Check type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only image and video files are allowed."
        )

    # Extension
    extension = Path(file.filename).suffix.lower()

    # Unique filename
    filename = uuid.uuid4().hex + extension

    destination = UPLOAD_DIR / filename

    size = 0

    try:

        with destination.open("wb") as buffer:

            while True:

                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size += len(chunk)

                # Size limit
                if size > MAX_SIZE:

                    destination.unlink(
                        missing_ok=True
                    )

                    raise HTTPException(
                        status_code=413,
                        detail="File size must be below 100 MB."
                    )

                buffer.write(chunk)

    finally:

        await file.close()


    # Current local URL
    url = (
        f"http://127.0.0.1:8000"
        f"/files/{filename}"
    )


    return {
        "success": True,
        "filename": file.filename,
        "size": size,
        "type": file.content_type,
        "url": url
    }