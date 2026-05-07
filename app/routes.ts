import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('sokomot', 'routes/sokomot.tsx'),
  route('sokomot/:date/:index', 'routes/sokomot.$date.$index.tsx'),
  route('boucle', 'routes/boucle.tsx'),
  route('boucle/:date/:index', 'routes/boucle.$date.$index.tsx'),
  route('semantogramme', 'routes/semantogramme.tsx'),
  route('semantogramme/:date/:index', 'routes/semantogramme.$date.$index.tsx'),
] satisfies RouteConfig
