"""
AI Map Coloring & SAT Probability Simulator - FastAPI Backend
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os

from routes import image_routes, detect_routes, color_routes, simulate_routes

app = FastAPI(
    title="AI Map Coloring Simulator",
    description="Upload maps, detect regions, apply graph coloring algorithms & compute SAT probability",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Include routes
app.include_router(image_routes.router, prefix="/api", tags=["Image"])
app.include_router(detect_routes.router, prefix="/api", tags=["Detection"])
app.include_router(color_routes.router, prefix="/api", tags=["Coloring"])
app.include_router(simulate_routes.router, prefix="/api", tags=["Simulation"])

@app.get("/")
def root():
    return {"message": "AI Map Coloring API is running!", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
