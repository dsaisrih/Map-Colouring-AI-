"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple, Any

class RegionInfo(BaseModel):
    id: int
    label: str
    area: float
    centroid: Tuple[float, float]
    color: Optional[str] = None

class AdjacencyGraph(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class ColoringRequest(BaseModel):
    session_id: str
    num_colors: int = 4
    algorithm: str = "backtracking"  # backtracking | greedy | random

class SimulationRequest(BaseModel):
    session_id: str
    num_colors: int = 4
    iterations: int = 1000
    algorithm: str = "monte_carlo"

class SimulationResult(BaseModel):
    session_id: str
    total_iterations: int
    valid_solutions: int
    invalid_solutions: int
    satisfaction_probability: float
    algorithm_results: Dict[str, Any]
    regions: List[RegionInfo]
    graph: AdjacencyGraph
    colored_image_url: Optional[str] = None
    stats: Dict[str, Any]

class DetectRequest(BaseModel):
    session_id: str
    sensitivity: float = 0.5  # Edge detection sensitivity

class AdjacencyRequest(BaseModel):
    session_id: str
