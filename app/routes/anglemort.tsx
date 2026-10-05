import { ChallengeListPage } from '~/components/ChallengeListPage'
import * as challenges from '~/games/anglemort/challenges'
import { loadListRoute } from '~/lib/levelRoute'
import { gameListMeta } from '~/lib/seo'
import type { Route } from './+types/anglemort'

export function meta() {
  return gameListMeta('anglemort')
}

// Côté serveur : seules les bornes du calendrier partent vers le navigateur.
export function loader() {
  return loadListRoute(challenges)
}

export default function AngleMortIndex({ loaderData }: Route.ComponentProps) {
  return <ChallengeListPage gameId="anglemort" {...loaderData} />
}
