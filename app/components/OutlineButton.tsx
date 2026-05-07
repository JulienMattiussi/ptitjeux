import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Bouton secondaire à bordure : fond blanc, bordure grise, hover doux.
 * Utilisé pour « Recommencer », « Annuler », et autres actions neutres.
 *
 * Accepte tous les props HTML standards d'un bouton — y compris `disabled`,
 * qui applique automatiquement un style « inactif ».
 */
export function OutlineButton({ className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 ${className}`}
    />
  )
}
