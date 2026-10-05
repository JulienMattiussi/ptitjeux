import type { Config } from '@react-router/dev/config'

export default {
  // Rendu serveur : le choix entre prérendu statique et serveur Node se fera
  // avec l'hébergeur.
  ssr: true,
} satisfies Config
