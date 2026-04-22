"""
Region detection and adjacency graph routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

from services.detection_service import detect_regions, build_adjacency_graph
from routes.image_routes import get_sessions

router = APIRouter()

class DetectRequest(BaseModel):
    session_id: str
    sensitivity: float = 0.5

class AdjacencyRequest(BaseModel):
    session_id: str

@router.post("/detect")
def detect(req: DetectRequest):
    """Run AI region detection on uploaded image"""
    sessions = get_sessions()
    
    if req.session_id not in sessions:
        raise HTTPException(404, "Session not found. Upload an image first.")
    
    session = sessions[req.session_id]
    image_path = session["image_path"]
    
    if not os.path.exists(image_path):
        raise HTTPException(404, "Image file not found")
    
    try:
        result = detect_regions(image_path, req.sensitivity, req.session_id)
        
        # Store regions in session
        sessions[req.session_id]["regions"] = result["regions"]
        
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(500, f"Detection failed: {str(e)}")


@router.post("/adjacency")
def adjacency(req: AdjacencyRequest):
    """Build adjacency graph from detected regions"""
    sessions = get_sessions()
    
    if req.session_id not in sessions:
        raise HTTPException(404, "Session not found")
    
    session = sessions[req.session_id]
    
    if not session.get("regions"):
        raise HTTPException(400, "No regions detected. Run /detect first.")
    
    try:
        graph = build_adjacency_graph(req.session_id, session["regions"])
        
        # Store graph in session
        sessions[req.session_id]["graph"] = graph
        
        return {
            "success": True,
            **graph
        }
    except Exception as e:
        raise HTTPException(500, f"Adjacency detection failed: {str(e)}")
