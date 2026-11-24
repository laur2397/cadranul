import type { CollectionConfig } from 'payload'
import { autentificat, public_ } from '../access/roluri'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagine', plural: 'Imagini' },
  admin: { group: 'Redacție' },
  access: { read: public_, create: autentificat, update: autentificat, delete: autentificat },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    imageSizes: [
      { name: 'card', width: 700 },
      { name: 'hero', width: 1400 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    formatOptions: { format: 'webp', options: { quality: 75 } },
  },
  fields: [
    { name: 'alt', label: 'Text alternativ: ce se vede', type: 'text', required: true },
    { name: 'credit', type: 'text', required: true },
    { name: 'license', label: 'Licenta', type: 'text', required: true },
    { name: 'aiGenerated', label: 'Generata sau modificata de AI', type: 'checkbox', defaultValue: false },
  ],
}
