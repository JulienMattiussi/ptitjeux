import { ChallengeListPage } from '~/components/ChallengeListPage'
import * as challenges from '~/games/sokomot/challenges'
import { loadListRoute } from '~/lib/levelRoute'
import { gameListMeta } from '~/lib/seo'
import type { Route } from './+types/sokomot'

export function meta() {
  return gameListMeta('sokomot')
}

// Côté serveur : seules les bornes du calendrier partent vers le navigateur.
export function loader() {
  return loadListRoute(challenges)
}

export default function SokomotIndex({ loaderData }: Route.ComponentProps) {
  return <ChallengeListPage gameId="sokomot" {...loaderData} />
}
