type Props = {
  label: string
  value: string
  ok: boolean
}

/**
 * Ligne d'état label / valeur avec teinte verte (`ok`) ou ambre (`!ok`).
 * Utilisée dans les barres latérales pour récapituler la progression
 * (indices satisfaits, boucle fermée, etc.).
 */
export function StatusRow({ label, value, ok }: Props) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`font-semibold ${
          ok
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-amber-600 dark:text-amber-400'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
