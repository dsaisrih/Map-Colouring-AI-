import axios from 'axios'

const BASE = '/api'

export const api = {
  async upload(file) {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await axios.post(`${BASE}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async detect(sessionId, sensitivity = 0.5) {
    const { data } = await axios.post(`${BASE}/detect`, { session_id: sessionId, sensitivity })
    return data
  },

  async adjacency(sessionId) {
    const { data } = await axios.post(`${BASE}/adjacency`, { session_id: sessionId })
    return data
  },

  async color(sessionId, numColors, algorithm) {
    const { data } = await axios.post(`${BASE}/color`, {
      session_id: sessionId,
      num_colors: numColors,
      algorithm,
    })
    return data
  },

  async compare(sessionId, numColors) {
    const { data } = await axios.post(`${BASE}/compare`, {
      session_id: sessionId,
      num_colors: numColors,
      algorithm: 'compare',
    })
    return data
  },

  async simulate(sessionId, numColors, iterations) {
    const { data } = await axios.post(`${BASE}/simulate`, {
      session_id: sessionId,
      num_colors: numColors,
      iterations,
    })
    return data
  },

  async getResults(sessionId) {
    const { data } = await axios.get(`${BASE}/results/${sessionId}`)
    return data
  },
}
