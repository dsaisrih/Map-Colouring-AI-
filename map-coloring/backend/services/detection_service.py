"""
AI/ML Pipeline for Region Detection using OpenCV + scikit-image
"""
import cv2
import numpy as np
from PIL import Image
import os
from typing import List, Dict, Tuple, Any
import json

def detect_regions(image_path: str, sensitivity: float = 0.5, session_id: str = "") -> Dict[str, Any]:
    """
    Detect enclosed regions in a map image using:
    1. Grayscale conversion
    2. Gaussian blur  
    3. Canny edge detection
    4. Contour detection
    5. Region labeling
    """
    
    # Load image
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    h, w = img_bgr.shape[:2]
    
    # Step 1: Convert to grayscale
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Step 2: Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Step 3: Canny edge detection (sensitivity controls thresholds)
    low_thresh = int(30 * (1 - sensitivity) + 10)
    high_thresh = int(150 * (1 - sensitivity) + 50)
    edges = cv2.Canny(blurred, low_thresh, high_thresh)
    
    # Step 4: Dilate edges to close gaps
    kernel = np.ones((3, 3), np.uint8)
    edges_dilated = cv2.dilate(edges, kernel, iterations=2)
    
    # Step 5: Find contours (regions)
    contours, hierarchy = cv2.findContours(
        edges_dilated, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Step 6: Filter contours by area (remove tiny noise)
    min_area = (w * h) * 0.005  # At least 0.5% of image area
    max_area = (w * h) * 0.95   # At most 95% of image
    
    valid_contours = []
    for i, cnt in enumerate(contours):
        area = cv2.contourArea(cnt)
        if min_area < area < max_area:
            valid_contours.append(cnt)
    
    # Limit to reasonable number of regions
    valid_contours = sorted(valid_contours, key=cv2.contourArea, reverse=True)[:50]
    
    # Step 7: Build region data
    regions = []
    region_mask = np.zeros((h, w), dtype=np.int32)
    
    for idx, cnt in enumerate(valid_contours):
        region_id = idx + 1
        area = cv2.contourArea(cnt)
        
        # Compute centroid
        M = cv2.moments(cnt)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
        else:
            x, y, ww, hh = cv2.boundingRect(cnt)
            cx, cy = x + ww // 2, y + hh // 2
        
        # Bounding box
        x, y, bw, bh = cv2.boundingRect(cnt)
        
        # Fill region mask
        cv2.drawContours(region_mask, [cnt], -1, region_id, thickness=-1)
        
        regions.append({
            "id": region_id,
            "label": f"R{region_id}",
            "area": float(area),
            "centroid": [float(cx), float(cy)],
            "bounding_box": [int(x), int(y), int(bw), int(bh)],
            "color": None,
            "contour_points": cnt.reshape(-1, 2).tolist()[:50]  # Limit points
        })
    
    # Step 8: Create visualization overlay
    overlay = img_rgb.copy()
    colors_palette = [
        (255, 100, 100), (100, 200, 100), (100, 100, 255),
        (255, 200, 100), (200, 100, 255), (100, 255, 200),
        (255, 150, 200), (150, 255, 150), (200, 150, 255),
        (255, 255, 100), (100, 200, 255), (255, 100, 200),
    ]
    
    # Draw contours with semi-transparency
    overlay_layer = overlay.copy()
    for idx, (cnt, region) in enumerate(zip(valid_contours, regions)):
        color = colors_palette[idx % len(colors_palette)]
        cv2.drawContours(overlay_layer, [cnt], -1, color, thickness=-1)
        cv2.drawContours(overlay, [cnt], -1, (50, 50, 50), thickness=2)
        
        # Add label at centroid
        cx, cy = int(region["centroid"][0]), int(region["centroid"][1])
        label = region["label"]
        font_scale = 0.6
        thickness = 2
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
        cv2.rectangle(overlay, (cx - tw//2 - 3, cy - th - 3), (cx + tw//2 + 3, cy + 3), (0,0,0), -1)
        cv2.putText(overlay, label, (cx - tw//2, cy), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255,255,255), thickness)
    
    # Blend overlay with original
    result = cv2.addWeighted(overlay_layer, 0.3, overlay, 0.7, 0)
    
    # Save detection result
    output_dir = f"uploads/{session_id}"
    os.makedirs(output_dir, exist_ok=True)
    detect_path = f"{output_dir}/detected.png"
    cv2.imwrite(detect_path, cv2.cvtColor(result, cv2.COLOR_RGB2BGR))
    
    # Save region mask for adjacency detection
    np.save(f"{output_dir}/region_mask.npy", region_mask)
    
    return {
        "regions": regions,
        "total_regions": len(regions),
        "image_size": [w, h],
        "detected_image_url": f"/uploads/{session_id}/detected.png",
        "edges_image_url": None,
    }


def build_adjacency_graph(session_id: str, regions: List[Dict]) -> Dict[str, Any]:
    """
    Build adjacency graph by checking shared boundaries between regions.
    Two regions are adjacent if they share a border (dilate each region mask and check overlap).
    """
    mask_path = f"uploads/{session_id}/region_mask.npy"
    
    if not os.path.exists(mask_path):
        raise ValueError("Region mask not found. Run detection first.")
    
    region_mask = np.load(mask_path)
    n = len(regions)
    
    # Build adjacency using morphological dilation
    adjacency = set()
    kernel = np.ones((5, 5), np.uint8)
    
    region_masks_cache = {}
    for region in regions:
        rid = region["id"]
        mask = (region_mask == rid).astype(np.uint8)
        dilated = cv2.dilate(mask, kernel, iterations=3)
        region_masks_cache[rid] = dilated
    
    for i in range(n):
        for j in range(i + 1, n):
            r1 = regions[i]["id"]
            r2 = regions[j]["id"]
            
            # Check if dilated masks overlap
            overlap = cv2.bitwise_and(region_masks_cache[r1], region_masks_cache[r2])
            if np.sum(overlap) > 0:
                pair = tuple(sorted([r1, r2]))
                adjacency.add(pair)
    
    # Build graph nodes and edges
    nodes = []
    for region in regions:
        degree = sum(1 for (a, b) in adjacency if a == region["id"] or b == region["id"])
        nodes.append({
            "id": str(region["id"]),
            "label": region["label"],
            "area": region["area"],
            "centroid": region["centroid"],
            "degree": degree,
            "color": None
        })
    
    edges = []
    for (r1, r2) in adjacency:
        edges.append({
            "id": f"e{r1}-{r2}",
            "source": str(r1),
            "target": str(r2),
        })
    
    return {
        "nodes": nodes,
        "edges": edges,
        "total_edges": len(edges),
        "adjacency_list": list(adjacency),
        "chromatic_lower_bound": compute_chromatic_lower_bound(nodes, edges)
    }


def compute_chromatic_lower_bound(nodes, edges):
    """Estimate lower bound for chromatic number using max clique heuristic"""
    # Simple: find max degree + 1 as rough upper bound
    if not nodes:
        return 1
    max_deg = max(n["degree"] for n in nodes)
    return min(max_deg, 4)  # Practical lower bound
