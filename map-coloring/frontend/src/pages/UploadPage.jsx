import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Upload, CheckCircle, ArrowRight, X, FileImage, Image } from 'lucide-react'
import { api } from '../services/api'
import { useAppContext } from '../hooks/useAppContext'
import { useTheme } from '../hooks/useTheme'

export default function UploadPage() {
  const navigate = useNavigate()
  const { setSessionId, setUploadData } = useAppContext()
  const { isDark } = useTheme()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setUploaded(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  async function handleUpload() {
    if (!file) return toast.error('Select an image first')
    setUploading(true)
    try {
      const data = await api.upload(file)
      setSessionId(data.session_id)
      setUploadData(data)
      setUploaded(true)
      toast.success('Image uploaded successfully! 🎉')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    setFile(null)
    setPreview(null)
    setUploaded(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-brand">Step 1</span>
        </div>
        <h1 className="text-heading text-3xl">Upload Map Image</h1>
        <p className="text-muted mt-2">Upload a PNG or JPG of any map — geographic, political, or abstract.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Drop zone */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div
            {...getRootProps()}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer min-h-[280px] flex flex-col items-center justify-center p-8
              ${isDragActive
                ? isDark
                  ? 'border-brand-400 bg-brand-600/10'
                  : 'border-brand-500 bg-brand-50'
                : isDark
                  ? 'border-surface-700 hover:border-brand-600/40 bg-surface-800'
                  : 'border-surface-300 hover:border-brand-300 bg-white'
              }`}
          >
            <input {...getInputProps()} />

            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative w-full"
                >
                  <img src={preview} alt="Preview" className="w-full h-48 object-contain rounded-xl" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClear() }}
                    className={`absolute top-2 right-2 rounded-full p-1.5 transition-colors
                      ${isDark
                        ? 'bg-red-500/30 hover:bg-red-500 text-white'
                        : 'bg-red-100 hover:bg-red-500 text-red-500 hover:text-white'
                      }`}
                  >
                    <X size={14} />
                  </button>
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-medium truncate ${isDark ? 'text-green-400' : 'text-green-600'}`}>{file?.name}</div>
                    <div className="text-xs text-muted">{(file?.size / 1024).toFixed(1)} KB</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" className="text-center">
                  <motion.div
                    animate={{ y: isDragActive ? -6 : 0 }}
                    className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors
                      ${isDark
                        ? 'bg-brand-600/15 text-brand-400'
                        : 'bg-brand-50 text-brand-500'
                      }`}
                  >
                    <Image size={28} />
                  </motion.div>
                  <div className={`font-display text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isDragActive ? 'Drop it here! 📥' : 'Drag & Drop Map'}
                  </div>
                  <div className="text-muted text-sm mb-3">or click to browse files</div>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {['PNG', 'JPG', 'BMP', 'TIFF'].map(f => (
                      <span key={f} className={`text-xs font-medium px-2.5 py-1 rounded-lg
                        ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          {/* Upload button */}
          <div className="card p-5 rounded-2xl space-y-3">
            <div className="section-label mb-1">Upload & Process</div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={!file || uploading || uploaded}
              className={`w-full py-3 rounded-xl font-display text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                uploaded
                  ? 'bg-success-50 dark:bg-success-600/15 border border-success-400/30 text-success-600 dark:text-success-400 cursor-default'
                  : !file || uploading
                    ? isDark
                      ? 'bg-surface-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'btn-primary'
              }`}
            >
              {uploading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full" />
                  Uploading…
                </>
              ) : uploaded ? (
                <>
                  <CheckCircle size={16} /> Uploaded! ✓
                </>
              ) : (
                <>
                  <Upload size={16} /> Upload Image
                </>
              )}
            </motion.button>

            {uploaded && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/detect')}
                className="btn-success w-full py-3 flex items-center justify-center gap-2"
              >
                Detect Regions <ArrowRight size={16} />
              </motion.button>
            )}
          </div>

          {/* Tips */}
          <div className="card p-5 rounded-2xl">
            <div className="section-label mb-3">💡 Best Results With</div>
            <ul className="space-y-2.5">
              {[
                'Clear boundary lines between regions',
                'High contrast between regions',
                'Closed/enclosed areas (not open maps)',
                'PNG format for best quality',
                'Resolution 400–1200px wide',
              ].map(tip => (
                <li key={tip} className="flex items-start gap-2.5 text-sm text-muted">
                  <span className={`mt-0.5 shrink-0 ${isDark ? 'text-brand-400' : 'text-brand-500'}`}>✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* File info */}
          {file && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${isDark ? 'bg-brand-600/15 text-brand-400' : 'bg-brand-50 text-brand-500'}`}>
                  <FileImage size={18} />
                </div>
                <div>
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{file.name}</div>
                  <div className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB · {file.type}</div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
