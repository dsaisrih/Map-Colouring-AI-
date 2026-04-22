import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Play, Zap, GitBranch, Shuffle, ArrowRight, AlertCircle, BarChart2, Info, ChevronDown, BookOpen } from 'lucide-react'
import { api } from '../services/api'
import { useAppContext } from '../hooks/useAppContext'
import { useTheme } from '../hooks/useTheme'
import GraphCanvas from '../components/GraphCanvas'

const ALGORITHMS = [
  { id: 'backtracking', label: 'Backtracking', icon: GitBranch, desc: 'Exact DFS with constraint propagation.', emoji: '🧩' },
  { id: 'greedy', label: 'Greedy (Welsh-Powell)', icon: Zap, desc: 'Fast heuristic by degree ordering.', emoji: '⚡' },
  { id: 'random', label: 'Random', icon: Shuffle, desc: 'Random assignment for Monte Carlo.', emoji: '🎲' },
]

export default function SimulationPage() {
  const navigate = useNavigate()
  const { sessionId, adjacencyData, coloringData, setColoringData, simulationData, setSimulationData, settings, setSettings } = useAppContext()
  const { isDark } = useTheme()
  const [running, setRunning] = useState(false)
  const [simRunning, setSimRunning] = useState(false)
  const [compareData, setCompareData] = useState(null)
  const [progress, setProgress] = useState(0)
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  const disabledBtn = isDark ? 'bg-surface-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
  const palette = ['#ef4444','#10b981','#4c6ef5','#f59e0b','#8b5cf6','#f97316','#06b6d4','#ec4899']

  async function runColoring() {
    if (!sessionId || !adjacencyData) return toast.error('Build graph first')
    setRunning(true); setProgress(0)
    const iv = setInterval(() => setProgress(p => Math.min(p + 15, 90)), 200)
    try {
      const data = await api.color(sessionId, settings.numColors, settings.algorithm)
      setColoringData(data); setProgress(100)
      const psatVal = data.satisfaction_probability != null ? `  ·  P(SAT) = ${(data.satisfaction_probability * 100).toFixed(1)}%` : ''
      toast.success(data.valid ? `Valid coloring found! ✅${psatVal}` : 'Coloring complete (violations found)')
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { clearInterval(iv); setRunning(false) }
  }

  async function runComparison() {
    if (!sessionId || !adjacencyData) return toast.error('Need graph first')
    setRunning(true)
    try {
      const data = await api.compare(sessionId, settings.numColors)
      setCompareData(data.comparison); toast.success('Comparison complete! 📊')
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setRunning(false) }
  }

  async function runSimulation() {
    if (!sessionId || !adjacencyData) return toast.error('Need graph first')
    setSimRunning(true); setProgress(0)
    const iv = setInterval(() => setProgress(p => Math.min(p + 5, 95)), 100)
    try {
      const data = await api.simulate(sessionId, settings.numColors, settings.iterations)
      setSimulationData(data); setProgress(100)
      const psat = data.satisfaction_probability != null ? (data.satisfaction_probability * 100).toFixed(1) : '?'
      toast.success(`P(SAT) = ${psat}% 🎯`)
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { clearInterval(iv); setSimRunning(false) }
  }

  // Helper to safely format P(SAT) values
  const formatPsat = (val) => {
    if (val == null || isNaN(val)) return '—'
    return `${(val * 100).toFixed(1)}%`
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <span className="badge badge-brand mb-2">Step 3</span>
        <h1 className="text-heading text-3xl">Configure & Simulate</h1>
        <p className="text-muted mt-2">Select algorithm, set parameters, and run the SAT simulation.</p>
      </motion.div>

      {!adjacencyData && (
        <div className="card p-5 rounded-2xl flex items-center gap-4 mb-6">
          <AlertCircle className="text-amber-500" size={20} />
          <div className="text-sm text-muted">Build the adjacency graph first in the Detect step.</div>
          <button onClick={() => navigate('/detect')} className="btn-secondary ml-auto text-xs px-4 py-2">Go to Detect</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {/* Color count */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-5 rounded-2xl">
            <div className="section-label mb-4">🎨 Color Settings</div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-muted">Number of Colors (k)</label>
                <span className={`text-lg font-bold ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{settings.numColors}</span>
              </div>
              <input type="range" min={2} max={8} step={1} value={settings.numColors}
                onChange={e => setSettings(s => ({ ...s, numColors: +e.target.value }))} className="w-full" />
              <div className="flex justify-between text-xs text-muted mt-1"><span>2</span><span>4 (4CT)</span><span>8</span></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: settings.numColors }).map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-lg shadow-sm border border-white/20" style={{ background: palette[i] }} title={`Color ${i + 1}`} />
              ))}
            </div>
          </motion.div>

          {/* Algorithm */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card p-5 rounded-2xl">
            <div className="section-label mb-3">⚙️ Algorithm</div>
            <div className="space-y-2">
              {ALGORITHMS.map(({ id, label, desc, emoji }) => {
                const sel = settings.algorithm === id
                return (
                  <button key={id} onClick={() => setSettings(s => ({ ...s, algorithm: id }))}
                    className={`w-full p-3 rounded-xl text-left transition-all ${sel
                      ? isDark ? 'bg-brand-600/15 border border-brand-500/30' : 'bg-brand-50 border border-brand-200'
                      : isDark ? 'bg-white/5 border border-transparent hover:border-white/10' : 'bg-gray-50 border border-transparent hover:border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{emoji}</span>
                      <span className={`text-sm font-bold ${sel ? (isDark ? 'text-brand-400' : 'text-brand-600') : (isDark ? 'text-white' : 'text-gray-900')}`}>{label}</span>
                      {sel && <span className="ml-auto badge badge-brand text-xs">selected</span>}
                    </div>
                    <div className="text-xs text-muted pl-7">{desc}</div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2 mt-3">
              <motion.button whileHover={{ scale: 1.02 }} onClick={runColoring} disabled={running || !adjacencyData}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${running || !adjacencyData ? disabledBtn : 'btn-primary'}`}>
                {running ? (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" />Running</>) : (<><Play size={14} />Color Map</>)}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} onClick={runComparison} disabled={running || !adjacencyData}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold ${running || !adjacencyData ? disabledBtn : 'btn-secondary'}`} title="Compare all">
                <BarChart2 size={14} />
              </motion.button>
            </div>

            {/* P(SAT) result after coloring */}
            {coloringData && coloringData.satisfaction_probability != null && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Theoretical P(SAT)</span>
                    <span className={`font-display text-lg font-black ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {formatPsat(coloringData.satisfaction_probability)}
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    Formula: ((k−1)/k)<sup>m</sup> with k={coloringData.graph_info?.colors || settings.numColors}, m={coloringData.graph_info?.edges || '?'}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Monte Carlo */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card p-5 rounded-2xl">
            <div className="section-label mb-4">🎲 Monte Carlo SAT</div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-muted">Iterations</label>
                <span className={`text-sm font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{settings.iterations.toLocaleString()}</span>
              </div>
              <input type="range" min={100} max={5000} step={100} value={settings.iterations}
                onChange={e => setSettings(s => ({ ...s, iterations: +e.target.value }))} className="w-full" />
              <div className="flex justify-between text-xs text-muted mt-1"><span>100</span><span>1K</span><span>5K</span></div>
            </div>
            {simRunning && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted mb-1"><span>Running…</span><span>{progress}%</span></div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-surface-700' : 'bg-gray-200'}`}>
                  <motion.div animate={{ width: `${progress}%` }} className="h-full progress-bar" />
                </div>
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runSimulation} disabled={simRunning || !adjacencyData}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${simRunning || !adjacencyData ? disabledBtn : 'btn-success'}`}>
              {simRunning ? (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Simulating…</>) : (<><Shuffle size={16} />Run Monte Carlo</>)}
            </motion.button>
            {simulationData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                <div className="section-label mb-2">Monte Carlo Result</div>
                <div className={`text-3xl font-display font-black text-center ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {formatPsat(simulationData.satisfaction_probability)}
                </div>
                <div className="text-center text-xs text-muted mt-1">P(SAT) empirical with k={settings.numColors}</div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-center"><div className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{simulationData.valid_solutions}</div><div className="text-xs text-muted">valid</div></div>
                  <div className="text-center"><div className={`font-bold ${isDark ? 'text-red-400' : 'text-red-500'}`}>{simulationData.invalid_solutions}</div><div className="text-xs text-muted">invalid</div></div>
                </div>

                {/* Theoretical vs Empirical comparison */}
                {simulationData.theoretical_psat != null && (
                  <div className={`mt-3 pt-3 border-t ${isDark ? 'border-green-500/15' : 'border-green-200'}`}>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Theoretical</div>
                        <div className={`font-display text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          {formatPsat(simulationData.theoretical_psat)}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">((k−1)/k)<sup>m</sup></div>
                      </div>
                      <div>
                        <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>Empirical</div>
                        <div className={`font-display text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          {formatPsat(simulationData.satisfaction_probability)}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">valid / total</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* More Info Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} className={isDark ? 'text-brand-400' : 'text-brand-600'} />
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>More Info — Satisfaction Probability</span>
              </div>
              <motion.div animate={{ rotate: showMoreInfo ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} className="text-muted" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showMoreInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className={`px-4 pb-4 space-y-4 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                    {/* Definition */}
                    <div className="pt-4">
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                        📖 Definition
                      </div>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Satisfaction Probability P(SAT)</strong> is the probability that a uniformly random
                        assignment of <em>k</em> colors to all graph nodes results in a <strong>proper coloring</strong> —
                        meaning no two adjacent nodes share the same color. It quantifies how "easy" or "hard"
                        a graph coloring instance is.
                      </p>
                    </div>

                    {/* Formula */}
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/15' : 'bg-indigo-50 border border-indigo-100'}`}>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        📐 Theoretical Formula
                      </div>
                      <div className={`font-mono text-sm text-center py-2 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        P(SAT) ≈ ((k − 1) / k)<sup>m</sup>
                      </div>
                      <div className={`text-xs leading-relaxed mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Where <strong>k</strong> = number of available colors,{' '}
                        <strong>m</strong> = number of edges (adjacency constraints).
                        This assumes each edge constraint is independent — for each edge (u,v),
                        the probability that color(u) ≠ color(v) is <span className="font-mono">(k−1)/k</span>.
                      </div>
                    </div>

                    {/* Monte Carlo */}
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-green-500/10 border border-green-500/15' : 'bg-green-50 border border-green-100'}`}>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        🎲 Monte Carlo (Empirical)
                      </div>
                      <div className={`font-mono text-sm text-center py-2 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                        P(SAT) = Valid Colorings / Total Iterations
                      </div>
                      <div className={`text-xs leading-relaxed mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Generates <em>N</em> random colorings and counts how many satisfy all constraints.
                        As N → ∞, this converges to the true probability. More iterations = higher accuracy.
                      </div>
                    </div>

                    {/* Exact formula */}
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/10 border border-purple-500/15' : 'bg-purple-50 border border-purple-100'}`}>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                        🔬 Exact Formula (Chromatic Polynomial)
                      </div>
                      <div className={`font-mono text-sm text-center py-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        P(SAT) = P(G, k) / k<sup>n</sup>
                      </div>
                      <div className={`text-xs leading-relaxed mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Where <strong>P(G, k)</strong> is the chromatic polynomial of graph G evaluated at k,
                        giving the exact number of proper k-colorings, and <strong>k<sup>n</sup></strong> is the
                        total number of possible assignments. Computing this is NP-hard in general.
                      </div>
                    </div>

                    {/* Interpretation */}
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        💡 Interpretation
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { range: 'P(SAT) > 80%', meaning: 'Easy — random coloring will likely satisfy all constraints.', color: '#10b981' },
                          { range: '30% < P(SAT) < 80%', meaning: 'Moderate — some effort needed; heuristics work well.', color: '#f59e0b' },
                          { range: 'P(SAT) < 30%', meaning: 'Hard — few valid colorings; need exact algorithms.', color: '#ef4444' },
                          { range: 'P(SAT) = 0%', meaning: 'Unsatisfiable with k colors (try more colors).', color: '#9ca3af' },
                        ].map(({ range, meaning, color }) => (
                          <div key={range} className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-mono font-bold" style={{ color }}>{range}</span>: {meaning}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Main view */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card rounded-2xl overflow-hidden" style={{ height: '320px' }}>
            <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
              <span className="section-label">Adjacency Graph {coloringData ? `— ${settings.algorithm}` : ''}</span>
              {coloringData && (
                <span className={`badge text-xs ${coloringData.valid ? 'badge-success' : 'badge-danger'}`}>
                  {coloringData.valid ? '✓ Valid' : `✗ ${coloringData.violations?.length} violations`}
                </span>
              )}
            </div>
            {adjacencyData ? (
              <GraphCanvas nodes={adjacencyData.nodes} edges={adjacencyData.edges} coloring={coloringData?.coloring || null} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm"><div className="text-center"><div className="text-2xl mb-2">🕸️</div>Build graph first</div></div>
            )}
          </div>

          {coloringData?.image_url && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card rounded-2xl overflow-hidden">
              <div className={`p-3 border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}><span className="section-label">🗺️ Colored Map Output</span></div>
              <div className="p-4 flex items-center justify-center">
                <img src={coloringData.image_url} alt="Colored Map" className="max-w-full max-h-[220px] object-contain rounded-xl" />
              </div>
            </motion.div>
          )}

          {compareData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-4 rounded-2xl">
              <div className="section-label mb-3">📊 Algorithm Comparison</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                      {['Algorithm','Valid','Colors','Time (ms)'].map(h => (<th key={h} className="text-left py-2 px-3 text-muted text-xs font-semibold">{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(compareData).map(([algo, res]) => (
                      <tr key={algo} className={`border-b ${isDark ? 'border-surface-700 hover:bg-white/5' : 'border-surface-200 hover:bg-gray-50'} transition-colors`}>
                        <td className={`py-2 px-3 font-medium capitalize ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{algo}</td>
                        <td className="py-2 px-3"><span className={`badge text-xs ${res.valid ? 'badge-success' : 'badge-danger'}`}>{res.valid ? '✓ Yes' : '✗ No'}</span></td>
                        <td className="py-2 px-3 font-medium text-amber-500">{res.colors_used}</td>
                        <td className={`py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{res.time_ms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {(coloringData || simulationData) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => navigate('/results')} className="btn-success w-full py-3 flex items-center justify-center gap-2 text-sm">
                View Full Results Dashboard <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
