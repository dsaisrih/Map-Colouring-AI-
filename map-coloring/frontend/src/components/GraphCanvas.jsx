import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

const COLORS_LIGHT = [
  '#ef4444', '#10b981', '#4c6ef5', '#f59e0b',
  '#8b5cf6', '#f97316', '#06b6d4', '#ec4899',
  '#14b8a6', '#6366f1', '#ea580c', '#84cc16',
]

const COLORS_DARK = [
  '#f87171', '#34d399', '#748ffc', '#fbbf24',
  '#a78bfa', '#fb923c', '#22d3ee', '#f472b6',
  '#2dd4bf', '#818cf8', '#fb923c', '#a3e635',
]

function forceLayout(nodes, edges, width = 600, height = 440) {
  if (!nodes.length) return {}
  
  const positions = {}
  const n = nodes.length
  const cx = width / 2
  const cy = height / 2
  const r = Math.min(width, height) * 0.35

  // Start with circular layout
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    positions[node.id] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  })

  // Simple force iterations
  for (let iter = 0; iter < 80; iter++) {
    // Repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = positions[nodes[i].id]
        const b = positions[nodes[j].id]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const force = 2000 / (dist * dist)
        a.x -= force * dx / dist
        a.y -= force * dy / dist
        b.x += force * dx / dist
        b.y += force * dy / dist
      }
    }
    // Attraction (edges)
    for (const e of edges) {
      const a = positions[e.source]
      const b = positions[e.target]
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = dist * 0.01
      a.x += force * dx / dist
      a.y += force * dy / dist
      b.x -= force * dx / dist
      b.y -= force * dy / dist
    }
    // Center gravity
    nodes.forEach(node => {
      const p = positions[node.id]
      p.x += (cx - p.x) * 0.01
      p.y += (cy - p.y) * 0.01
    })
    // Boundary clamp
    nodes.forEach(node => {
      const p = positions[node.id]
      p.x = Math.max(40, Math.min(width - 40, p.x))
      p.y = Math.max(40, Math.min(height - 40, p.y))
    })
  }

  return positions
}

export default function GraphCanvas({ nodes = [], edges = [], coloring = null }) {
  const { isDark } = useTheme()
  const W = 600
  const H = 440
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT

  const positions = useMemo(() => forceLayout(nodes, edges, W, H), [nodes.length, edges.length])

  if (!nodes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted text-sm">
        <div className="text-center">
          <div className="text-3xl mb-2">🗺️</div>
          <div>No graph data available</div>
        </div>
      </div>
    )
  }

  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const edgeColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const violationColor = isDark ? '#f87171' : '#ef4444'

  return (
    <div className={`w-full h-full relative rounded-xl overflow-hidden ${isDark ? 'bg-surface-900' : 'bg-surface-50'}`}>
      {/* Subtle dot grid */}
      <svg width="100%" height="100%" className="absolute inset-0 opacity-40">
        <defs>
          <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1" fill={gridColor} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full relative z-10">
        <defs>
          <filter id="nodeShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const src = positions[edge.source]
          const tgt = positions[edge.target]
          if (!src || !tgt) return null
          const isViolation = coloring && coloring[edge.source] === coloring[edge.target]
          return (
            <motion.line
              key={edge.id || i}
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={isViolation ? violationColor : edgeColor}
              strokeWidth={isViolation ? 2.5 : 1.5}
              strokeDasharray={isViolation ? '6 3' : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = positions[node.id]
          if (!pos) return null
          const nodeColor = coloring !== null
            ? COLORS[coloring[node.id] % COLORS.length] || '#888'
            : isDark ? '#748ffc' : '#4c6ef5'
          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring' }}
              filter="url(#nodeShadow)"
            >
              <circle
                cx={pos.x} cy={pos.y} r={20}
                fill={nodeColor + '22'}
                stroke={nodeColor}
                strokeWidth={2.5}
              />
              <circle
                cx={pos.x} cy={pos.y} r={8}
                fill={nodeColor}
                opacity={0.8}
              />
              <text
                x={pos.x} y={pos.y - 26}
                textAnchor="middle"
                fill={isDark ? '#e5e7eb' : '#374151'}
                fontSize="10"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
              >
                {node.label}
              </text>
            </motion.g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className={`absolute bottom-3 left-3 text-xs flex items-center gap-4 px-3 py-1.5 rounded-lg
        ${isDark ? 'bg-surface-800/80 text-gray-400' : 'bg-white/80 text-gray-500 shadow-sm'}`}>
        <span className="flex items-center gap-1.5">
          <span className={`w-5 h-px ${isDark ? 'bg-gray-500' : 'bg-gray-300'}`} /> edge
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full ${isDark ? 'bg-brand-400' : 'bg-brand-500'}`} /> node
        </span>
        <span className="font-medium">{nodes.length} nodes · {edges.length} edges</span>
      </div>
    </div>
  )
}
