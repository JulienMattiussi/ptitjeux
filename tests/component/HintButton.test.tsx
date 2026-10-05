import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { HintButton } from '~/components/HintButton'

function Harness({ available }: { available: boolean }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <HintButton
      hint={{ available, revealed, reveal: () => setRevealed(true) }}
      label="Mot à encercler"
    >
      CHAT
    </HintButton>
  )
}

describe('HintButton', () => {
  it("n'affiche rien tant que l'aide n'est pas proposée", () => {
    render(<Harness available={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it("propose l'aide sans la révéler", () => {
    render(<Harness available />)
    expect(screen.getByRole('button', { name: "Coincé ? Un peu d'aide ?" })).toBeInTheDocument()
    expect(screen.queryByText('CHAT')).not.toBeInTheDocument()
  })

  it("remplace le bouton par l'aide au clic", async () => {
    render(<Harness available />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Mot à encercler')).toBeInTheDocument()
    expect(screen.getByText('CHAT')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
