import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { doarAdmin, are } from '../access/roluri'

// Conturile redactiei. Fiecare cont are un om real si un rol. Doi factori se impun la nivelul
// furnizorului de identitate la lansare; aici se pastreaza rolurile si regiunile.
// Primul cont creat in /admin (cand baza e goala) devine administrator.
const primulEsteAdmin: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data
  const n = await req.payload.count({ collection: 'users', req })
  if (n.totalDocs === 0) data.roles = ['admin']
  return data
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Utilizator', plural: 'Utilizatori' },
  admin: { useAsTitle: 'email', group: 'Administrare' },
  auth: { maxLoginAttempts: 5, lockTime: 15 * 60 * 1000, tokenExpiration: 8 * 60 * 60 },
  hooks: { beforeChange: [primulEsteAdmin] },
  access: {
    read: ({ req }) => !!req.user,
    create: doarAdmin,
    update: ({ req, id }) => are(req.user as never, 'admin') || req.user?.id === id,
    delete: doarAdmin,
  },
  fields: [
    { name: 'name', label: 'Nume', type: 'text', required: true },
    {
      name: 'roles', label: 'Roluri', type: 'select', hasMany: true, required: true, defaultValue: ['reporter'],
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Reporter', value: 'reporter' },
      ],
      access: { update: ({ req }) => are(req.user as never, 'admin') },
    },
    { name: 'regions', label: 'Regiuni in care lucreaza', type: 'relationship', relationTo: 'regions', hasMany: true },
    { name: 'author', label: 'Profil public de autor', type: 'relationship', relationTo: 'authors' },
  ],
}
