import { MailCheck } from 'lucide-react'

/** Mensaje que se muestra después de enviar el enlace de acceso. */
export function MagicLinkSent({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <MailCheck className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Revisa tu correo</h1>
      <p className="mt-3 text-slate-600">
        Enviamos un enlace de acceso a <span className="font-semibold text-slate-900">{email}</span>. Ábrelo
        desde este mismo navegador para ingresar.
      </p>
      <ul className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600">
        <li>• El enlace puede tardar uno o dos minutos en llegar.</li>
        <li>• Si no lo ves, revisa la carpeta de correo no deseado (spam).</li>
        <li>• El enlace solo funciona una vez.</li>
      </ul>
      <button type="button" onClick={onReset} className="mt-6 text-sm font-semibold text-brand-700 hover:text-brand-800">
        Usar otro correo
      </button>
    </div>
  )
}
