# 🗺️ MapColor AI — Map Coloring & SAT Probability Simulator

A full-stack AI application that analyzes uploaded map images, detects regions using computer vision, builds a constraint graph, applies graph coloring algorithms, and computes satisfiability probability using Monte Carlo simulation.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend | FastAPI (Python) |
| CV/ML | OpenCV, scikit-image, NumPy |
| Graph | NetworkX |
| Charts | Recharts |
| Styling | Cyber/neon glassmorphism theme |

---

## 📁 Project Structure

```
map-coloring/
├── backend/
│   ├── main.py                   # FastAPI app + CORS
│   ├── requirements.txt
│   ├── routes/
│   │   ├── image_routes.py       # POST /api/upload
│   │   ├── detect_routes.py      # POST /api/detect, /api/adjacency
│   │   ├── color_routes.py       # POST /api/color, /api/compare
│   │   └── simulate_routes.py    # POST /api/simulate, GET /api/results
│   ├── services/
│   │   ├── detection_service.py  # OpenCV region detection + adjacency
│   │   ├── coloring_service.py   # Backtracking, Greedy, Random, Monte Carlo
│   │   └── render_service.py     # Render colored map images
│   └── models/
│       └── schemas.py            # Pydantic models
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               # Router setup
        ├── main.jsx
        ├── index.css             # Cyber theme styles
        ├── pages/
        │   ├── LandingPage.jsx   # Animated hero
        │   ├── UploadPage.jsx    # Drag & drop upload
        │   ├── DetectionPage.jsx # Region detection + graph
        │   ├── SimulationPage.jsx# Algorithm config + run
        │   └── ResultsPage.jsx   # Full dashboard + charts
        ├── components/
        │   ├── Layout.jsx        # Sidebar navigation
        │   └── GraphCanvas.jsx   # Force-directed graph SVG
        ├── hooks/
        │   └── useAppContext.jsx  # Global state context
        └── services/
            └── api.js            # Axios API calls
```

---

## 🚀 Installation & Running

### Prerequisites
- Python 3.9+
- Node.js 18+

---

### Backend Setup

```bash
cd map-coloring/backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

---

### Frontend Setup

```bash
cd map-coloring/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🧠 AI/ML Pipeline

### 1. Region Detection (`detection_service.py`)
```
Upload Image
    │
    ▼
Grayscale Conversion (cv2.cvtColor)
    │
    ▼
Gaussian Blur (noise reduction)
    │
    ▼
Canny Edge Detection (sensitivity-controlled)
    │
    ▼
Morphological Dilation (close gaps in edges)
    │
    ▼
Contour Detection (cv2.findContours RETR_CCOMP)
    │
    ▼
Area Filtering (remove noise, keep valid regions)
    │
    ▼
Region Labeling (R1, R2, ... Rn)
```

### 2. Adjacency Graph (`detection_service.py`)
```
For each pair of regions (Ri, Rj):
    Dilate Ri mask (5x5 kernel, 3 iterations)
    Dilate Rj mask
    If overlap(dilated_Ri, dilated_Rj) > 0:
        Add edge (i, j) to graph
```

### 3. Graph Coloring Algorithms (`coloring_service.py`)

| Algorithm | Time Complexity | Optimal? |
|-----------|----------------|----------|
| Backtracking | O(k^n) worst case | Yes |
| Greedy (Welsh-Powell) | O(n log n + m) | No (heuristic) |
| Random | O(n) | No |

### 4. Monte Carlo SAT Simulation

```python
valid = 0
for i in range(N):
    coloring = random_assign(regions, k)
    if is_valid(coloring, adjacency_graph):
        valid += 1

P(SAT) = valid / N
```

### 5. SAT Encoding (CNF)

For each region `r` with colors `1..k`:
- **At least one color**: `(x_r,1 ∨ x_r,2 ∨ … ∨ x_r,k)`
- **At most one color**: `(¬x_r,i ∨ ¬x_r,j)` for all i≠j
- **Adjacent differ**: `(¬x_r,c ∨ ¬x_s,c)` for all edges (r,s) and colors c

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image → returns session_id |
| POST | `/api/detect` | Detect regions → returns region list + overlay image |
| POST | `/api/adjacency` | Build graph → returns nodes + edges |
| POST | `/api/color` | Apply coloring algorithm → returns coloring + colored image |
| POST | `/api/compare` | Compare all 3 algorithms |
| POST | `/api/simulate` | Run Monte Carlo SAT simulation |
| GET  | `/api/results/{session_id}` | Get full session results |

---

## 🎨 UI Features

- **Cyber/neon theme** with glassmorphism cards
- **Framer Motion** animations throughout
- **Force-directed graph** visualization (custom SVG)
- **Recharts** for bar, pie, line charts
- **Drag & drop** file upload
- **Algorithm comparison** table
- **SAT formula** viewer
- **Violation heatmap** for conflicted nodes
- **Responsive** sidebar navigation

---

## 📊 Results Dashboard

The dashboard shows:
1. Original vs. colored map side by side
2. Colored adjacency graph (with node colors)
3. P(SAT) probability with convergence chart
4. Region area distribution
5. Node degree distribution
6. Color assignment distribution
7. CNF SAT formula statistics
8. Violation heatmap

---

## 🗺️ Best Maps to Try

- Political world map (clear country borders)
- US state map
- Simple geometric region diagram
- Hand-drawn map with clear boundaries

---

## 🔧 Troubleshooting

**Backend fails to start:**
```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

**OpenCV import error:**
```bash
pip install opencv-python-headless  # headless version for servers
```

**Frontend proxy not working:**
- Make sure backend is running on port 8000
- Vite proxy is configured in `vite.config.js`

**Too many/few regions detected:**
- Adjust "Edge Sensitivity" slider on the Detect page
- Lower = more regions (fine edges), Higher = fewer regions (coarse)

---

## 📝 License

MIT — Free to use and modify.
