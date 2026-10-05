import { ChallengeListPage } from '~/components/ChallengeListPage'
import * as challenges from '~/games/semantogramme/challenges'
import { loadListRoute } from '~/lib/levelRoute'
import { gameListMeta } from '~/lib/seo'
import type { Route } from './+types/semantogramme'

export function meta() {
  return gameListMeta('semantogramme')
}

// Côté serveur : seules les bornes du calendrier partent vers le navigateur.
export function loader() {
  return loadListRoute(challenges)
}

export default function SemantogrammeIndex({ loaderData }: Route.ComponentProps) {
  return <ChallengeListPage gameId="semantogramme" {...loaderData} />
}
