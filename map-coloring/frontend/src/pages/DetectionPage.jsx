import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Search, GitBranch, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'
import { api } from '../services/api'
import { useAppContext } from '../hooks/useAppContext'
import { useTheme } from '../hooks/useTheme'
import GraphCanvas from '../components/GraphCanvas'

export default function DetectionPage() {
  const navigate = useNavigate()
  const { sessionId, uploadData, detectData, setDetectData, adjacencyData, setAdjacencyData, settings, setSettings } = useAppContext()
  const { isDark } = useTheme()
  const [detecting, setDetecting] = useState(false)
  const [buildingGraph, setBuildingGraph] = useState(false)
  const [activeTab, setActiveTab] = useState('original')

  async function runDetection() {
    if (!sessionId) return toast.error('Upload an image first')
    setDetecting(true)
    try {
      const data = await api.detect(sessionId, settings.sensitivity)
      setDetectData(data); setAdjacencyData(null)
      toast.success(`Found ${data.total_regions} regions! 🎯`); setActiveTab('detected')
    } catch (e) { toast.error(e.response?.data?.detail || 'Detection failed') }
    finally { setDetecting(false) }
  }

  async function buildAdjacency() {
    if (!detectData) return toast.error('Run detection first')
    setBuildingGraph(true)
    try {
      const data = await api.adjacency(sessionId)
      setAdjacencyData(data); toast.success(`Graph built: ${data.total_edges} adjacencies! 🕸️`); setActiveTab('graph')
    } catch (e) { toast.error(e.response?.data?.detail || 'Graph construction failed') }
    finally { setBuildingGraph(false) }
  }

  const tabBg = isDark ? 'bg-surface-800' : 'bg-gray-100'
  const activeTabCls = isDark ? 'bg-brand-600/20 text-brand-400 shadow-sm' : 'bg-white text-brand-600 shadow-sm'
  const inactiveTabCls = isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
  const disabledTabCls = isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
  const disabledBtn = isDark ? 'bg-surface-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <span className="badge badge-brand mb-2">Step 2</span>
        <h1 className="text-heading text-3xl">Region Detection & Graph</h1>
        <p className="text-muted mt-2">AI detects enclosed regions and builds an adjacency constraint graph.</p>
      </motion.div>

      {!sessionId && (
        <div className="card p-5 rounded-2xl flex items-center gap-4">
          <AlertCircle size={20} className={isDark ? 'text-red-400' : 'text-red-500'} />
          <div>
            <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>No image uploaded</div>
            <div className="text-xs text-muted">Go to Upload first</div>
          </div>
          <button onClick={() => navigate('/upload')} className="btn-secondary ml-auto text-xs px-4 py-2">Upload</button>
        </div>
      )}

      {sessionId && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-5 rounded-2xl">
              <div className="section-label mb-4">🎛️ Detection Settings</div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-muted">Edge Sensitivity</label>
                <span className={`text-sm font-bold font-mono ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{settings.sensitivity.toFixed(2)}</span>
              </div>
              <input type="range" min="0.1" max="0.9" step="0.05" value={settings.sensitivity}
                onChange={e => setSettings(s => ({ ...s, sensitivity: parseFloat(e.target.value) }))} className="w-full" />
              <div className="flex justify-between text-xs text-muted mt-1"><span>Fine</span><span>Coarse</span></div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runDetection} disabled={detecting}
                className={`mt-4 w-full py-3 rounded-xl font-display text-sm font-bold flex items-center justify-center gap-2 transition-all ${detecting ? disabledBtn : 'btn-primary'}`}>
                {detecting ? (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full" />Detecting…</>) : (<><Search size={16} /> Run Detection</>)}
              </motion.button>
            </motion.div>

            {detectData && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 rounded-2xl">
                <div className="section-label mb-3">🕸️ Adjacency Graph</div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-muted">Regions</span><span className={`font-bold ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{detectData.total_regions}</span></div>
                  {adjacencyData && (<>
                    <div className="flex justify-between text-sm"><span className="text-muted">Edges</span><span className="font-bold text-amber-500">{adjacencyData.total_edges}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted">Min colors</span><span className="font-bold text-green-500">{adjacencyData.chromatic_lower_bound}</span></div>
                  </>)}
                </div>
                <motion.button whileHover={{ scale: 1.02 }} onClick={buildAdjacency} disabled={buildingGraph}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${buildingGraph ? disabledBtn : 'btn-secondary'}`}>
                  {buildingGraph ? (<><RefreshCw size={14} className="animate-spin" /> Building…</>) : (<><GitBranch size={14} /> Build Graph</>)}
                </motion.button>
                {adjacencyData && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.02 }} onClick={() => navigate('/simulate')}
                    className="btn-success w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-xs">
                    Proceed to Simulate <ArrowRight size={14} />
                  </motion.button>
                )}
              </motion.div>
            )}

            {detectData?.regions && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4 rounded-2xl">
                <div className="section-label mb-3">📋 Regions ({detectData.regions.length})</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {detectData.regions.map(r => (
                    <div key={r.id} className={`flex items-center justify-between py-2 px-3 rounded-xl text-sm ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <span className={`font-medium ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{r.label}</span>
                      <span className="text-muted text-xs">{(r.area / 1000).toFixed(1)}k px²</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className={`flex gap-1 p-1 rounded-xl w-fit ${tabBg}`}>
              {[{ key: 'original', label: 'Original' }, { key: 'detected', label: 'Detected', disabled: !detectData }, { key: 'graph', label: 'Graph', disabled: !adjacencyData }].map(tab => (
                <button key={tab.key} onClick={() => !tab.disabled && setActiveTab(tab.key)} disabled={tab.disabled}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key ? activeTabCls : tab.disabled ? disabledTabCls : inactiveTabCls}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {activeTab === 'graph' && adjacencyData ? (
                <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card rounded-2xl overflow-hidden" style={{ height: '480px' }}>
                  <GraphCanvas nodes={adjacencyData.nodes} edges={adjacencyData.edges} />
                </motion.div>
              ) : (
                <motion.div key="img" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card rounded-2xl overflow-hidden flex items-center justify-center" style={{ minHeight: '480px' }}>
                  {uploadData ? (
                    <img src={activeTab === 'detected' && detectData?.detected_image_url ? detectData.detected_image_url : uploadData.image_url} alt="Map" className="max-w-full max-h-[460px] object-contain p-4" />
                  ) : (
                    <div className="text-muted text-sm text-center"><div className="text-3xl mb-2">🗺️</div>No image loaded</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
