import { useCallback, useRef, useState } from 'react'
import { Upload, CheckCircle } from 'lucide-react'
import { uploadGalleryImage } from '@/services/adminApi'

export default function AdminGallery() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.')
        return
      }
      if (file.size > 1 * 1024 * 1024) {
        setError('Image must be under 1 MB.')
        return
      }

      setUploading(true)
      setError(null)
      setSuccess(null)
      try {
        await uploadGalleryImage(file)
        setSuccess('Image uploaded successfully!')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.')
      } finally {
        setUploading(false)
      }
    },
    [],
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave() {
    setDragActive(false)
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-SilentKrowd-white">Gallery</h1>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-8 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 transition-colors ${
          dragActive
            ? 'border-SilentKrowd-gold bg-SilentKrowd-gold/5'
            : 'border-SilentKrowd-border hover:border-SilentKrowd-gold/40'
        }`}
      >
        <Upload size={28} className="text-SilentKrowd-muted" />
        <p className="text-sm text-SilentKrowd-muted">
          {uploading ? 'Uploading…' : 'Click or drag an image here to upload'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {success && (
        <p className="mb-4 flex items-center gap-2 text-sm text-green-400">
          <CheckCircle size={16} />
          {success}
        </p>
      )}
    </div>
  )
}
