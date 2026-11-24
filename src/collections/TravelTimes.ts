import type { CollectionConfig } from 'payload'
import { autentificat, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

// „Cat stai pe drum azi”: timpi pe rutele uzuale ale fiecarei editii.
export const TravelTimes: CollectionConfig = {
  slug: 'travel-times',
  labels: { singular: 'Timp pe rută', plural: 'Drumuri: timpi pe rute' },
  admin: { useAsTitle: 'route', group: 'Date utile', defaultColumns: ['route', 'region', 'duration', 'delta', 'status'] },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: HOOKURI_DATE,
  fields: [
    { type: 'row', fields: [
      { name: 'route', label: 'Ruta (ex. Craiova–Caracal)', type: 'text', required: true, admin: { width: '50%' } },
      { name: 'region', label: 'Ediția (gol = națională)', type: 'relationship', relationTo: 'regions', admin: { width: '50%' } },
    ] },
    { type: 'row', fields: [
      { name: 'duration', label: 'Durata azi (ex. 1 h 05)', type: 'text', required: true, admin: { width: '30%' } },
      { name: 'delta', label: 'Față de o zi obișnuită (ex. +15 min, ca de obicei)', type: 'text', required: true, admin: { width: '40%' } },
      { name: 'status', label: 'Starea', type: 'select', required: true, defaultValue: 'ok', admin: { width: '30%' }, options: [
        { label: 'Normal', value: 'ok' }, { label: 'Aglomerat', value: 'queue' }, { label: 'Lucrări', value: 'works' }, { label: 'Închis', value: 'closed' },
      ] },
    ] },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
