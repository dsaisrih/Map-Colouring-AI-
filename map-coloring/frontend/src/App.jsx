import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './hooks/useAppContext'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import DetectionPage from './pages/DetectionPage'
import SimulationPage from './pages/SimulationPage'
import ResultsPage from './pages/ResultsPage'

function ThemedToaster() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? '#1e2230' : '#ffffff',
          color: isDark ? '#e2e5ef' : '#1f2937',
          border: isDark ? '1px solid #2a2f3e' : '1px solid #e4e7ef',
          fontFamily: "'Inter', 'Nunito', sans-serif",
          borderRadius: '12px',
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(0,0,0,0.08)',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: isDark ? '#1e2230' : '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: isDark ? '#1e2230' : '#fff' },
        },
      }}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <ThemedToaster />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<Layout />}>
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/detect" element={<DetectionPage />} />
              <Route path="/simulate" element={<SimulationPage />} />
              <Route path="/results" element={<ResultsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  )
}
