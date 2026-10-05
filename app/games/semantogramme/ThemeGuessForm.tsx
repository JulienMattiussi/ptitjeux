type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** La dernière proposition validée n'est pas le thème. */
  error: boolean
}

/** Saisie du thème, proposée une fois la grille résolue. */
export function ThemeGuessForm({ value, onChange, onSubmit, error }: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="animate-pop flex flex-col gap-2 rounded-xl border border-emerald-300 bg-linear-to-br from-emerald-50 to-teal-50 p-3 shadow-md shadow-emerald-200/50 dark:border-emerald-700 dark:from-emerald-950 dark:to-teal-950 dark:shadow-emerald-900/30"
    >
      <label
        htmlFor="theme-guess"
        className="text-sm font-medium text-emerald-900 dark:text-emerald-200"
      >
        Grille résolue. Quel est le thème ?
      </label>
      <input
        id="theme-guess"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        className="rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-emerald-700 dark:bg-gray-900 dark:text-gray-100"
        placeholder="Ta proposition"
      />
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">Pas tout à fait. Réessaie.</p>
      )}
      <button
        type="submit"
        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
      >
        Valider le thème
      </button>
    </form>
  )
}
