import { ChevronLeft, ChevronRight } from '~/components/icons'
import { OutlineButton } from '~/components/OutlineButton'
import type { SolutionReplay } from './useSolutionReplay'

/**
 * Lecture de la solution : coup par coup, ou en continu. Les symboles suivis
 * de `\uFE0E` restent du texte, pas des emojis en couleur sur mobile.
 */
export function SolutionReplayControls({ replay }: { replay: SolutionReplay }) {
  const { step, total, playing } = replay
  return (
    <div className="mt-3">
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-300">
        Coup {step} / {total}
      </div>
      <div className="flex gap-1.5">
        <OutlineButton
          onClick={replay.restart}
          aria-label="Revoir depuis le début"
          className="flex-1"
        >
          {'\u23EE\uFE0E'}
        </OutlineButton>
        <OutlineButton
          onClick={replay.previous}
          disabled={step === 0}
          aria-label="Coup précédent"
          className="flex-1"
        >
          <ChevronLeft className="mx-auto h-4 w-4" />
        </OutlineButton>
        <OutlineButton
          onClick={replay.togglePlay}
          aria-label={playing ? 'Pause' : 'Lecture'}
          className="flex-1"
        >
          {playing ? '\u23F8\uFE0E' : '\u25B6\uFE0E'}
        </OutlineButton>
        <OutlineButton
          onClick={replay.next}
          disabled={step === total}
          aria-label="Coup suivant"
          className="flex-1"
        >
          <ChevronRight className="mx-auto h-4 w-4" />
        </OutlineButton>
      </div>
    </div>
  )
}
