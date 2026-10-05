/**
 * Garde-fou après `npm run build` : aucun fichier JS envoyé au navigateur ne
 * doit dépasser `MAX_BYTES`. Les niveaux se sont déjà retrouvés tous embarqués
 * dans chaque page (4 Mo) sans que rien ne casse : seule la taille le trahit.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ASSETS = join(import.meta.dirname, '../build/client/assets')
const MAX_BYTES = 300_000

const tooBig = readdirSync(ASSETS)
  .filter((file) => file.endsWith('.js'))
  .map((file) => ({ file, size: statSync(join(ASSETS, file)).size }))
  .filter(({ size }) => size > MAX_BYTES)

if (tooBig.length > 0) {
  for (const { file, size } of tooBig) {
    console.error(`${file} : ${Math.round(size / 1000)} ko (max ${MAX_BYTES / 1000} ko)`)
  }
  process.exit(1)
}
console.log(`Bundle client : aucun fichier JS au-delà de ${MAX_BYTES / 1000} ko.`)
