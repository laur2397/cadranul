import type { CollectionConfig } from 'payload'
import { autentificat, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'
import { regiuneDinJudet } from '../hooks/regiune'
import { campJudet, campRegiuneAuto, campSursa, campuriHarta, campuriInterval, OPTIUNI_TRONSON } from './campuri'

// Starea drumurilor (stratul Drumuri, sectiunea „Starea drumurilor”, pagina /drumuri).
// Sursa reala la lansare: CNAIR / Infotrafic, prin importul descris in docs/fluxuri-date.md.
export const RoadEvents: CollectionConfig = {
  slug: 'road-events',
  labels: { singular: 'Eveniment rutier', plural: 'Drumuri: evenimente' },
  admin: { useAsTitle: 'road', group: 'Date utile', defaultColumns: ['road', 'segment', 'status', 'county', 'until'], description: 'Drumuri închise, lucrări, cozi. Cele expirate dispar singure de pe site.' },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: { beforeChange: [regiuneDinJudet], ...HOOKURI_DATE },
  fields: [
    {
      type: 'row', fields: [
        { name: 'road', label: 'Drumul (ex. A1, DN6, DX12)', type: 'text', required: true, admin: { width: '30%' } },
        { name: 'segment', label: 'Porțiunea (ex. Caracal–Craiova, 12 km)', type: 'text', required: true, admin: { width: '70%' } },
      ],
    },
    { name: 'what', label: 'Ce se întâmplă (o frază)', type: 'textarea', required: true },
    {
      type: 'row', fields: [
        { name: 'status', label: 'Starea', type: 'select', required: true, defaultValue: 'queue', admin: { width: '34%' }, options: [
          { label: 'Închis', value: 'closed' }, { label: 'Lucrări', value: 'works' }, { label: 'Coadă / aglomerat', value: 'queue' }, { label: 'Normal', value: 'ok' },
        ] },
        { name: 'delayMinutes', label: 'Întârziere (minute)', type: 'number', min: 0, admin: { width: '33%' } },
        { name: 'label', label: 'Eticheta scurtă (opțional, ex. „ceață”)', type: 'text', admin: { width: '33%', description: 'Gol = „+15 min” sau starea.' } },
      ],
    },
    campJudet, campRegiuneAuto,
    { name: 'mapSegment', label: 'Tronsoanele colorate pe hartă', type: 'select', hasMany: true, options: OPTIUNI_TRONSON },
    ...campuriHarta, ...campuriInterval, campSursa,
  ],
}
