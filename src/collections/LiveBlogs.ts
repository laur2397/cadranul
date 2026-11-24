import type { CollectionConfig } from 'payload'
import { autentificat, publicatSauRedactie, editorSauAdmin } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

export const LiveBlogs: CollectionConfig = {
  slug: 'liveblogs',
  labels: { singular: 'Relatare LIVE', plural: 'Relatări LIVE' },
  admin: { useAsTitle: 'title', group: 'Redacție' },
  versions: { drafts: true },
  hooks: HOOKURI_DATE,
  access: { read: publicatSauRedactie, create: autentificat, update: autentificat, delete: editorSauAdmin },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'dek', type: 'textarea' },
    { name: 'liveState', label: 'Stare', type: 'select', defaultValue: 'activ', options: [{ label: 'Activ', value: 'activ' }, { label: 'Incheiat', value: 'incheiat' }] },
    { name: 'section', type: 'relationship', relationTo: 'sections' },
    { name: 'region', type: 'relationship', relationTo: 'regions' },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true },
    { name: 'authors', type: 'relationship', relationTo: 'authors', hasMany: true },
    { name: 'publishedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'image', type: 'group', fields: [{ name: 'src', label: 'Imagine (ex. /img/12-munte-iarna-700.jpg)', type: 'text' }, { name: 'alt', type: 'text' }, { name: 'caption', type: 'text' }, { name: 'credit', type: 'text' }] },
    { name: 'keyPoints', type: 'array', fields: [{ name: 'x', type: 'textarea', required: true }] },
    {
      name: 'entries', label: 'Actualizari', type: 'array', fields: [
        { name: 'at', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } }, { name: 'title', type: 'text' }, { name: 'x', type: 'textarea', required: true },
        { name: 'kind', type: 'select', defaultValue: 'text', options: ['text', 'important', 'citat', 'corectura'] },
        { name: 'author', type: 'relationship', relationTo: 'authors' },
      ],
    },
  ],
}
