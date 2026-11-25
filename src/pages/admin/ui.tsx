import { useEffect, useState, type ReactNode } from 'react'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { SuccessModal } from '../../components/ui/SuccessModal.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { isVideoMediaUrl, isVideoStoragePath, publicMediaUrl, uploadMedia } from '../../lib/media.ts'
import { AutoplayVideo } from '../../components/media/AutoplayVideo.tsx'

export const fieldClass =
  'mt-1.5 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#FF7900]'

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-normal text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-[#a3a3a3]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rounded-xl border border-[#2a2a2a] bg-[#161616] p-5 ${className}`}>{children}</section>
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`rounded-lg bg-[#FF7900] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50 ${props.className ?? ''}`}>
      {children}
    </button>
  )
}

export function QuietButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`rounded-lg border border-[#3a3a3a] px-3 py-2 text-sm text-[#f5f5f5] disabled:opacity-50 ${props.className ?? ''}`}>
      {children}
    </button>
  )
}

export function TextField({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-medium text-[#f0f0f0]">
      {label}
      {hint && <span className="mt-0.5 block text-xs font-normal text-[#8d8d8d]">{hint}</span>}
      <input {...props} className={fieldClass} />
    </label>
  )
}

export function TextArea({ label, hint, ...props }: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block text-sm font-medium text-[#f0f0f0]">
      {label}
      {hint && <span className="mt-0.5 block text-xs font-normal text-[#8d8d8d]">{hint}</span>}
      <textarea {...props} className={`${fieldClass} min-h-28`} />
    </label>
  )
}

export function Notice({ error, ok }: { error?: string | null; ok?: string | null }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (ok) setOpen(true)
  }, [ok])
  return (
    <>
      {error ? <p className="mb-3 text-sm text-[#ffb089]">{friendlyError(error)}</p> : null}
      {open && ok ? <SuccessModal message={ok} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

export function MediaField({
  label,
  hint,
  folder,
  accept,
  value,
  onChange,
  previewClassName = 'mt-3 h-32 w-full rounded-lg object-cover',
  previewSrc,
  fileFirst = false,
  allowClear = true,
}: {
  label: string
  hint: string
  folder: string
  accept: string
  value: string
  onChange: (path: string) => void
  previewClassName?: string
  /** When set, used for the preview (e.g. header logo with default fallback). */
  previewSrc?: string
  fileFirst?: boolean
  /** Show “Remove file” when a path is saved (default true). */
  allowClear?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = previewSrc?.trim() || (value ? publicMediaUrl(value) : '')
  const video = Boolean(value && (isVideoStoragePath(value) || (preview && isVideoMediaUrl(preview))))
  const fileInput = (
    <input
      type="file"
      accept={accept}
      className="mt-3 block text-sm text-[#cfcfcf]"
      onChange={async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        setBusy(true)
        setError(null)
        try {
          onChange(await uploadMedia(file, folder))
        } catch (err) {
          setError(friendlyError(err, 'That file could not be uploaded.'))
        } finally {
          setBusy(false)
        }
      }}
    />
  )

  return (
    <div>
      <p className="text-sm text-[#d4d4d4]">{label}</p>
      <p className="mt-1 text-xs text-[#8a8a8a]">{hint}</p>
      {fileFirst ? fileInput : null}
      {preview &&
        (video ? (
          <AutoplayVideo src={preview} className={previewClassName} />
        ) : (
          <img src={preview} alt="" className={previewClassName} />
        ))}
      {fileFirst ? null : fileInput}
      {allowClear && value.trim() ? (
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-[#ffb089] hover:text-[#ffc9a8]"
          onClick={() => onChange('')}
        >
          Remove file
        </button>
      ) : null}
      {busy ? <LoadingScreen label="Uploading" /> : null}
      {error && <p className="mt-2 text-xs text-[#ffb089]">{error}</p>}
    </div>
  )
}
