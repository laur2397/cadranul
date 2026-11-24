import type { CollectionConfig } from 'payload'
import { autentificat, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'
import { campuriImport, marcheazaEditareUmana } from './campuri'

// Pretul energiei pe piata pentru ziua urmatoare (PZU, OPCOM): 24 de valori, lei/MWh.
export const parseazaValori = (s: unknown): number[] =>
  String(s ?? '').split(/[;,\s]+/).map((x) => x.trim()).filter(Boolean).map((x) => Number(x.replace(',', '.')))

export const EnergyPrices: CollectionConfig = {
  slug: 'energy-prices',
  labels: { singular: 'Prețul energiei (o zi)', plural: 'Energie: prețuri pe ore' },
  admin: { useAsTitle: 'day', group: 'Date utile', defaultColumns: ['day', 'source', 'updatedAt'] },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: { beforeChange: [marcheazaEditareUmana], ...HOOKURI_DATE },
  fields: [
    { name: 'day', label: 'Ziua (AAAA-LL-ZZ)', type: 'text', required: true, unique: true, index: true, validate: (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? true : 'Format: 2026-11-24') },
    {
      name: 'values', label: 'Cele 24 de prețuri, de la ora 0 la ora 23 (lei/MWh, separate prin virgulă sau spațiu)', type: 'textarea', required: true,
      validate: (v: unknown) => { const a = parseazaValori(v); return a.length === 24 && a.every((x) => Number.isFinite(x)) ? true : `Trebuie exact 24 de numere (acum: ${a.length}).` },
    },
    {
      name: 'quarterValues', label: 'Prețurile pe sferturi de oră, așa cum le publică OPCOM (opțional, 92-100 de valori)', type: 'textarea',
      admin: { description: 'Din 2025 PZU se tranzacționează pe intervale de 15 minute. Site-ul afișează media pe oră (câmpul de mai sus); valorile brute rămân aici.' },
    },
    { name: 'source', label: 'Sursa afișată', type: 'text', defaultValue: 'OPCOM, piața pentru ziua următoare' },
    ...campuriImport,
  ],
}
