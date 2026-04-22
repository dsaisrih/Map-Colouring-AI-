"""
Graph coloring routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.coloring_service import (
    backtrack_color, greedy_color, random_color,
    compare_algorithms, build_adj_list, is_valid_coloring, get_violated_edges
)
from services.render_service import render_colored_map
from routes.image_routes import get_sessions

router = APIRouter()

class ColoringRequest(BaseModel):
    session_id: str
    num_colors: int = 4
    algorithm: str = "backtracking"

@router.post("/color")
def color_map(req: ColoringRequest):
    """Apply graph coloring algorithm"""
    sessions = get_sessions()
    
    if req.session_id not in sessions:
        raise HTTPException(404, "Session not found")
    
    session = sessions[req.session_id]
    
    if not session.get("regions"):
        raise HTTPException(400, "Run /detect first")
    if not session.get("graph"):
        raise HTTPException(400, "Run /adjacency first")
    
    nodes = session["graph"]["nodes"]
    edges = session["graph"]["edges"]
    regions = session["regions"]
    adj = build_adj_list(nodes, edges)
    
    try:
        coloring = None
        algorithm = req.algorithm.lower()
        
        if algorithm == "backtracking":
            coloring = backtrack_color(nodes, adj, req.num_colors)
            if coloring is None:
                # Try greedy as fallback
                coloring = greedy_color(nodes, adj, req.num_colors + 2)
        elif algorithm == "greedy":
            coloring = greedy_color(nodes, adj, req.num_colors)
        elif algorithm == "random":
            coloring = random_color(nodes, req.num_colors)
        else:
            raise HTTPException(400, f"Unknown algorithm: {req.algorithm}")
        
        if coloring is None:
            raise HTTPException(500, "Could not find valid coloring")
        
        # Validate result
        valid = is_valid_coloring(coloring, adj)
        violations = get_violated_edges(coloring, adj) if not valid else []
        
        # Render colored image
        image_url = render_colored_map(
            req.session_id,
            session["image_path"],
            coloring,
            regions,
            req.num_colors,
            algorithm
        )
        
        # Attach color to region data
        colored_regions = []
        for region in regions:
            rid = str(region["id"])
            colored_regions.append({
                **region,
                "color_index": coloring.get(rid),
            })
        
        # Store coloring result
        result = {
            "coloring": coloring,
            "valid": valid,
            "colors_used": len(set(coloring.values())),
            "violations": violations,
            "algorithm": algorithm,
            "image_url": image_url,
            "colored_regions": colored_regions,
        }
        sessions[req.session_id]["coloring"] = result
        
        return {"success": True, **result}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Coloring failed: {str(e)}")


@router.post("/compare")
def compare(req: ColoringRequest):
    """Compare all three algorithms"""
    sessions = get_sessions()
    
    if req.session_id not in sessions:
        raise HTTPException(404, "Session not found")
    
    session = sessions[req.session_id]
    if not session.get("graph"):
        raise HTTPException(400, "Run /adjacency first")
    
    nodes = session["graph"]["nodes"]
    edges = session["graph"]["edges"]
    
    try:
        results = compare_algorithms(nodes, edges, req.num_colors)
        return {"success": True, "comparison": results}
    except Exception as e:
        raise HTTPException(500, f"Comparison failed: {str(e)}")
