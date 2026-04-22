"""
Monte Carlo simulation routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.coloring_service import monte_carlo_simulation
from routes.image_routes import get_sessions

router = APIRouter()

class SimulationRequest(BaseModel):
    session_id: str
    num_colors: int = 4
    iterations: int = 1000

@router.post("/simulate")
def simulate(req: SimulationRequest):
    """Run Monte Carlo SAT probability simulation"""
    sessions = get_sessions()
    
    if req.session_id not in sessions:
        raise HTTPException(404, "Session not found")
    
    session = sessions[req.session_id]
    
    if not session.get("graph"):
        raise HTTPException(400, "Run /adjacency first")
    
    # Clamp iterations for safety
    iterations = max(100, min(req.iterations, 10000))
    
    nodes = session["graph"]["nodes"]
    edges = session["graph"]["edges"]
    
    try:
        result = monte_carlo_simulation(nodes, edges, req.num_colors, iterations)
        
        # Add graph stats
        result["graph_stats"] = {
            "total_regions": len(nodes),
            "total_constraints": len(edges),
            "num_colors_tested": req.num_colors,
            "avg_degree": round(sum(n["degree"] for n in nodes) / max(len(nodes), 1), 2),
            "max_degree": max((n["degree"] for n in nodes), default=0),
            "density": round(len(edges) / max(len(nodes) * (len(nodes) - 1) / 2, 1), 4)
        }
        
        # SAT formula stats
        n = len(nodes)
        k = req.num_colors
        result["sat_stats"] = {
            "variables": n * k,
            "clauses_at_least_one": n,
            "clauses_at_most_one": n * k * (k - 1) // 2,
            "clauses_adjacency": len(edges) * k,
            "total_clauses": n + n * k * (k - 1) // 2 + len(edges) * k,
        }
        
        sessions[req.session_id]["simulation"] = result
        
        return {"success": True, **result}
    
    except Exception as e:
        raise HTTPException(500, f"Simulation failed: {str(e)}")


@router.get("/results/{session_id}")
def get_results(session_id: str):
    """Get complete results for a session"""
    sessions = get_sessions()
    
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")
    
    session = sessions[session_id]
    
    return {
        "session_id": session_id,
        "image_url": f"/uploads/{session_id}/original.png",
        "regions": session.get("regions", []),
        "graph": session.get("graph", {}),
        "coloring": session.get("coloring", {}),
        "simulation": session.get("simulation", {}),
    }
