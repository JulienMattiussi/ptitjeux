import { ChallengeListPage } from '~/components/ChallengeListPage'
import * as challenges from '~/games/boucle/challenges'
import { loadListRoute } from '~/lib/levelRoute'
import { gameListMeta } from '~/lib/seo'
import type { Route } from './+types/boucle'

export function meta() {
  return gameListMeta('boucle')
}

// Côté serveur : seules les bornes du calendrier partent vers le navigateur.
export function loader() {
  return loadListRoute(challenges)
}

export default function BoucleIndex({ loaderData }: Route.ComponentProps) {
  return <ChallengeListPage gameId="boucle" {...loaderData} />
}
