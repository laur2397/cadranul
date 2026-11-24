import 'server-only'
import { SITE_URL } from '../lib/rute'
import type { Art, Snap } from './date'

// Date structurate (schema.org) si fluxuri. Advertorialele nu intra in Google News si sunt marcate.
export const LOGO = () => `${SITE_URL()}/img/logo-cadranul.png`

export function jsonLdOrganizatie(snap: Snap) {
  const u = SITE_URL()
  const p = snap.site.publisher || {}
  return {
    '@context': 'https://schema.org', '@type': 'NewsMediaOrganization', '@id': `${u}/#org`, name: 'Cadranul', url: `${u}/`,
    slogan: snap.site.tagline, logo: { '@type': 'ImageObject', url: `${u}/img/logo-cadranul.png`, width: 512, height: 512 },
    ...(p.legalName && !/^\[/.test(p.legalName) ? { legalName: p.legalName } : {}),
    email: p.email || undefined,
    publishingPrinciples: `${u}/pagina/despre#deontologie`, correctionsPolicy: `${u}/pagina/corecturi`, ownershipFundingInfo: `${u}/pagina/despre#finantare`,
  }
}

export function jsonLdSite() {
  const u = SITE_URL()
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${u}/#site`, name: 'Cadranul', url: `${u}/`, inLanguage: 'ro-RO', publisher: { '@id': `${u}/#org` },
    potentialAction: { '@type': 'SearchAction', target: `${u}/cauta?q={q}`, 'query-input': 'required name=q' } }
}

export function jsonLdFirimituri(l: [string, string][]) {
  const u = SITE_URL()
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: l.map(([name, cale], i) => ({ '@type': 'ListItem', position: i + 1, name, item: u + cale })) }
}

export function jsonLdArticol(a: Art, corp: string, upd: Date) {
  const u = SITE_URL()
  const img = a.img.src.startsWith('http') ? a.img.src : u + a.img.src
  return {
    '@context': 'https://schema.org', '@type': a.type === 'advertorial' ? 'Article' : 'NewsArticle',
    headline: a.title.slice(0, 110), description: a.dek, image: [img], inLanguage: 'ro-RO',
    datePublished: a.pub.toISOString(), dateModified: upd.toISOString(),
    mainEntityOfPage: `${u}/articol/${a.slug}`, articleSection: a.sec.name, wordCount: corp.split(/\s+/).filter(Boolean).length,
    author: a.authors.length ? a.authors.map((x) => ({ '@type': 'Person', name: x.name, url: `${u}/autor/${x.slug}` })) : [{ '@type': 'Organization', name: 'Redacția Cadranul', url: `${u}/` }],
    publisher: { '@id': `${u}/#org`, '@type': 'NewsMediaOrganization', name: 'Cadranul', logo: { '@type': 'ImageObject', url: `${u}/img/logo-cadranul.png` } },
    ...(a.counties.length ? { contentLocation: a.counties.map((c) => ({ '@type': 'Place', name: `Județul ${c.name}` })) } : {}),
    isAccessibleForFree: true,
  }
}

export const xml = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string)

export function rss(titlu: string, link: string, descriere: string, arts: Art[]) {
  const u = SITE_URL()
  const items = arts.slice(0, 40).map((a) => `<item><title>${xml(a.title)}</title><link>${u}/articol/${a.slug}</link><guid isPermaLink="true">${u}/articol/${a.slug}</guid><pubDate>${a.pub.toUTCString()}</pubDate><category>${xml(a.sec.name)}</category><description>${xml(a.dek)}</description><enclosure url="${xml(a.img.src.startsWith('http') ? a.img.src : u + a.img.src)}" type="image/jpeg" length="0"/></item>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xml(titlu)}</title><link>${u}${link}</link><description>${xml(descriere)}</description><language>ro</language><atom:link href="${u}${link === '/' ? '' : link}/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`
}
