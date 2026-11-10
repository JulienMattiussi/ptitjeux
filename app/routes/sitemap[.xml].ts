import { todayString } from '~/lib/dates'
import { sitemapXml } from '~/lib/seo'

export function loader() {
  return new Response(sitemapXml(todayString()), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Le jour change à minuit (Paris) : une heure de cache suffit.
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
