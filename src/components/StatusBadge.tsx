import { statusMeta } from '../lib/rewards'
import type { RedemptionStatus } from '../lib/rewards'

export function StatusBadge({ status }: { status: RedemptionStatus }) {
  const meta = statusMeta[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.className}`}>
      {meta.label}
    </span>
  )
}
