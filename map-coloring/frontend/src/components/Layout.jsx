import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppContext } from '../hooks/useAppContext'
import { useTheme } from '../hooks/useTheme'
import {
  Upload, Search, Play, BarChart2, Home, Palette, ChevronRight, Sun, Moon
} from 'lucide-react'

const NAV = [
  { to: '/upload',   icon: Upload,    label: 'Upload Map',     step: 1 },
  { to: '/detect',   icon: Search,    label: 'Detect Regions', step: 2 },
  { to: '/simulate', icon: Play,      label: 'Simulate',       step: 3 },
  { to: '/results',  icon: BarChart2, label: 'Results',         step: 4 },
]

export default function Layout() {
  const { sessionId, uploadData } = useAppContext()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? 'bg-surface-900' : 'bg-surface-50'}`}>
      {/* Sidebar */}
      <aside className={`w-64 min-h-screen flex flex-col fixed left-0 top-0 z-40 transition-colors duration-300
        ${isDark
          ? 'bg-surface-850/95 border-r border-surface-700 backdrop-blur-md'
          : 'bg-white/90 border-r border-surface-200 backdrop-blur-md shadow-soft'
        }`}>

        {/* Logo */}
        <div className={`p-5 border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105
              ${isDark
                ? 'bg-brand-600/20 text-brand-400'
                : 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow-brand'
              }`}>
              <Palette size={20} />
            </div>
            <div>
              <div className={`font-display text-sm font-extrabold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
                MapColor
              </div>
              <div className="text-xs text-muted font-medium">AI Simulator</div>
            </div>
          </NavLink>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label, step }) => {
            const active = location.pathname === to
            return (
              <NavLink key={to} to={to}>
                <motion.div
                  whileHover={{ x: 3 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    active
                      ? isDark
                        ? 'bg-brand-600/15 text-brand-400'
                        : 'bg-brand-50 text-brand-700 shadow-sm'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold transition-all
                    ${active
                      ? isDark
                        ? 'bg-brand-600/25 text-brand-400'
                        : 'bg-brand-100 text-brand-600'
                      : isDark
                        ? 'bg-white/5 text-gray-500 group-hover:text-brand-400'
                        : 'bg-gray-100 text-gray-400 group-hover:text-brand-500'
                    }`}>
                    {step}
                  </span>
                  <Icon size={16} />
                  <span className="font-medium text-sm">{label}</span>
                  {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </motion.div>
              </NavLink>
            )
          })}
        </nav>

        {/* Theme toggle + Session info */}
        <div className={`p-4 space-y-3 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isDark
                ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Session */}
          {sessionId ? (
            <div className={`card p-3 rounded-xl`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse-soft" />
                <span className="text-xs font-semibold text-muted">Active Session</span>
              </div>
              <div className="font-mono text-xs text-muted truncate">{sessionId.slice(0, 20)}…</div>
              {uploadData && (
                <div className="mt-2">
                  <span className="badge badge-brand text-xs">
                    {uploadData.width}×{uploadData.height}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted text-center py-1">No active session</div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
