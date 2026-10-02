from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pathlib import Path
import os
import uuid

app = FastAPI(title="MS FileQR API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError("Supabase environment variables are missing.")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)

BUCKET_NAME = "uploads"

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
}

# Supabase bucket is currently 50 MB
MAX_SIZE = 50 * 1024 * 1024


@app.get("/")
def home():
    return {
        "success": True,
        "app": "MS FileQR API",
        "status": "online",
        "storage": "supabase"
    }


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    # Check file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only image and video files are allowed."
        )

    # Original extension
    extension = Path(file.filename or "").suffix.lower()

    if not extension:
        raise HTTPException(
            status_code=400,
            detail="File extension is missing."
        )

    # Unique filename
    filename = f"{uuid.uuid4().hex}{extension}"

    # Read file
    file_data = await file.read()

    # Check size
    size = len(file_data)

    if size > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size must be below 50 MB."
        )

    try:
        # Upload to Supabase Storage
        supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=file_data,
            file_options={
                "content-type": file.content_type,
                "cache-control": "3600",
                "upsert": "false",
            },
        )

        # Generate public URL
        public_url = supabase.storage.from_(
            BUCKET_NAME
        ).get_public_url(filename)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Storage upload failed: {str(error)}"
        )

    finally:
        await file.close()

    return {
        "success": True,
        "filename": file.filename,
        "size": size,
        "type": file.content_type,
        "url": public_url
    }