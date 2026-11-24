import type { CollectionBeforeChangeHook, Field } from 'payload'
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

// ——— Importurile automate (src/surse). Un conector scrie DOAR documentele cu `importer` = id-ul lui
// si nu atinge niciodata un document pe care l-a modificat un om in /admin (`editedByHuman`).
export const campuriImport: Field[] = [
  { name: 'importer', label: 'Importat automat de', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar', description: 'Gol = scris de redacție. Conectorii scriu doar documentele lor.' } },
  { name: 'externalId', label: 'Identificator la sursă', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar' } },
  {
    name: 'editedByHuman', label: 'Modificat de redacție (importul nu-l mai atinge)', type: 'checkbox', defaultValue: false,
    admin: { position: 'sidebar', condition: (d) => !!d?.importer, description: 'Se bifează singur când salvezi un document importat. Debifează ca să-l dai înapoi importului.' },
  },
]

/** Cand un om salveaza in /admin un document importat, importul nu il mai suprascrie. */
export const marcheazaEditareUmana: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation }) => {
  if (operation !== 'update' || req.context?.surse || !req.user || !originalDoc?.importer) return data
  // daca redactorul debifeaza explicit caseta, documentul revine importului
  if (data.editedByHuman === false && originalDoc.editedByHuman === true) return data
  return { ...data, editedByHuman: true }
}
