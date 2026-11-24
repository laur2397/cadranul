import type { CollectionConfig } from 'payload'
import { autentificat, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'
import { regiuneDinJudet } from '../hooks/regiune'
import { campJudet, campRegiuneAuto, campSursa, campuriHarta, campuriInterval } from './campuri'

// Avarii si opriri programate: apa, curent, gaz (stratul Avarii, cardul „Avarii”).
export const Outages: CollectionConfig = {
  slug: 'outages',
  labels: { singular: 'Avarie / oprire', plural: 'Avarii: apă, curent, gaz' },
  admin: { useAsTitle: 'title', group: 'Date utile', defaultColumns: ['kind', 'title', 'city', 'until'] },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: { beforeChange: [regiuneDinJudet], ...HOOKURI_DATE },
  fields: [
    {
      type: 'row', fields: [
        { name: 'kind', label: 'Ce', type: 'select', required: true, admin: { width: '30%' }, options: [{ label: 'Apă', value: 'water' }, { label: 'Curent', value: 'power' }, { label: 'Gaz', value: 'gas' }] },
        { name: 'title', label: 'Titlu scurt (ex. Apă caldă oprită joi)', type: 'text', required: true, admin: { width: '70%' } },
      ],
    },
    { name: 'area', label: 'Zona (străzi, cartiere, interval)', type: 'text', required: true },
    campJudet,
    { name: 'city', label: 'Localitatea', type: 'text', required: true },
    campRegiuneAuto,
    ...campuriHarta, ...campuriInterval, campSursa,
  ],
}
