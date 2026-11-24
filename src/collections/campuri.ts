import type { Field } from 'payload'
import { RETEA } from '../shared/harta'

// Campuri refolosite de colectiile cu date utile (drumuri, avarii, vreme etc.)
export const campuriHarta: Field[] = [
  {
    type: 'row', fields: [
      { name: 'lat', label: 'Latitudine (pe hartă)', type: 'number', admin: { width: '50%', description: 'Din Google Maps: clic dreapta pe loc. Gol = reședința județului.' } },
      { name: 'lon', label: 'Longitudine', type: 'number', admin: { width: '50%' } },
    ],
  },
]
export const campuriInterval: Field[] = [
  {
    type: 'row', fields: [
      { name: 'from', label: 'De la', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
      { name: 'until', label: 'Până la', type: 'date', index: true, admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' }, description: 'După această oră nu se mai afișează. Gol = până se șterge.' } },
    ],
  },
]
export const campSursa: Field = { name: 'source', label: 'Sursa (ex. CNAIR, Distribuție Oltenia, ANM)', type: 'text', admin: { position: 'sidebar' } }
export const campJudet: Field = { name: 'county', label: 'Județ', type: 'relationship', relationTo: 'counties', required: true, index: true }
export const campRegiuneAuto: Field = { name: 'region', label: 'Regiunea (automat, din județ)', type: 'relationship', relationTo: 'regions', index: true, admin: { readOnly: true, position: 'sidebar' } }
export const OPTIUNI_TRONSON = RETEA.map((r) => ({ label: r.eticheta, value: r.id }))
