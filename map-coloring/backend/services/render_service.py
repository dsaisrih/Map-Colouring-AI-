"""
Render colored maps as images
"""
import cv2
import numpy as np
import os
from typing import Dict, List, Any

# Color palette (beautiful, distinct colors for map coloring)
COLOR_PALETTES = {
    3: [(231, 76, 60), (46, 204, 113), (52, 152, 219)],
    4: [(231, 76, 60), (46, 204, 113), (52, 152, 219), (241, 196, 15)],
    5: [(231, 76, 60), (46, 204, 113), (52, 152, 219), (241, 196, 15), (155, 89, 182)],
    6: [(231, 76, 60), (46, 204, 113), (52, 152, 219), (241, 196, 15), (155, 89, 182), (230, 126, 34)],
}

def get_color_palette(num_colors: int):
    if num_colors in COLOR_PALETTES:
        return COLOR_PALETTES[num_colors]
    # Generate additional colors
    base = COLOR_PALETTES.get(min(num_colors, 6), COLOR_PALETTES[4])
    extra = []
    for i in range(num_colors - len(base)):
        hue = int((i / num_colors) * 180)
        color = cv2.cvtColor(np.uint8([[[hue, 200, 200]]]), cv2.COLOR_HSV2RGB)[0][0]
        extra.append(tuple(int(c) for c in color))
    return base + extra


def render_colored_map(
    session_id: str,
    image_path: str,
    coloring: Dict[str, int],
    regions: List[Dict],
    num_colors: int,
    algorithm: str = "backtracking"
) -> str:
    """
    Render the map with assigned colors on top of original image.
    Returns path to rendered image.
    """
    # Load original image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot load image: {image_path}")
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = img.shape[:2]
    
    # Load region mask
    mask_path = f"uploads/{session_id}/region_mask.npy"
    if not os.path.exists(mask_path):
        return None
    
    region_mask = np.load(mask_path)
    palette = get_color_palette(max(num_colors, max(coloring.values(), default=0) + 1))
    
    # Create colored overlay
    colored = np.zeros((h, w, 3), dtype=np.uint8)
    
    for region in regions:
        rid = str(region["id"])
        if rid in coloring:
            color_idx = coloring[rid]
            color = palette[color_idx % len(palette)]
            mask = (region_mask == region["id"])
            colored[mask] = color
    
    # Blend with original image (semi-transparent coloring)
    img_float = img_rgb.astype(float)
    colored_float = colored.astype(float)
    
    # Where we have color assignments, blend; elsewhere keep original
    has_color = (np.sum(colored, axis=2) > 0)
    alpha = 0.65  # Color opacity
    
    result = img_float.copy()
    result[has_color] = img_float[has_color] * (1 - alpha) + colored_float[has_color] * alpha
    result = result.astype(np.uint8)
    
    # Draw region boundaries
    for region in regions:
        if "contour_points" in region and region["contour_points"]:
            pts = np.array(region["contour_points"], dtype=np.int32).reshape((-1, 1, 2))
            cv2.polylines(result, [pts], True, (30, 30, 30), 2)
    
    # Draw labels and centroids
    for region in regions:
        cx, cy = int(region["centroid"][0]), int(region["centroid"][1])
        label = region["label"]
        
        # Background pill for label
        font = cv2.FONT_HERSHEY_SIMPLEX
        scale, thick = 0.55, 2
        (tw, th), _ = cv2.getTextSize(label, font, scale, thick)
        pad = 5
        cv2.rectangle(result, (cx - tw//2 - pad, cy - th - pad), (cx + tw//2 + pad, cy + pad), (20, 20, 20), -1)
        cv2.rectangle(result, (cx - tw//2 - pad, cy - th - pad), (cx + tw//2 + pad, cy + pad), (200, 200, 200), 1)
        cv2.putText(result, label, (cx - tw//2, cy), font, scale, (255, 255, 255), thick)
    
    # Add legend
    result = add_legend(result, num_colors, palette, algorithm, coloring)
    
    # Save
    output_path = f"uploads/{session_id}/colored_{algorithm}.png"
    cv2.imwrite(output_path, cv2.cvtColor(result, cv2.COLOR_RGB2BGR))
    
    return f"/uploads/{session_id}/colored_{algorithm}.png"


def add_legend(img: np.ndarray, num_colors: int, palette: list, algorithm: str, coloring: Dict) -> np.ndarray:
    """Add a legend showing color assignments"""
    h, w = img.shape[:2]
    legend_w = 180
    legend_h = 40 + num_colors * 30 + 20
    
    # Create legend background
    legend_x = w - legend_w - 10
    legend_y = 10
    
    # Draw semi-transparent background
    overlay = img.copy()
    cv2.rectangle(overlay, (legend_x - 5, legend_y - 5), 
                  (legend_x + legend_w, legend_y + legend_h), (20, 20, 30), -1)
    img = cv2.addWeighted(overlay, 0.85, img, 0.15, 0)
    cv2.rectangle(img, (legend_x - 5, legend_y - 5), 
                  (legend_x + legend_w, legend_y + legend_h), (100, 100, 120), 1)
    
    # Title
    cv2.putText(img, f"Algorithm: {algorithm[:8]}", (legend_x, legend_y + 20), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 220), 1)
    
    # Color swatches
    for i in range(num_colors):
        color = palette[i % len(palette)]
        y = legend_y + 40 + i * 30
        cv2.rectangle(img, (legend_x, y), (legend_x + 20, y + 20), color, -1)
        cv2.rectangle(img, (legend_x, y), (legend_x + 20, y + 20), (200, 200, 200), 1)
        cv2.putText(img, f"Color {i+1}", (legend_x + 28, y + 15), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)
    
    return img
