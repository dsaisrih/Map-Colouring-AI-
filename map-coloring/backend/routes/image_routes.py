"""
Image upload and management routes
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uuid
import os
import shutil
from PIL import Image
import io

router = APIRouter()

# In-memory session store (use Redis in production)
sessions = {}

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload a map image and create a session"""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, f"Invalid file type: {file.content_type}. Use JPEG, PNG, BMP, or TIFF.")
    
    # Generate session ID
    session_id = str(uuid.uuid4())
    
    # Save uploaded file
    upload_dir = f"uploads/{session_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/original.png"
    
    # Read and save as PNG for consistent processing
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    
    # Convert to RGB if needed
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    
    # Resize if too large (max 1200px wide for performance)
    max_size = 1200
    if img.width > max_size:
        ratio = max_size / img.width
        new_size = (max_size, int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    
    img.save(file_path, 'PNG')
    
    # Store session metadata
    sessions[session_id] = {
        "image_path": file_path,
        "original_name": file.filename,
        "width": img.width,
        "height": img.height,
        "regions": None,
        "graph": None,
        "coloring": None,
        "simulation": None,
    }
    
    return {
        "session_id": session_id,
        "filename": file.filename,
        "width": img.width,
        "height": img.height,
        "image_url": f"/uploads/{session_id}/original.png",
        "message": "Image uploaded successfully"
    }

@router.get("/session/{session_id}")
def get_session(session_id: str):
    """Get session info"""
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")
    return sessions[session_id]

# Export sessions for use in other routes
def get_sessions():
    return sessions
