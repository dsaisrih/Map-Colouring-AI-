import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'
import {
  Upload, Cpu, GitBranch, Activity, ChevronRight, Zap, Map, BarChart2,
  Palette, Sun, Moon, Sparkles, ArrowRight
} from 'lucide-react'

const FEATURES = [
  { icon: Cpu, title: 'AI Region Detection', desc: 'OpenCV + scikit-image pipeline automatically identifies enclosed map regions using edge detection and contour analysis.', emoji: '🔍' },
  { icon: GitBranch, title: 'Graph Construction', desc: 'Builds an adjacency graph from detected regions, identifying shared boundaries with morphological analysis.', emoji: '🌐' },
  { icon: Zap, title: '3 Coloring Algorithms', desc: 'Compare Backtracking, Greedy Welsh-Powell, and Random coloring — see which finds valid solutions fastest.', emoji: '⚡' },
  { icon: Activity, title: 'Monte Carlo Simulation', desc: 'Run thousands of random colorings to compute the probability of satisfying all constraints — real statistical AI.', emoji: '📊' },
]

const STEPS = [
  { n: '01', label: 'Upload Map', desc: 'Upload any PNG/JPG of a geographic or abstract map.', emoji: '📤' },
  { n: '02', label: 'Region Detection', desc: 'Edge detection + contour analysis segments enclosed regions.', emoji: '🔬' },
  { n: '03', label: 'Graph Construction', desc: 'Build an adjacency graph — nodes are regions, edges are shared borders.', emoji: '🕸️' },
  { n: '04', label: 'Apply Coloring', desc: 'Choose Backtracking, Greedy, or Random algorithm with k colors.', emoji: '🎨' },
  { n: '05', label: 'Monte Carlo SAT', desc: 'Run N iterations of random coloring, compute P(satisfiable).', emoji: '🎲' },
]

const APPS = [
  { icon: Map, title: 'Geopolitical Mapping', desc: 'Color world maps so no adjacent countries share a color — the classic 4-color theorem in action.', emoji: '🌍' },
  { icon: BarChart2, title: 'Resource Scheduling', desc: 'Assign time slots or resources where conflicting tasks need different allocations.', emoji: '📅' },
  { icon: GitBranch, title: 'Register Allocation', desc: 'Compilers use graph coloring to assign CPU registers to variables without conflicts.', emoji: '💻' },
]

