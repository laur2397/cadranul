import type { CollectionConfig } from 'payload'
import { doarAdmin, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

// Editia este regiunea de dezvoltare. Toate cele 8 sunt lansate. O regiune nelansata raspunde cu 404.
export const Regions: CollectionConfig = {
  slug: 'regions',
  labels: { singular: 'Ediție (regiune)', plural: 'Ediții (regiuni)' },
  admin: { useAsTitle: 'name', group: 'Structură', defaultColumns: ['name', 'short', 'city', 'launched'] },
  access: { read: public_, create: doarAdmin, update: editorSauAdmin, delete: doarAdmin },
  hooks: HOOKURI_DATE,
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { description: 'Adresa: /editie/<slug>. Nu se schimbă după lansare.' } },
    { name: 'name', label: 'Nume (ex. Sud-Vest Oltenia)', type: 'text', required: true },
    { name: 'short', label: 'Nume scurt (ex. Oltenia)', type: 'text', required: true },
    {
      name: 'mapKey', label: 'Zona de pe hartă', type: 'select', required: true, unique: true,
      options: [
        { label: 'Nord-Est', value: 'ne' }, { label: 'Sud-Est', value: 'se' }, { label: 'Sud-Muntenia', value: 'sm' }, { label: 'Sud-Vest Oltenia', value: 'sv' },
        { label: 'Vest', value: 'v' }, { label: 'Nord-Vest', value: 'nv' }, { label: 'Centru', value: 'c' }, { label: 'București-Ilfov', value: 'bi' },
      ],
    },
    { name: 'city', label: 'Orașul ediției (în salut: „Bună dimineața, Craiova.”)', type: 'text', required: true },
    { name: 'cityKey', label: 'Orașul pe hartă (cheia fără diacritice, ex. Craiova, Ramnicu Valcea)', type: 'text', required: true },
    { name: 'refCounty', label: 'Județul de referință (carburant, farmacii)', type: 'relationship', relationTo: 'counties' },
    { name: 'launched', label: 'Lansată', type: 'checkbox', defaultValue: true },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    {
      name: 'sponsor', label: 'Sponsorul ediției (vânzare directă, se afișează „Publicitate”)', type: 'group', fields: [
        { name: 'name', label: 'Firma', type: 'text' },
        { name: 'line', label: 'Textul rândului (opțional)', type: 'text', admin: { description: 'Gol = „Ediția <regiune> este susținută de <firmă>.”' } },
        { name: 'url', label: 'Adresa site-ului', type: 'text' },
        { name: 'until', label: 'Până la', type: 'date' },
      ],
    },
  ],
}
