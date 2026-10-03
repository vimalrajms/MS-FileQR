from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pathlib import Path
import os
import uuid


app = FastAPI(title="MS FileQR API")


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# SUPABASE
# =========================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError("Supabase environment variables are missing.")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


# =========================
# SETTINGS
# =========================

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

MAX_SIZE = 50 * 1024 * 1024


# =========================
# HOME
# =========================

@app.get("/")
def home():
    return {
        "success": True,
        "app": "MS FileQR API",
        "status": "online",
        "storage": "supabase"
    }


# =========================
# UPLOAD
# =========================

@app.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    uploader_name: str = Form(...)
):

    # =========================
    # CHECK NAME
    # =========================

    uploader_name = uploader_name.strip()

    if not uploader_name:
        raise HTTPException(
            status_code=400,
            detail="Please enter your name."
        )

    if len(uploader_name) > 50:
        raise HTTPException(
            status_code=400,
            detail="Name must be 50 characters or less."
        )


    # =========================
    # CHECK FILE TYPE
    # =========================

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only image and video files are allowed."
        )


    # =========================
    # FILE EXTENSION
    # =========================

    extension = Path(file.filename or "").suffix.lower()

    if not extension:
        raise HTTPException(
            status_code=400,
            detail="File extension is missing."
        )


    # =========================
    # UNIQUE FILE NAME
    # =========================

    filename = f"{uuid.uuid4().hex}{extension}"


    # =========================
    # READ FILE
    # =========================

    file_data = await file.read()
    size = len(file_data)


    # =========================
    # SIZE CHECK
    # =========================

    if size > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size must be below 50 MB."
        )


    # =========================
    # GET IP ADDRESS
    # =========================

    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    else:
        ip_address = (
            request.client.host
            if request.client
            else None
        )


    # =========================
    # UPLOAD TO SUPABASE
    # =========================

    try:

        supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=file_data,
            file_options={
                "content-type": file.content_type,
                "cache-control": "3600",
                "upsert": "false",
            },
        )


        # =========================
        # PUBLIC URL
        # =========================

        public_url = supabase.storage.from_(
            BUCKET_NAME
        ).get_public_url(filename)


        # =========================
        # SAVE DATABASE
        # =========================

        supabase.table("upload_logs").insert({
            "uploader_name": uploader_name,
            "file_name": file.filename,
            "file_type": file.content_type,
            "file_size": size,
            "ip_address": ip_address,
            "file_url": public_url
        }).execute()


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(error)}"
        )


    finally:

        await file.close()


    # =========================
    # RESPONSE
    # =========================

    return {
        "success": True,
        "filename": file.filename,
        "size": size,
        "type": file.content_type,
        "url": public_url,
        "uploader_name": uploader_name
    }