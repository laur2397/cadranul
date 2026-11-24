import { DEMO, SITE_URL } from '@/lib/rute'
import { text } from '@/site/raspuns'

export const dynamic = 'force-dynamic'
// In modul demonstrativ nu se indexeaza nimic. La lansare: motoarele de cautare da, crawlerele care doar antreneaza modele nu.
const ANTRENARE = ['GPTBot', 'CCBot', 'Google-Extended', 'Meta-ExternalAgent', 'Bytespider', 'Applebot-Extended']
export function GET() {
  if (DEMO()) return text('# Versiune demonstrativa: nu se indexeaza.\nUser-agent: *\nDisallow: /\n')
  const u = SITE_URL()
  return text([...ANTRENARE.map((b) => `User-agent: ${b}\nDisallow: /\n`), 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /cauta\n', `Sitemap: ${u}/sitemap.xml`, `Sitemap: ${u}/sitemap-news.xml`, ''].join('\n'))
}
