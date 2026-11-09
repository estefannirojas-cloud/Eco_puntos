import { useState } from 'react'
import { categories } from '../lib/rewards'
import type { Reward } from '../lib/rewards'

/** Imagen de la recompensa; si no tiene (o no carga), muestra una ilustración de su categoría. */
export function RewardVisual({
  reward,
  className = 'h-40',
}: {
  reward: Pick<Reward, 'imagenUrl' | 'categoria' | 'nombre'>
  className?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const category = categories[reward.categoria] ?? categories.especial
  const Icon = category.icon
  const url = reward.imagenUrl?.trim()

  if (url && failedUrl !== url) {
    return (
      <img
        src={url}
        alt={reward.nombre}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(url)}
        className={`w-full bg-slate-100 object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br ${category.gradient} ${className}`}
      role="img"
      aria-label={`Ilustración de ${category.label.toLowerCase()}`}
    >
      <div className="absolute -right-6 -top-6 size-28 rounded-full bg-white/10" aria-hidden="true" />
      <div className="absolute -bottom-10 -left-8 size-32 rounded-full bg-white/10" aria-hidden="true" />
      <span className="relative flex size-16 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
        <Icon className="size-8" aria-hidden="true" />
      </span>
    </div>
  )
}
