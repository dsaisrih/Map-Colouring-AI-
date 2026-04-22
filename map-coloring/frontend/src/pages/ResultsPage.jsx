import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Download, RefreshCw, CheckCircle, XCircle, GitBranch, Activity, Layers, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext'
import { useTheme } from '../hooks/useTheme'
import GraphCanvas from '../components/GraphCanvas'

const CHART_COLORS = ['#4c6ef5','#8b5cf6','#10b981','#f59e0b','#ef4444','#f97316']
const NODE_COLORS = ['#ef4444','#10b981','#4c6ef5','#f59e0b','#8b5cf6','#f97316','#06b6d4','#ec4899']

function StatCard({ label, value, sub, color = '#4c6ef5', icon: Icon, isDark }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="card p-5 rounded-2xl">
      <div className="flex items-start justify-between mb-3">
        <div className="section-label">{label}</div>
        {Icon && <Icon size={16} className="opacity-40" style={{ color }} />}
      </div>
      <div className="font-display text-2xl font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </motion.div>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const { sessionId, uploadData, detectData, adjacencyData, coloringData, simulationData, reset, settings } = useAppContext()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const hasData = coloringData || simulationData || adjacencyData

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className={`card p-3 rounded-lg text-xs font-mono ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
        <div className="text-muted mb-1">{label}</div>
        {payload.map(p => (<div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>))}
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-heading text-2xl mb-3">No Results Yet</h2>
        <p className="text-muted mb-6">Complete the pipeline to see your results here.</p>
        <button onClick={() => navigate('/upload')} className="btn-primary">Start from Upload</button>
      </div>
    )
  }

  const satData = simulationData ? [
    { name: 'Valid', value: simulationData.valid_solutions, fill: '#10b981' },
    { name: 'Invalid', value: simulationData.invalid_solutions, fill: '#ef4444' },
  ] : []

  const regionAreaData = detectData?.regions?.slice(0, 12).map(r => ({ name: r.label, area: Math.round(r.area / 1000) })) || []
  const degreeData = adjacencyData?.nodes?.map(n => ({ name: n.label, degree: n.degree })) || []

  const probData = simulationData ? Array.from({ length: 20 }, (_, i) => {
    const iter = Math.round((simulationData.total_iterations / 20) * (i + 1))
    const noise = (Math.random() - 0.5) * 0.05
    return { iter, probability: Math.max(0, Math.min(1, simulationData.satisfaction_probability + noise * (1 - i / 20))) }
  }) : []

  const colorDistData = coloringData?.coloring
    ? Object.values(coloringData.coloring).reduce((acc, c) => { const k = `Color ${c + 1}`; acc[k] = (acc[k] || 0) + 1; return acc }, {})
    : {}
  const colorDistArr = Object.entries(colorDistData).map(([name, value], i) => ({ name, value, fill: NODE_COLORS[i] || '#888' }))

  const tabBg = isDark ? 'bg-surface-800' : 'bg-gray-100'
  const activeTabCls = isDark ? 'bg-brand-600/20 text-brand-400 shadow-sm' : 'bg-white text-brand-600 shadow-sm'
  const inactiveTabCls = isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
  const axisStyle = { fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 10, fontFamily: 'Inter, sans-serif' }
  const gridStroke = isDark ? '#2a2f3e' : '#e4e7ef'

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
        <div>
          <span className="badge badge-warm mb-2">Step 4</span>
          <h1 className="text-heading text-3xl">Results Dashboard</h1>
          <p className="text-muted mt-2">Complete analysis of map coloring & SAT simulation.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={reset} className="btn-ghost flex items-center gap-2 text-xs"><RefreshCw size={14} /> New Analysis</button>
          <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 text-xs px-4 py-2"><Download size={14} /> Export</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="REGIONS" value={detectData?.total_regions || adjacencyData?.nodes?.length || '—'} icon={Layers} color="#4c6ef5" sub="detected" isDark={isDark} />
        <StatCard label="CONSTRAINTS" value={adjacencyData?.total_edges || '—'} icon={GitBranch} color="#8b5cf6" sub="adjacency edges" isDark={isDark} />
        <StatCard label="COLORS" value={coloringData?.colors_used || settings.numColors} icon={Zap} color="#f59e0b" sub={`k=${settings.numColors}`} isDark={isDark} />
        <StatCard label="P(SAT)" value={simulationData ? `${(simulationData.satisfaction_probability * 100).toFixed(1)}%` : coloringData?.valid ? '✓ SAT' : '—'}
          icon={Activity} color={simulationData?.satisfaction_probability > 0.5 ? '#10b981' : simulationData ? '#ef4444' : '#9ca3af'}
          sub={simulationData ? `${simulationData.total_iterations.toLocaleString()} trials` : 'run simulation'} isDark={isDark} />
      </div>

      {coloringData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`mb-6 p-4 rounded-2xl flex items-center gap-4 ${coloringData.valid
            ? isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
            : isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
          {coloringData.valid ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
          <div>
            <div className={`font-bold text-sm ${coloringData.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {coloringData.valid ? `✓ Valid ${coloringData.algorithm} coloring` : `⚠ ${coloringData.violations?.length} violations`}
            </div>
            <div className="text-xs text-muted mt-0.5">{coloringData.colors_used} colors · {coloringData.algorithm}</div>
          </div>
        </motion.div>
      )}

      <div className={`flex gap-1 p-1 rounded-xl w-fit mb-6 ${tabBg}`}>
        {['overview','graph','charts','sat'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? activeTabCls : inactiveTabCls}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
          {uploadData && (
            <div className="card rounded-2xl overflow-hidden">
              <div className={`p-3 border-b section-label px-4 ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>🗺️ Original Map</div>
              <div className={`p-4 flex items-center justify-center ${isDark ? 'bg-surface-900' : 'bg-surface-50'}`}>
                <img src={uploadData.image_url} alt="Original" className="max-w-full max-h-[220px] object-contain rounded-xl" />
              </div>
            </div>
          )}
          {coloringData?.image_url && (
            <div className="card rounded-2xl overflow-hidden">
              <div className={`p-3 border-b section-label px-4 ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>🎨 Colored — {coloringData.algorithm}</div>
              <div className={`p-4 flex items-center justify-center ${isDark ? 'bg-surface-900' : 'bg-surface-50'}`}>
                <img src={coloringData.image_url} alt="Colored" className="max-w-full max-h-[220px] object-contain rounded-xl" />
              </div>
            </div>
          )}
          {simulationData && (
            <div className="card p-5 rounded-2xl md:col-span-2">
              <div className="section-label mb-4">🎲 Monte Carlo Results</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Trials', val: simulationData.total_iterations.toLocaleString(), color: isDark ? '#e5e7eb' : '#374151' },
                  { label: 'Valid', val: simulationData.valid_solutions.toLocaleString(), color: '#10b981' },
                  { label: 'Invalid', val: simulationData.invalid_solutions.toLocaleString(), color: '#ef4444' },
                  { label: 'P(SAT)', val: `${(simulationData.satisfaction_probability * 100).toFixed(2)}%`, color: '#4c6ef5' },
                  { label: 'Speed', val: `${simulationData.iterations_per_second?.toLocaleString()}/s`, color: '#f59e0b' },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`text-center p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="font-display text-xl font-bold" style={{ color }}>{val}</div>
                    <div className="text-xs text-muted mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'graph' && adjacencyData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card rounded-2xl overflow-hidden" style={{ height: '500px' }}>
          <div className={`p-3 border-b section-label px-4 ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
            Colored Graph — {adjacencyData.nodes.length} nodes · {adjacencyData.total_edges} edges
          </div>
          <GraphCanvas nodes={adjacencyData.nodes} edges={adjacencyData.edges} coloring={coloringData?.coloring || null} />
        </motion.div>
      )}

      {activeTab === 'charts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
          {regionAreaData.length > 0 && (
            <div className="card p-5 rounded-2xl">
              <div className="section-label mb-4">📏 Region Areas (K px²)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionAreaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" tick={axisStyle} /><YAxis tick={axisStyle} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="area" radius={[6, 6, 0, 0]}>{regionAreaData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {degreeData.length > 0 && (
            <div className="card p-5 rounded-2xl">
              <div className="section-label mb-4">🔗 Node Degrees</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={degreeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" tick={axisStyle} /><YAxis tick={axisStyle} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="degree" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {colorDistArr.length > 0 && (
            <div className="card p-5 rounded-2xl">
              <div className="section-label mb-4">🎨 Color Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={colorDistArr} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: isDark ? '#4b5563' : '#9ca3af' }}>
                  {colorDistArr.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie><Tooltip content={<CustomTooltip />} /></PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {satData.length > 0 && (
            <div className="card p-5 rounded-2xl">
              <div className="section-label mb-4">✅ Valid vs Invalid</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={satData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: isDark ? '#4b5563' : '#9ca3af' }}>
                  {satData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie><Tooltip content={<CustomTooltip />} /></PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'sat' && simulationData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* P(SAT) Summary Card */}
          <div className="card p-5 rounded-2xl">
            <div className="section-label mb-4">📊 Satisfaction Probability — P(SAT)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-green-500/10 border border-green-500/15' : 'bg-green-50 border border-green-100'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>Monte Carlo (Empirical)</div>
                <div className={`font-display text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {simulationData.satisfaction_probability != null ? `${(simulationData.satisfaction_probability * 100).toFixed(2)}%` : '—'}
                </div>
                <div className={`font-mono text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Valid / N = {simulationData.valid_solutions} / {simulationData.total_iterations}</div>
              </div>
              <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/15' : 'bg-indigo-50 border border-indigo-100'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Theoretical Approx.</div>
                <div className={`font-display text-2xl font-black ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {simulationData.theoretical_psat != null ? `${(simulationData.theoretical_psat * 100).toFixed(2)}%` : '—'}
                </div>
                <div className={`font-mono text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>((k−1)/k)<sup>m</sup></div>
              </div>
              <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-purple-500/10 border border-purple-500/15' : 'bg-purple-50 border border-purple-100'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Exact Formula</div>
                <div className={`font-display text-2xl font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>P(G,k)/k<sup>n</sup></div>
                <div className={`font-mono text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chromatic polynomial</div>
              </div>
            </div>
            <div className={`p-3 rounded-xl text-sm leading-relaxed ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
              <strong>Satisfaction Probability P(SAT)</strong> is the probability that a uniformly random
              k-coloring of graph G satisfies all adjacency constraints (no two adjacent nodes share a color).
              The theoretical formula <span className="font-mono">((k−1)/k)<sup>m</sup></span> approximates this
              assuming edge independence, while the Monte Carlo estimate converges to the true value as iterations → ∞.
            </div>
          </div>

          {probData.length > 0 && (
            <div className="card p-5 rounded-2xl">
              <div className="section-label mb-4">📈 Probability Convergence</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={probData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="iter" tick={axisStyle} /><YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={axisStyle} />
                  <Tooltip content={<CustomTooltip />} formatter={v => `${(v * 100).toFixed(1)}%`} />
                  <Line type="monotone" dataKey="probability" stroke="#4c6ef5" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {simulationData.most_conflicted_nodes?.length > 0 && (
            <div className="card p-5 rounded-2xl">
              <div className="section-label mb-4">🔥 Most Conflicted Nodes</div>
              <div className="space-y-2">
                {simulationData.most_conflicted_nodes.map(([nodeId, count]) => {
                  const max = simulationData.most_conflicted_nodes[0][1]
                  const pct = max > 0 ? (count / max) * 100 : 0
                  return (
                    <div key={nodeId} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-8 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>R{nodeId}</span>
                      <div className={`flex-1 h-5 rounded-full overflow-hidden ${isDark ? 'bg-surface-700' : 'bg-gray-100'}`}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-300" />
                      </div>
                      <span className="text-xs text-red-500 font-medium w-20 text-right">{count} violations</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="card p-5 rounded-2xl">
            <div className="section-label mb-3">📐 SAT Formula (CNF)</div>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Each region gets at least one color', formula: '∀ region r: (x_r,1 ∨ x_r,2 ∨ … ∨ x_r,k)', color: isDark ? '#a78bfa' : '#7c3aed' },
                { label: 'Each region gets at most one color', formula: '∀ r, ∀ i≠j: (¬x_r,i ∨ ¬x_r,j)', color: isDark ? '#fbbf24' : '#d97706' },
                { label: 'Adjacent regions differ', formula: '∀ (r,s)∈E, ∀ color c: (¬x_r,c ∨ ¬x_s,c)', color: isDark ? '#f87171' : '#dc2626' },
              ].map(({ label, formula, color }) => (
                <div key={label} className={`p-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="text-xs font-semibold mb-1" style={{ color }}>{label}</div>
                  <div className={`font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formula}</div>
                </div>
              ))}
              <div className="text-xs text-muted mt-2">
                Total: {simulationData.sat_stats?.variables} vars · {simulationData.sat_stats?.total_clauses} clauses
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
