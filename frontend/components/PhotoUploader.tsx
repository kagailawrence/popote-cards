'use client'

import { useState } from 'react'
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react'

interface PhotoUploaderProps {
  onPhotoUploaded: (storagePath: string, previewUrl: string) => void
  onPhotoCleared: () => void
}

export function PhotoUploader({ onPhotoUploaded, onPhotoCleared }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('photo', file)

    try {
      const res = await fetch('http://localhost:4000/api/v1/files/upload-photo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      const fullUrl = `http://localhost:4000${data.data.url}`
      setPreviewUrl(fullUrl)
      onPhotoUploaded(data.data.storagePath, fullUrl)
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setPreviewUrl(null)
    setError(null)
    onPhotoCleared()
  }

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
        Upload Custom Photo (Optional)
      </label>

      {previewUrl ? (
        <div className="relative rounded-xl border border-pink-500/40 bg-slate-50 dark:bg-zinc-900 p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <img src={previewUrl} alt="Preview" loading="lazy" decoding="async" className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-green-500" /> Photo attached
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Ready for high-res print</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-pink-500/50 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="sr-only"
          />
          <ImageIcon className="w-8 h-8 text-pink-500 mb-2" />
          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
            {uploading ? 'Uploading...' : 'Click to select photo (JPEG, PNG, WebP)'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">Max 5MB • Streamed securely</span>
        </label>
      )}

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}
