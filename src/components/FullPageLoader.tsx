import { LoaderCircle } from 'lucide-react'
import { LogoMark } from './Logo'

export function FullPageLoader({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-50 px-4 text-center">
      <LogoMark className="size-12 rounded-xl" />
      {message ? (
        <p className="max-w-sm text-slate-700">{message}</p>
      ) : (
        <p className="flex items-center gap-2 text-slate-600">
          <LoaderCircle className="size-5 animate-spin text-brand-600" aria-hidden="true" />
          Cargando…
        </p>
      )}
    </div>
  )
}
