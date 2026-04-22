"""
Graph Coloring Algorithms:
- Backtracking (exact, with constraint propagation)
- Greedy (Welsh-Powell)
- Random (for Monte Carlo simulation)
"""
import random
import time
from typing import List, Dict, Optional, Tuple, Any
import numpy as np

# ─── GRAPH REPRESENTATION ───────────────────────────────────────────────────

def build_adj_list(nodes: List[Dict], edges: List[Dict]) -> Dict[str, List[str]]:
    """Build adjacency list from nodes and edges"""
    adj = {n["id"]: [] for n in nodes}
    for e in edges:
        src, tgt = e["source"], e["target"]
        if tgt not in adj[src]:
            adj[src].append(tgt)
        if src not in adj[tgt]:
            adj[tgt].append(src)
    return adj


def is_valid_coloring(coloring: Dict[str, int], adj: Dict[str, List[str]]) -> bool:
    """Check if a coloring is valid (no adjacent nodes share a color)"""
    for node, neighbors in adj.items():
        for nb in neighbors:
            if nb in coloring and node in coloring:
                if coloring[node] == coloring[nb]:
                    return False
    return True


def get_violated_edges(coloring: Dict[str, int], adj: Dict[str, List[str]]) -> List[Tuple]:
    """Return list of edges that violate constraints"""
    violations = []
    seen = set()
    for node, neighbors in adj.items():
        for nb in neighbors:
            pair = tuple(sorted([node, nb]))
            if pair not in seen:
                seen.add(pair)
                if node in coloring and nb in coloring:
                    if coloring[node] == coloring[nb]:
                        violations.append(pair)
    return violations


# ─── BACKTRACKING ────────────────────────────────────────────────────────────

def backtrack_color(nodes: List[Dict], adj: Dict[str, List[str]], num_colors: int) -> Optional[Dict[str, int]]:
    """
    Backtracking algorithm with forward checking.
    Returns a valid coloring dict {node_id: color_index} or None if impossible.
    """
    node_ids = [n["id"] for n in nodes]
    
    # Order by degree descending (Welsh-Powell order for efficiency)
    node_ids_sorted = sorted(node_ids, key=lambda nid: len(adj.get(nid, [])), reverse=True)
    
    coloring = {}
    
    def backtrack(idx: int) -> bool:
        if idx == len(node_ids_sorted):
            return True
        
        node = node_ids_sorted[idx]
        neighbor_colors = {coloring[nb] for nb in adj.get(node, []) if nb in coloring}
        
        for color in range(num_colors):
            if color not in neighbor_colors:
                coloring[node] = color
                if backtrack(idx + 1):
                    return True
                del coloring[node]
        
        return False
    
    if backtrack(0):
        return coloring
    return None


# ─── GREEDY (WELSH-POWELL) ───────────────────────────────────────────────────

def greedy_color(nodes: List[Dict], adj: Dict[str, List[str]], num_colors: int) -> Dict[str, int]:
    """
    Welsh-Powell greedy coloring.
    Processes nodes in descending degree order and assigns the lowest valid color.
    """
    # Sort by degree descending
    node_ids = sorted([n["id"] for n in nodes], key=lambda nid: len(adj.get(nid, [])), reverse=True)
    
    coloring = {}
    
    for node in node_ids:
        used_colors = {coloring[nb] for nb in adj.get(node, []) if nb in coloring}
        
        # Find smallest valid color
        for color in range(num_colors):
            if color not in used_colors:
                coloring[node] = color
                break
        else:
            # Assign overflow color (beyond num_colors)
            coloring[node] = num_colors  # Will show as invalid
    
    return coloring


# ─── RANDOM COLORING ─────────────────────────────────────────────────────────

def random_color(nodes: List[Dict], num_colors: int) -> Dict[str, int]:
    """Randomly assign colors to all nodes"""
    return {n["id"]: random.randint(0, num_colors - 1) for n in nodes}


# ─── MONTE CARLO SIMULATION ──────────────────────────────────────────────────

def monte_carlo_simulation(
    nodes: List[Dict],
    edges: List[Dict],
    num_colors: int,
    iterations: int
) -> Dict[str, Any]:
    """
    Monte Carlo SAT simulation:
    - Randomly assign colors N times
    - Count valid colorings
    - Compute satisfaction probability
    """
    adj = build_adj_list(nodes, edges)
    
    valid_count = 0
    invalid_count = 0
    valid_colorings = []
    violation_frequency = {n["id"]: 0 for n in nodes}
    
    start = time.time()
    
    for _ in range(iterations):
        coloring = random_color(nodes, num_colors)
        
        if is_valid_coloring(coloring, adj):
            valid_count += 1
            if len(valid_colorings) < 5:  # Store a few examples
                valid_colorings.append(coloring.copy())
        else:
            invalid_count += 1
            # Track which nodes caused violations
            violations = get_violated_edges(coloring, adj)
            for (a, b) in violations:
                violation_frequency[a] = violation_frequency.get(a, 0) + 1
                violation_frequency[b] = violation_frequency.get(b, 0) + 1
    
    elapsed = time.time() - start
    
    probability = valid_count / iterations if iterations > 0 else 0
    
    # Theoretical estimate: (num_colors^n * P_valid) where P_valid is fraction passing
    # For k-colorable graph: approx (k/n)^edges
    n_nodes = len(nodes)
    n_edges = len(edges)
    theoretical_prob = (num_colors / max(num_colors, 1)) ** n_edges if n_edges > 0 else 1.0
    
    return {
        "total_iterations": iterations,
        "valid_solutions": valid_count,
        "invalid_solutions": invalid_count,
        "satisfaction_probability": round(probability, 4),
        "elapsed_seconds": round(elapsed, 3),
        "iterations_per_second": round(iterations / max(elapsed, 0.001)),
        "sample_valid_colorings": valid_colorings[:3],
        "violation_heatmap": violation_frequency,
        "most_conflicted_nodes": sorted(
            violation_frequency.items(), key=lambda x: x[1], reverse=True
        )[:5],
    }


# ─── ALGORITHM COMPARISON ────────────────────────────────────────────────────

def compare_algorithms(nodes: List[Dict], edges: List[Dict], num_colors: int) -> Dict[str, Any]:
    """Run all three algorithms and compare results"""
    adj = build_adj_list(nodes, edges)
    results = {}
    
    # Greedy
    t0 = time.time()
    greedy = greedy_color(nodes, adj, num_colors)
    greedy_time = time.time() - t0
    greedy_valid = is_valid_coloring(greedy, adj)
    greedy_colors_used = len(set(greedy.values()))
    
    results["greedy"] = {
        "coloring": greedy,
        "valid": greedy_valid,
        "colors_used": greedy_colors_used,
        "time_ms": round(greedy_time * 1000, 2),
    }
    
    # Backtracking
    t0 = time.time()
    bt = backtrack_color(nodes, adj, num_colors)
    bt_time = time.time() - t0
    
    results["backtracking"] = {
        "coloring": bt if bt else {},
        "valid": bt is not None,
        "colors_used": len(set(bt.values())) if bt else 0,
        "time_ms": round(bt_time * 1000, 2),
    }
    
    # Random (single attempt)
    t0 = time.time()
    rnd = random_color(nodes, num_colors)
    rnd_time = time.time() - t0
    rnd_valid = is_valid_coloring(rnd, adj)
    
    results["random"] = {
        "coloring": rnd,
        "valid": rnd_valid,
        "colors_used": len(set(rnd.values())),
        "time_ms": round(rnd_time * 1000, 2),
    }
    
    return results
