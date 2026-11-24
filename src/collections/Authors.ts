import type { CollectionConfig } from 'payload'
import { editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

// La lansare, fiecare semnatura apartine unei persoane reale. Autorii din seed sunt fictivi (doar demo).
export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Autor', plural: 'Autori' },
  admin: { useAsTitle: 'name', group: 'Redacție', defaultColumns: ['name', 'role', 'base'] },
  hooks: HOOKURI_DATE,
  access: { read: public_, create: editorSauAdmin, update: editorSauAdmin, delete: editorSauAdmin },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'role', label: 'Funcția', type: 'text' },
    { name: 'beat', label: 'Ce acoperă', type: 'text' },
    { name: 'base', label: 'Unde lucrează', type: 'text' },
    { name: 'bio', type: 'textarea' },
    { name: 'email', type: 'email' },
    { name: 'photo', label: 'Fotografie reală', type: 'upload', relationTo: 'media' },
    { name: 'initials', label: 'Inițiale (pentru avatar, dacă nu are fotografie)', type: 'text', admin: { position: 'sidebar' } },
    { name: 'sameAs', label: 'Profiluri publice', type: 'array', fields: [{ name: 'url', type: 'text', required: true }] },
  ],
}
