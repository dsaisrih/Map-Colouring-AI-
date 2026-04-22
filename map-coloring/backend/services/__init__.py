from .detection_service import detect_regions, build_adjacency_graph
from .coloring_service import (
    backtrack_color, greedy_color, random_color,
    monte_carlo_simulation, compare_algorithms,
    build_adj_list, is_valid_coloring
)
from .render_service import render_colored_map
