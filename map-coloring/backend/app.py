"""
MapColor AI — Single-File Backend
Run: python app.py  OR  uvicorn app:app --reload --port 8000
"""
import os, io, uuid, time, random, json
from typing import List, Dict, Optional, Any, Tuple

# ── FastAPI ──────────────────────────────────────────────────────────────────
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Vision ───────────────────────────────────────────────────────────────────
import cv2
import numpy as np
from PIL import Image

app = FastAPI(title="MapColor AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins in dev
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─────────────────────────────────────────────────────────────────────────────
# IN-MEMORY SESSION STORE
# ─────────────────────────────────────────────────────────────────────────────
SESSIONS: Dict[str, Any] = {}

# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────────────────────────────────────
class DetectReq(BaseModel):
    session_id: str
    sensitivity: float = 0.5

class AdjReq(BaseModel):
    session_id: str

class ColorReq(BaseModel):
    session_id: str
    num_colors: int = 4
    algorithm: str = "backtracking"

class SimReq(BaseModel):
    session_id: str
    num_colors: int = 4
    iterations: int = 1000

# ─────────────────────────────────────────────────────────────────────────────
# ALGORITHM HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def build_adj(nodes, edges):
    adj = {n["id"]: [] for n in nodes}
    for e in edges:
        s, t = e["source"], e["target"]
        if t not in adj[s]: adj[s].append(t)
        if s not in adj[t]: adj[t].append(s)
    return adj

def is_valid(coloring, adj):
    for node, nbrs in adj.items():
        for nb in nbrs:
            if node in coloring and nb in coloring and coloring[node] == coloring[nb]:
                return False
    return True

def get_violations(coloring, adj):
    viol, seen = [], set()
    for node, nbrs in adj.items():
        for nb in nbrs:
            pair = tuple(sorted([node, nb]))
            if pair not in seen:
                seen.add(pair)
                if node in coloring and nb in coloring and coloring[node] == coloring[nb]:
                    viol.append(list(pair))
    return viol

def backtrack(nodes, adj, k):
    ids = sorted([n["id"] for n in nodes], key=lambda nid: len(adj.get(nid, [])), reverse=True)
    col = {}
    def bt(i):
        if i == len(ids): return True
        node = ids[i]
        used = {col[nb] for nb in adj.get(node, []) if nb in col}
        for c in range(k):
            if c not in used:
                col[node] = c
                if bt(i + 1): return True
                del col[node]
        return False
    return col if bt(0) else None

def greedy(nodes, adj, k):
    ids = sorted([n["id"] for n in nodes], key=lambda nid: len(adj.get(nid, [])), reverse=True)
    col = {}
    for node in ids:
        used = {col[nb] for nb in adj.get(node, []) if nb in col}
        for c in range(k + 2):
            if c not in used:
                col[node] = c
                break
    return col

def random_col(nodes, k):
    return {n["id"]: random.randint(0, k - 1) for n in nodes}

# ─────────────────────────────────────────────────────────────────────────────
# REGION DETECTION
# ─────────────────────────────────────────────────────────────────────────────
COLOR_PALETTE = [
    (231, 76, 60), (46, 204, 113), (52, 152, 219),
    (241, 196, 15), (155, 89, 182), (230, 126, 34),
    (26, 188, 156), (236, 240, 241), (52, 73, 94),
    (243, 156, 18), (192, 57, 43), (39, 174, 96),
]

def detect_regions_cv(image_path: str, sensitivity: float, session_id: str):
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError("Cannot read image")

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    lo = int(20 + 60 * (1 - sensitivity))
    hi = int(80 + 120 * (1 - sensitivity))
    edges = cv2.Canny(blurred, lo, hi)

    kernel = np.ones((3, 3), np.uint8)
    edges_d = cv2.dilate(edges, kernel, iterations=2)

    contours, _ = cv2.findContours(edges_d, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

    min_a = w * h * 0.004
    max_a = w * h * 0.92
    valid = [c for c in contours if min_a < cv2.contourArea(c) < max_a]
    valid = sorted(valid, key=cv2.contourArea, reverse=True)[:40]

    regions = []
    region_mask = np.zeros((h, w), dtype=np.int32)
    overlay = img_rgb.copy()
    fill_layer = overlay.copy()

    for idx, cnt in enumerate(valid):
        rid = idx + 1
        area = cv2.contourArea(cnt)
        M = cv2.moments(cnt)
        cx = int(M["m10"] / M["m00"]) if M["m00"] > 0 else w // 2
        cy = int(M["m01"] / M["m00"]) if M["m00"] > 0 else h // 2
        x, y, bw, bh = cv2.boundingRect(cnt)

        cv2.drawContours(region_mask, [cnt], -1, rid, -1)

        color = COLOR_PALETTE[idx % len(COLOR_PALETTE)]
        cv2.drawContours(fill_layer, [cnt], -1, color, -1)
        cv2.drawContours(overlay, [cnt], -1, (30, 30, 30), 2)

        label = f"R{rid}"
        fs, ft = 0.55, 2
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, fs, ft)
        cv2.rectangle(overlay, (cx - tw//2 - 3, cy - th - 3), (cx + tw//2 + 3, cy + 3), (0,0,0), -1)
        cv2.putText(overlay, label, (cx - tw//2, cy), cv2.FONT_HERSHEY_SIMPLEX, fs, (255,255,255), ft)

        regions.append({
            "id": rid, "label": label, "area": float(area),
            "centroid": [float(cx), float(cy)],
            "bounding_box": [int(x), int(y), int(bw), int(bh)],
            "contour_points": cnt.reshape(-1, 2).tolist()[:60],
            "color": None,
        })

    result = cv2.addWeighted(fill_layer, 0.35, overlay, 0.65, 0)

    out_dir = f"uploads/{session_id}"
    os.makedirs(out_dir, exist_ok=True)
    detect_path = f"{out_dir}/detected.png"
    cv2.imwrite(detect_path, cv2.cvtColor(result, cv2.COLOR_RGB2BGR))
    np.save(f"{out_dir}/mask.npy", region_mask)

    return {
        "regions": regions,
        "total_regions": len(regions),
        "image_size": [w, h],
        "detected_image_url": f"/uploads/{session_id}/detected.png",
    }

def build_adjacency_cv(session_id: str, regions: list):
    mask = np.load(f"uploads/{session_id}/mask.npy")
    kernel = np.ones((7, 7), np.uint8)
    n = len(regions)
    cache = {}
    for r in regions:
        m = (mask == r["id"]).astype(np.uint8)
        cache[r["id"]] = cv2.dilate(m, kernel, iterations=3)

    adj_set = set()
    for i in range(n):
        for j in range(i + 1, n):
            a, b = regions[i]["id"], regions[j]["id"]
            if np.any(cv2.bitwise_and(cache[a], cache[b])):
                adj_set.add((min(a, b), max(a, b)))

    nodes = []
    for r in regions:
        deg = sum(1 for (a, b) in adj_set if a == r["id"] or b == r["id"])
        nodes.append({
            "id": str(r["id"]), "label": r["label"],
            "area": r["area"], "centroid": r["centroid"],
            "degree": deg, "color": None,
        })

    edges = [{"id": f"e{a}-{b}", "source": str(a), "target": str(b)} for a, b in adj_set]
    max_deg = max((n_["degree"] for n_ in nodes), default=0)

    return {
        "nodes": nodes, "edges": edges,
        "total_edges": len(edges),
        "adjacency_list": [list(p) for p in adj_set],
        "chromatic_lower_bound": min(max_deg, 4),
    }

def render_colored(session_id, image_path, coloring, regions, k, algo):
    img = cv2.imread(image_path)
    if img is None:
        return None
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = img.shape[:2]

    COLORS = [
        (231, 76, 60), (46, 204, 113), (52, 152, 219), (241, 196, 15),
        (155, 89, 182), (230, 126, 34), (26, 188, 156), (236, 100, 241),
    ]

    mask_path = f"uploads/{session_id}/mask.npy"
    if not os.path.exists(mask_path):
        return None
    region_mask = np.load(mask_path)

    colored = np.zeros((h, w, 3), dtype=np.uint8)
    for r in regions:
        rid = str(r["id"])
        if rid in coloring:
            c = coloring[rid] % len(COLORS)
            colored[(region_mask == r["id"])] = COLORS[c]

    has_col = np.sum(colored, axis=2) > 0
    result = img_rgb.copy().astype(float)
    result[has_col] = img_rgb[has_col].astype(float) * 0.35 + colored[has_col].astype(float) * 0.65
    result = result.astype(np.uint8)

    for r in regions:
        if r.get("contour_points"):
            pts = np.array(r["contour_points"], dtype=np.int32).reshape(-1, 1, 2)
            cv2.polylines(result, [pts], True, (20, 20, 20), 2)

    for r in regions:
        cx, cy = int(r["centroid"][0]), int(r["centroid"][1])
        label = r["label"]
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        cv2.rectangle(result, (cx-tw//2-3, cy-th-3), (cx+tw//2+3, cy+3), (10,10,10), -1)
        cv2.putText(result, label, (cx-tw//2, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)

    out = f"uploads/{session_id}/colored_{algo}.png"
    cv2.imwrite(out, cv2.cvtColor(result, cv2.COLOR_RGB2BGR))
    return f"/uploads/{session_id}/colored_{algo}.png"

# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "MapColor AI running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    allowed = ["image/jpeg", "image/png", "image/bmp", "image/tiff", "image/gif", "image/webp"]
    if file.content_type not in allowed:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    session_id = str(uuid.uuid4())
    out_dir = f"uploads/{session_id}"
    os.makedirs(out_dir, exist_ok=True)

    data = await file.read()
    img = Image.open(io.BytesIO(data)).convert("RGB")

    # Resize if too large
    if img.width > 1200:
        img = img.resize((1200, int(img.height * 1200 / img.width)), Image.LANCZOS)

    path = f"{out_dir}/original.png"
    img.save(path, "PNG")

    SESSIONS[session_id] = {
        "image_path": path, "filename": file.filename,
        "width": img.width, "height": img.height,
        "regions": None, "graph": None, "coloring": None, "simulation": None,
    }

    return {
        "session_id": session_id, "filename": file.filename,
        "width": img.width, "height": img.height,
        "image_url": f"/uploads/{session_id}/original.png",
        "message": "Uploaded successfully",
    }

@app.post("/api/detect")
def detect(req: DetectReq):
    s = SESSIONS.get(req.session_id)
    if not s:
        raise HTTPException(404, "Session not found — upload first")
    try:
        result = detect_regions_cv(s["image_path"], req.sensitivity, req.session_id)
        SESSIONS[req.session_id]["regions"] = result["regions"]
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(500, f"Detection error: {e}")

@app.post("/api/adjacency")
def adjacency(req: AdjReq):
    s = SESSIONS.get(req.session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    if not s.get("regions"):
        raise HTTPException(400, "Run /api/detect first")
    try:
        graph = build_adjacency_cv(req.session_id, s["regions"])
        SESSIONS[req.session_id]["graph"] = graph
        return {"success": True, **graph}
    except Exception as e:
        raise HTTPException(500, f"Adjacency error: {e}")

@app.post("/api/color")
def color(req: ColorReq):
    s = SESSIONS.get(req.session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    if not s.get("graph"):
        raise HTTPException(400, "Run /api/adjacency first")

    nodes = s["graph"]["nodes"]
    edges = s["graph"]["edges"]
    adj = build_adj(nodes, edges)
    algo = req.algorithm.lower()

    try:
        if algo == "backtracking":
            col = backtrack(nodes, adj, req.num_colors)
            if col is None:
                col = greedy(nodes, adj, req.num_colors)
        elif algo == "greedy":
            col = greedy(nodes, adj, req.num_colors)
        else:
            col = random_col(nodes, req.num_colors)

        valid = is_valid(col, adj)
        violations = get_violations(col, adj)
        img_url = render_colored(req.session_id, s["image_path"], col, s["regions"], req.num_colors, algo)

        colored_regions = [
            {**r, "color_index": col.get(str(r["id"]))} for r in s["regions"]
        ]

        # Theoretical P(SAT) for uniform random k-coloring: P(SAT) ≈ ((k-1)/k)^m
        n_nodes = len(nodes)
        m_edges = len(edges)
        k = req.num_colors
        theoretical_psat = round(((k - 1) / k) ** m_edges, 6) if k > 0 and m_edges > 0 else (1.0 if k > 0 else 0.0)

        result = {
            "coloring": col, "valid": valid,
            "colors_used": len(set(col.values())),
            "violations": violations, "algorithm": algo,
            "image_url": img_url, "colored_regions": colored_regions,
            "satisfaction_probability": theoretical_psat,
            "theoretical_psat": theoretical_psat,
            "psat_formula": f"((k-1)/k)^m = (({k}-1)/{k})^{m_edges} = {theoretical_psat}",
            "graph_info": {
                "nodes": n_nodes,
                "edges": m_edges,
                "colors": k,
            },
        }
        SESSIONS[req.session_id]["coloring"] = result
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(500, f"Coloring error: {e}")

@app.post("/api/compare")
def compare(req: ColorReq):
    s = SESSIONS.get(req.session_id)
    if not s or not s.get("graph"):
        raise HTTPException(400, "Run /api/adjacency first")

    nodes = s["graph"]["nodes"]
    edges = s["graph"]["edges"]
    adj = build_adj(nodes, edges)
    out = {}

    for algo_name, fn in [("backtracking", lambda: backtrack(nodes, adj, req.num_colors)),
                           ("greedy",       lambda: greedy(nodes, adj, req.num_colors)),
                           ("random",       lambda: random_col(nodes, req.num_colors))]:
        t0 = time.time()
        col = fn()
        elapsed = (time.time() - t0) * 1000
        if col is None:
            out[algo_name] = {"coloring": {}, "valid": False, "colors_used": 0, "time_ms": round(elapsed, 2)}
        else:
            out[algo_name] = {
                "coloring": col, "valid": is_valid(col, adj),
                "colors_used": len(set(col.values())), "time_ms": round(elapsed, 2),
            }
    return {"success": True, "comparison": out}

@app.post("/api/simulate")
def simulate(req: SimReq):
    s = SESSIONS.get(req.session_id)
    if not s or not s.get("graph"):
        raise HTTPException(400, "Run /api/adjacency first")

    nodes = s["graph"]["nodes"]
    edges = s["graph"]["edges"]
    adj = build_adj(nodes, edges)
    iters = max(100, min(req.iterations, 10000))

    valid_n = 0
    invalid_n = 0
    viol_freq: Dict[str, int] = {n["id"]: 0 for n in nodes}
    sample_valid = []

    t0 = time.time()
    for _ in range(iters):
        col = random_col(nodes, req.num_colors)
        if is_valid(col, adj):
            valid_n += 1
            if len(sample_valid) < 3:
                sample_valid.append(col.copy())
        else:
            invalid_n += 1
            for (a, b) in get_violations(col, adj):
                viol_freq[str(a)] = viol_freq.get(str(a), 0) + 1
                viol_freq[str(b)] = viol_freq.get(str(b), 0) + 1
    elapsed = time.time() - t0

    prob = round(valid_n / iters, 4)
    n, k = len(nodes), req.num_colors
    m = len(edges)

    # Theoretical P(SAT) for uniform random k-coloring: P(SAT) ≈ ((k-1)/k)^m
    theoretical_psat = round(((k - 1) / k) ** m, 6) if k > 0 and m > 0 else (1.0 if k > 0 else 0.0)

    result = {
        "total_iterations": iters,
        "valid_solutions": valid_n,
        "invalid_solutions": invalid_n,
        "satisfaction_probability": prob,
        "theoretical_psat": theoretical_psat,
        "psat_formula": f"((k-1)/k)^m = (({k}-1)/{k})^{m} = {theoretical_psat}",
        "elapsed_seconds": round(elapsed, 3),
        "iterations_per_second": round(iters / max(elapsed, 0.001)),
        "sample_valid_colorings": sample_valid,
        "violation_heatmap": viol_freq,
        "most_conflicted_nodes": sorted(viol_freq.items(), key=lambda x: x[1], reverse=True)[:5],
        "graph_stats": {
            "total_regions": n, "total_constraints": m,
            "num_colors_tested": k,
            "avg_degree": round(sum(nd["degree"] for nd in nodes) / max(n, 1), 2),
            "max_degree": max((nd["degree"] for nd in nodes), default=0),
            "density": round(m / max(n * (n - 1) / 2, 1), 4),
        },
        "sat_stats": {
            "variables": n * k,
            "clauses_at_least_one": n,
            "clauses_at_most_one": n * k * (k - 1) // 2,
            "clauses_adjacency": m * k,
            "total_clauses": n + n * k * (k - 1) // 2 + m * k,
        },
    }
    SESSIONS[req.session_id]["simulation"] = result
    return {"success": True, **result}

@app.get("/api/results/{session_id}")
def results(session_id: str):
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    return {
        "session_id": session_id,
        "image_url": f"/uploads/{session_id}/original.png",
        "regions": s.get("regions", []),
        "graph": s.get("graph", {}),
        "coloring": s.get("coloring", {}),
        "simulation": s.get("simulation", {}),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
