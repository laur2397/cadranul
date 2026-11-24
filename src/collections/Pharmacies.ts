import type { CollectionConfig } from 'payload'
import { autentificat, campDoarEditor, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

// Farmacii de garda, pe zi. O farmacie poate sustine rubrica (vanzare directa, afisata „Publicitate”).
export const Pharmacies: CollectionConfig = {
  slug: 'pharmacies',
  labels: { singular: 'Farmacie de gardă', plural: 'Farmacii de gardă' },
  admin: { useAsTitle: 'name', group: 'Date utile', defaultColumns: ['name', 'city', 'day', 'hours', 'sponsor'] },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: HOOKURI_DATE,
  fields: [
    { type: 'row', fields: [
      { name: 'name', label: 'Farmacia', type: 'text', required: true, admin: { width: '50%' } },
      { name: 'day', label: 'Ziua de gardă (AAAA-LL-ZZ)', type: 'text', required: true, index: true, admin: { width: '50%' }, validate: (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? true : 'Format: 2026-11-24') },
    ] },
    { type: 'row', fields: [
      { name: 'county', label: 'Județ', type: 'relationship', relationTo: 'counties', required: true, index: true, admin: { width: '50%' } },
      { name: 'city', label: 'Localitatea', type: 'text', required: true, admin: { width: '50%' } },
    ] },
    { type: 'row', fields: [
      { name: 'address', label: 'Adresa', type: 'text', required: true, admin: { width: '50%' } },
      { name: 'hours', label: 'Program (ex. non-stop, până la 23:00)', type: 'text', required: true, admin: { width: '25%' } },
      { name: 'phone', label: 'Telefon', type: 'text', admin: { width: '25%' } },
    ] },
    { name: 'sponsor', label: 'Susține rubrica „Farmacii de gardă” (plătit, apare „Publicitate”)', type: 'checkbox', defaultValue: false, access: { update: campDoarEditor, create: campDoarEditor } },
  ],
}
