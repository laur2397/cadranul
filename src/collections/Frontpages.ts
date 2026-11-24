import type { CollectionConfig } from 'payload'
import { editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

export const EDITII = [
  { label: 'Ediția națională', value: 'nat' },
  { label: 'Nord-Est', value: 'ne' }, { label: 'Sud-Est', value: 'se' }, { label: 'Sud-Muntenia', value: 'sm' }, { label: 'Sud-Vest Oltenia', value: 'sv' },
  { label: 'Vest', value: 'v' }, { label: 'Nord-Vest', value: 'nv' }, { label: 'Centru', value: 'c' }, { label: 'București-Ilfov', value: 'bi' },
]

// Prima pagina a fiecarei editii, asezata de editor. Ce lipseste se completeaza automat
// (cele mai importante si mai noi articole ale editiei, apoi cele nationale).
export const Frontpages: CollectionConfig = {
  slug: 'frontpages',
  labels: { singular: 'Prima pagină (ediție)', plural: 'Prima pagină' },
  admin: { useAsTitle: 'edition', group: 'Redacție', defaultColumns: ['edition', 'updatedAt'], description: 'Ce apare sus pe prima pagină a fiecărei ediții. Gol = automat.' },
  access: { read: public_, create: editorSauAdmin, update: editorSauAdmin, delete: editorSauAdmin },
  hooks: HOOKURI_DATE,
  fields: [
    { name: 'edition', label: 'Ediția', type: 'select', required: true, unique: true, options: EDITII },
    { name: 'top', label: 'Subiectul principal (caseta cu fotografie din dreapta)', type: 'relationship', relationTo: 'articles' },
    { name: 'catchUp', label: '„De la ultima ta vizită” (până la 5)', type: 'relationship', relationTo: 'articles', hasMany: true, maxRows: 5 },
    { name: 'seven', label: '„Ziua în 7 subiecte” (exact 7, în ordinea importanței)', type: 'relationship', relationTo: 'articles', hasMany: true, maxRows: 7 },
    { name: 'most', label: '„Cele mai citite” (manual, până la conectarea statisticilor)', type: 'relationship', relationTo: 'articles', hasMany: true, maxRows: 5 },
    {
      name: 'callouts', label: 'Casete cu fotografie pe hartă (doar pe calculator)', type: 'array', maxRows: 4, fields: [
        { name: 'article', type: 'relationship', relationTo: 'articles', required: true },
        { type: 'row', fields: [
          { name: 'dx', label: 'Deplasare orizontală (px)', type: 'number', defaultValue: 20, admin: { width: '50%' } },
          { name: 'dy', label: 'Deplasare verticală (px)', type: 'number', defaultValue: -60, admin: { width: '50%' } },
        ] },
      ],
    },
  ],
}
