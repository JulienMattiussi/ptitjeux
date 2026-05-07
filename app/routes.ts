import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('sokomot', 'routes/sokomot.tsx'),
  route('sokomot/:levelId', 'routes/sokomot.$levelId.tsx'),
  route('boucle', 'routes/boucle.tsx'),
  route('boucle/:levelId', 'routes/boucle.$levelId.tsx'),
  route('semantogramme', 'routes/semantogramme.tsx'),
  route('semantogramme/:levelId', 'routes/semantogramme.$levelId.tsx'),
] satisfies RouteConfig
