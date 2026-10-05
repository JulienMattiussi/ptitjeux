import { render } from '@testing-library/react'
import { createRoutesStub } from 'react-router'

type RouteModule = Parameters<typeof createRoutesStub>[0][number]

/**
 * Rend une route du site avec son `loader`, comme le framework : `path` est
 * le motif de la route, `url` l'adresse visitée.
 */
export function renderRoute(
  path: string,
  url: string,
  module: Pick<RouteModule, 'Component' | 'loader'>,
) {
  const Stub = createRoutesStub([{ path, ...module }])
  return render(<Stub initialEntries={[url]} />)
}
