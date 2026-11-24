import type { CollectionConfig } from 'payload'
import { autentificat, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'
import { campSursa } from './campuri'

// Vremea in orase (temperaturile de pe harta si cardul „Vremea în …”). Sursa la lansare: ANM / model numeric.
export const WeatherCities: CollectionConfig = {
  slug: 'weather',
  labels: { singular: 'Vremea într-un oraș', plural: 'Vremea: orașe' },
  admin: { useAsTitle: 'city', group: 'Date utile', defaultColumns: ['city', 'temp', 'cond', 'level', 'updatedAt'] },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: HOOKURI_DATE,
  fields: [
    {
      type: 'row', fields: [
        { name: 'city', label: 'Orașul (afișat)', type: 'text', required: true, admin: { width: '40%' } },
        { name: 'mapKey', label: 'Cheia pe hartă (fără diacritice)', type: 'text', required: true, unique: true, admin: { width: '30%' } },
        { name: 'level', label: 'Pe harta națională', type: 'select', required: true, defaultValue: 'local', admin: { width: '30%' }, options: [
          { label: 'Mereu, cu nume', value: 'principal' }, { label: 'Mereu, fără nume', value: 'secundar' }, { label: 'Doar în ediția regiunii', value: 'local' },
        ] },
      ],
    },
    { name: 'county', label: 'Județ', type: 'relationship', relationTo: 'counties' },
    {
      type: 'row', fields: [
        { name: 'temp', label: 'Temperatura acum (°C)', type: 'number', required: true, admin: { width: '30%' } },
        { name: 'cond', label: 'Cer', type: 'select', required: true, admin: { width: '30%' }, options: [
          { label: 'Soare', value: 'sun' }, { label: 'Înnorat', value: 'cloud' }, { label: 'Ceață', value: 'fog' }, { label: 'Ninsoare', value: 'snow' }, { label: 'Ploaie', value: 'rain' },
        ] },
        { name: 'condText', label: 'Descriere (ex. Ceață densă până la 11, apoi soare)', type: 'text', admin: { width: '40%' } },
      ],
    },
    { name: 'hours', label: 'Prognoza pe ore', type: 'array', maxRows: 6, fields: [{ type: 'row', fields: [{ name: 'h', label: 'Ora', type: 'number', min: 0, max: 23, required: true }, { name: 't', label: '°C', type: 'number', required: true }] }] },
    campSursa,
  ],
}
