import { LogoMark } from '../components/Logo'

/** Se muestra mientras no existan los datos de Firebase en .env.local. */
export function SetupNeeded() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <LogoMark className="size-12 rounded-xl" />
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Falta conectar Firebase</h1>
        <p className="mt-2 text-slate-600">
          La aplicación necesita los datos de tu proyecto de Firebase para funcionar. Crea el archivo{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">.env.local</code> con base en{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">.env.example</code> y vuelve a iniciar la
          aplicación.
        </p>
      </div>
    </main>
  )
}