const float = {
  animate: { y: [-8, 8, -8] },
  transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
}

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme()

  const gradientHero = isDark
    ? 'radial-gradient(ellipse at 50% 30%, rgba(76,110,245,0.12) 0%, transparent 60%)'
    : 'radial-gradient(ellipse at 50% 30%, rgba(76,110,245,0.08) 0%, transparent 60%)'

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-surface-900' : 'bg-surface-50'}`}>
      {/* Nav bar */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg transition-colors duration-300
        ${isDark
          ? 'bg-surface-900/80 border-b border-surface-700'
          : 'bg-white/80 border-b border-surface-200 shadow-sm'
        }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center
              ${isDark
                ? 'bg-brand-600/20 text-brand-400'
                : 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow-brand'
              }`}>
              <Palette size={18} />
            </div>
            <span className={`font-display text-base font-extrabold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
              MapColor AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
                ${isDark ? 'bg-white/5 hover:bg-white/10 text-amber-400' : 'bg-gray-100 hover:bg-gray-200 text-indigo-500'}`}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/upload" className="btn-primary text-xs px-5 py-2.5">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: gradientHero }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 badge-brand font-medium"
          >
            <Sparkles size={14} />
            AI-Powered · Graph Theory · Monte Carlo
          </motion.div>

          {/* Title */}
          <h1 className={`font-display text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight
            ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Smart Map{' '}
            <span style={{
              background: 'linear-gradient(to right, #5c7cfa, #4c6ef5, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Coloring
            </span>
          </h1>

          <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed
            ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Upload any map image. AI detects regions, builds a constraint graph, applies coloring algorithms,
            and computes satisfiability probability.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link to="/upload">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="btn-primary flex items-center gap-2.5 text-sm px-8 py-4"
              >
                <Upload size={18} /> Upload Your Map
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.04 }}
                className="btn-secondary flex items-center gap-2 text-sm px-8 py-4"
              >
                Learn More <ChevronRight size={16} />
              </motion.button>
            </a>
          </div>
        </motion.div>

        {/* Floating graph illustration */}
        <motion.div {...float} className="mt-14 relative z-10">
          <svg width="380" height="180" viewBox="0 0 380 180" className="opacity-70">
            <defs>
              <filter id="heroShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.2" />
              </filter>
            </defs>
            {/* Edges */}
            {[
              [70,90, 180,50], [70,90, 180,130], [180,50, 310,90],
              [180,130, 310,90], [180,50, 180,130], [70,90, 310,90]
            ].map(([x1,y1,x2,y2], i) => (
              <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.8 }}
              />
            ))}
            {/* Nodes */}
            {[
              [70,90,'#ef4444','R1'], [180,50,'#10b981','R2'],
              [180,130,'#f59e0b','R3'], [310,90,'#8b5cf6','R4']
            ].map(([cx,cy,color,label]) => (
              <g key={label} filter="url(#heroShadow)">
                <circle cx={cx} cy={cy} r={22} fill={color + '20'} stroke={color} strokeWidth={2.5} />
                <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.9} />
                <text x={cx} y={Number(cy)+36} textAnchor="middle" fill={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600">{label}</text>
              </g>
            ))}
          </svg>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted"
        >
          <span className="text-xs font-medium">scroll</span>
          <div className={`w-px h-8 ${isDark ? 'bg-gradient-to-b from-gray-500 to-transparent' : 'bg-gradient-to-b from-gray-300 to-transparent'}`} />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="section-label mb-3">✨ Capabilities</div>
            <h2 className={`font-display text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              How It Works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, emoji }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="card card-hover p-6 rounded-2xl group cursor-default"
              >
                <div className="text-3xl mb-4">{emoji}</div>
                <div className={`font-display text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {title}
                </div>
                <div className="text-muted text-xs leading-relaxed">{desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Steps */}
      <section className={`py-24 px-6 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label mb-3">🔗 Pipeline</div>
            <h2 className={`font-display text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              5-Step AI Pipeline
            </h2>
          </div>
          <div className="space-y-3">
            {STEPS.map(({ n, label, desc, emoji }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card card-hover flex items-start gap-5 p-5 rounded-2xl"
              >
                <div className="text-2xl shrink-0 mt-0.5">{emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-xs font-bold ${isDark ? 'text-brand-400' : 'text-brand-500'}`}>
                      STEP {n}
                    </span>
                  </div>
                  <div className={`font-display text-sm font-bold mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</div>
                  <div className="text-muted text-sm">{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className={`py-24 px-6 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="section-label mb-3">🌍 Real-World Uses</div>
          <h2 className={`font-display text-3xl font-bold mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Applications
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {APPS.map(({ title, desc, emoji }) => (
              <motion.div key={title} whileHover={{ scale: 1.02 }} className="card card-hover p-6 rounded-2xl">
                <div className="text-3xl mb-4">{emoji}</div>
                <div className={`font-display text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</div>
                <div className="text-muted text-xs leading-relaxed">{desc}</div>
              </motion.div>
            ))}
          </div>

          <motion.div className="mt-14" whileHover={{ scale: 1.02 }}>
            <Link to="/upload">
              <button className="btn-primary text-base px-10 py-4 flex items-center gap-3 mx-auto">
                <Upload size={20} /> Start Analyzing Your Map
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* More Info — Satisfaction Probability */}
      <section className={`py-24 px-6 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="section-label mb-3">📖 More Info</div>
            <h2 className={`font-display text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Satisfaction Probability — P(SAT)
            </h2>
            <p className={`mt-4 max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              P(SAT) measures the likelihood that a randomly assigned coloring satisfies all adjacency
              constraints in a graph — a core concept in constraint satisfaction and computational complexity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Definition Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card p-6 rounded-2xl md:col-span-2"
            >
              <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                📖 What is Satisfaction Probability?
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Given a graph <strong>G = (V, E)</strong> with <strong>n</strong> nodes and <strong>m</strong> edges,
                and <strong>k</strong> available colors, the <strong>Satisfaction Probability P(SAT)</strong> is the
                probability that a uniformly random assignment of colors to nodes results in a <em>proper coloring</em> —
                one where no two adjacent nodes share the same color. A higher P(SAT) means the problem is easier
                to solve randomly; a lower value indicates a harder constraint satisfaction problem.
              </p>
            </motion.div>

            {/* Theoretical Formula */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className={`card p-6 rounded-2xl border ${isDark ? 'border-indigo-500/20' : 'border-indigo-100'}`}
            >
              <div className="text-2xl mb-3">📐</div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Theoretical Approximation
              </div>
              <div className={`font-mono text-xl text-center py-4 font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                P(SAT) ≈ ((k − 1) / k)<sup>m</sup>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                For each edge (u, v), the probability that two independently, uniformly chosen colors differ
                is <span className="font-mono font-semibold">(k−1)/k</span>. Assuming edge independence, we multiply
                across all <strong>m</strong> edges. This is an <em>upper bound</em> approximation — the true value
                is often lower due to correlations.
              </p>
            </motion.div>

            {/* Monte Carlo Formula */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              className={`card p-6 rounded-2xl border ${isDark ? 'border-green-500/20' : 'border-green-100'}`}
            >
              <div className="text-2xl mb-3">🎲</div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                Monte Carlo (Empirical)
              </div>
              <div className={`font-mono text-xl text-center py-4 font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                P(SAT) = Valid / N
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Generate <strong>N</strong> random colorings and count how many are valid (satisfy all constraints).
                By the Law of Large Numbers, as N → ∞ this ratio converges to the true P(SAT).
                This method works for any graph structure.
              </p>
            </motion.div>

            {/* Exact Formula */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4 }}
              className={`card p-6 rounded-2xl border ${isDark ? 'border-purple-500/20' : 'border-purple-100'}`}
            >
              <div className="text-2xl mb-3">🔬</div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                Exact (Chromatic Polynomial)
              </div>
              <div className={`font-mono text-xl text-center py-4 font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                P(SAT) = P(G, k) / k<sup>n</sup>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <strong>P(G, k)</strong> is the chromatic polynomial — the exact count of proper k-colorings
                of graph G. Dividing by <strong>k<sup>n</sup></strong> (total possible assignments) gives the exact probability.
                Computing this is #P-hard for large graphs.
              </p>
            </motion.div>

            {/* Interpretation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -4 }}
              className={`card p-6 rounded-2xl border ${isDark ? 'border-amber-500/20' : 'border-amber-100'}`}
            >
              <div className="text-2xl mb-3">💡</div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                How to Interpret P(SAT)
              </div>
              <div className="space-y-2">
                {[
                  { range: '> 80%', label: 'Easy', meaning: 'Random coloring likely succeeds.', color: '#10b981' },
                  { range: '30–80%', label: 'Moderate', meaning: 'Heuristic algorithms recommended.', color: '#f59e0b' },
                  { range: '< 30%', label: 'Hard', meaning: 'Exact algorithms needed.', color: '#ef4444' },
                  { range: '= 0%', label: 'Unsat', meaning: 'Impossible with k colors — increase k.', color: '#9ca3af' },
                ].map(({ range, label, meaning, color }) => (
                  <div key={range} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="font-mono text-xs font-bold w-14 shrink-0" style={{ color }}>{range}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>{label}</strong> — {meaning}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 px-6 text-center ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
        <div className="text-muted text-sm">
          MapColor AI · Graph Coloring &amp; SAT Simulation · Built with FastAPI + React + OpenCV
        </div>
      </footer>
    </div>
  )
}
