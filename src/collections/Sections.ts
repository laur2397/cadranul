import type { CollectionConfig } from 'payload'
import { doarAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

// Rute rezervate: o sectiune nu poate lua adresa unei pagini de serviciu.
// Exceptie voita: sectiunea „energie” este servita de pagina /energie (cadranul + articolele ei).
export const RUTE_REZERVATE = ['api', 'admin', '_next', 'articol', 'live', 'editie', 'regiune', 'judet', 'autor', 'pagina', 'cauta',
  'drumuri', 'joburi', 'farmacii', 'img', 'fonts', 'css', 'js', 'map', 'rss.xml', 'sitemap.xml', 'sitemap-news.xml', 'robots.txt', 'ads.txt', 'llms.txt']

export const Sections: CollectionConfig = {
  slug: 'sections',
  labels: { singular: 'Secțiune', plural: 'Secțiuni' },
  admin: { useAsTitle: 'name', group: 'Structură', defaultColumns: ['name', 'slug', 'order'] },
  access: { read: public_, create: doarAdmin, update: doarAdmin, delete: doarAdmin },
  hooks: HOOKURI_DATE,
  fields: [
    {
      name: 'slug', type: 'text', required: true, unique: true, index: true,
      validate: (v: unknown) => (typeof v !== 'string' || !/^[a-z0-9-]+$/.test(v) ? 'Doar litere mici, cifre și cratime.' : RUTE_REZERVATE.includes(v) ? `„${v}" este o rută rezervată.` : true),
    },
    { name: 'name', type: 'text', required: true },
    { name: 'desc', label: 'Descriere', type: 'textarea' },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
