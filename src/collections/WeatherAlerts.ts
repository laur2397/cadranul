import type { CollectionConfig } from 'payload'
import { autentificat, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'
import { campSursa, campuriInterval } from './campuri'

// Coduri meteo (hasura galbena/portocalie/rosie pe judete, stratul Vremea). Sursa: ANM.
export const WeatherAlerts: CollectionConfig = {
  slug: 'weather-alerts',
  labels: { singular: 'Cod meteo', plural: 'Vremea: coduri' },
  admin: { useAsTitle: 'text', group: 'Date utile', defaultColumns: ['code', 'phenomenon', 'text', 'until'] },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: HOOKURI_DATE,
  fields: [
    {
      type: 'row', fields: [
        { name: 'code', label: 'Codul', type: 'select', required: true, defaultValue: 'yellow', admin: { width: '30%' }, options: [{ label: 'Galben', value: 'yellow' }, { label: 'Portocaliu', value: 'orange' }, { label: 'Roșu', value: 'red' }] },
        { name: 'phenomenon', label: 'Fenomenul (ex. ninsoare, ceață, polei, vânt)', type: 'text', required: true, admin: { width: '70%' } },
      ],
    },
    { name: 'text', label: 'Textul afișat (ex. Cod galben de ninsoare la munte de la 14:00)', type: 'text', required: true },
    { name: 'roads', label: 'Drumurile cele mai expuse (opțional, ex. DN1 Valea Prahovei și DN7 Valea Oltului)', type: 'text' },
    { name: 'counties', label: 'Județe', type: 'relationship', relationTo: 'counties', hasMany: true, required: true },
    ...campuriInterval, campSursa,
  ],
}
