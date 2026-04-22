import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [sessionId, setSessionId] = useState(null)
  const [uploadData, setUploadData] = useState(null)      // { image_url, width, height }
  const [detectData, setDetectData] = useState(null)      // { regions, detected_image_url }
  const [adjacencyData, setAdjacencyData] = useState(null) // { nodes, edges }
  const [coloringData, setColoringData] = useState(null)   // { coloring, valid, image_url }
  const [simulationData, setSimulationData] = useState(null) // Monte Carlo results
  const [settings, setSettings] = useState({
    numColors: 4,
    algorithm: 'backtracking',
    iterations: 1000,
    sensitivity: 0.5,
  })

  function reset() {
    setSessionId(null)
    setUploadData(null)
    setDetectData(null)
    setAdjacencyData(null)
    setColoringData(null)
    setSimulationData(null)
  }

  return (
    <AppContext.Provider value={{
      sessionId, setSessionId,
      uploadData, setUploadData,
      detectData, setDetectData,
      adjacencyData, setAdjacencyData,
      coloringData, setColoringData,
      simulationData, setSimulationData,
      settings, setSettings,
      reset,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
