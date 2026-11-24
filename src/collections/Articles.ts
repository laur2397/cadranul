import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { lexicalEditor, BlocksFeature, FixedToolbarFeature } from '@payloadcms/richtext-lexical'
import { autentificat, campDoarEditor, publicatSauRedactie, editorSauAdmin } from '../access/roluri'
import { BLOCURI_CORP } from '../blocks/corp'
import { verificaPublicarea, inregistreazaPublicarea } from '../hooks/publicare'
import { invalideazaDupaSchimbare, invalideazaDupaStergere } from '../hooks/invalideaza'

// Timpul de citire, calculat din text la fiecare salvare (200 de cuvinte pe minut)
const timpCitire: CollectionBeforeChangeHook = ({ data }) => {
  const cuvinte: string[] = []
  const strange = (n: unknown): void => {
    if (!n || typeof n !== 'object') return
    const o = n as Record<string, unknown>
    if (typeof o.text === 'string') cuvinte.push(o.text)
    if (o.fields && typeof o.fields === 'object') for (const v of Object.values(o.fields as object)) if (typeof v === 'string') cuvinte.push(v)
    for (const c of (o.children as unknown[]) || []) strange(c)
    if (o.root) strange(o.root)
  }
  strange(data?.body)
  const n = [data?.dek || '', ...((data?.summary || []) as { x?: string }[]).map((s) => s.x || ''), ...cuvinte].join(' ').split(/\s+/).filter(Boolean).length
  if (data) data.readingTime = Math.max(1, Math.ceil(n / 200))
  return data
}

export const TIPURI = [
  { label: 'Știre', value: 'stire' }, { label: 'Explicat', value: 'explicatie' }, { label: 'Analiză', value: 'analiza' },
  { label: 'Ghid', value: 'ghid' }, { label: 'Opinie', value: 'opinie' }, { label: 'Interviu', value: 'interviu' },
  { label: 'Investigație', value: 'ancheta' }, { label: 'Advertorial (conținut plătit)', value: 'advertorial' },
]

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Articol', plural: 'Articole' },
  admin: { useAsTitle: 'title', group: 'Redacție', defaultColumns: ['title', 'section', 'region', '_status', 'publishedAt'], listSearchableFields: ['title', 'slug'] },
  versions: { drafts: true, maxPerDoc: 50 },
  access: { read: publicatSauRedactie, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: { beforeChange: [timpCitire, verificaPublicarea], afterChange: [inregistreazaPublicarea, invalideazaDupaSchimbare], afterDelete: [invalideazaDupaStergere] },
  fields: [
    {
      name: 'slug', label: 'Adresa (/articol/...)', type: 'text', required: true, unique: true, index: true,
      admin: { position: 'sidebar', description: 'Litere mici fără diacritice, cifre și cratime. Nu se schimbă după publicare.' },
      validate: (v: unknown) => (typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? true : 'Doar litere mici fără diacritice, cifre și cratime.'),
    },
    {
      name: 'type', label: 'Tip', type: 'select', required: true, defaultValue: 'stire', options: TIPURI, admin: { position: 'sidebar' },
      validate: (v: unknown, { req }: { req: { user?: { roles?: string[] } | null; context?: Record<string, unknown> } }) =>
        v === 'advertorial' && !req.context?.importDemo && !req.user?.roles?.some((r) => r === 'admin' || r === 'editor') ? 'Doar un editor poate marca un advertorial.' : true,
    },
    { name: 'section', label: 'Secțiune', type: 'relationship', relationTo: 'sections', required: true, index: true, admin: { position: 'sidebar' } },
    { name: 'label', label: 'Eticheta afișată (opțional, ex. „Utilități”)', type: 'text', admin: { position: 'sidebar', description: 'Gol = numele secțiunii.' } },
    { name: 'region', label: 'Ediția (gol = națională)', type: 'relationship', relationTo: 'regions', index: true, admin: { position: 'sidebar' } },
    { name: 'counties', label: 'Județe (etichete)', type: 'relationship', relationTo: 'counties', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'tags', label: 'Teme', type: 'relationship', relationTo: 'tags', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'publishedAt', label: 'Publicat la', type: 'date', index: true, admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    {
      name: 'priority', label: 'Importanță (1 = cea mai mare)', type: 'number', defaultValue: 3, min: 1, max: 5,
      admin: { position: 'sidebar', description: '1-2 = apare și pe harta și în știrile naționale, chiar dacă e regională.' },
    },
    {
      name: 'place', label: 'Locul pe hartă', type: 'group', admin: { position: 'sidebar', description: 'Gol = fără punct pe hartă.' }, fields: [
        { name: 'name', label: 'Localitatea (afișată)', type: 'text' },
        { name: 'lat', label: 'Latitudine', type: 'number' },
        { name: 'lon', label: 'Longitudine', type: 'number' },
      ],
    },

    { name: 'title', label: 'Titlu', type: 'text', required: true },
    { name: 'seoTitle', label: 'Titlu pentru căutare (max. 70)', type: 'text', maxLength: 70 },
    { name: 'dek', label: 'Șapou (fraza de sub titlu)', type: 'textarea', maxLength: 320 },
    {
      name: 'titleCheck', label: 'Am verificat: răspunsul la titlu apare în primele două rânduri', type: 'checkbox',
      admin: { description: 'Obligatoriu la publicare.' },
    },
    { name: 'summary', label: 'Pe scurt (3 puncte)', type: 'array', maxRows: 5, fields: [{ name: 'x', type: 'textarea', required: true }] },
    {
      name: 'forYou', label: 'Ce înseamnă pentru tine (la articolele importante)', type: 'group', fields: [
        { name: 'who', label: 'Pe cine privește', type: 'textarea' },
        { name: 'when', label: 'De când', type: 'textarea' },
        { name: 'todo', label: 'Ce ai de făcut', type: 'textarea' },
      ],
    },
    {
      name: 'body', label: 'Textul articolului', type: 'richText',
      editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature(), BlocksFeature({ blocks: BLOCURI_CORP })] }),
    },
    { name: 'authors', label: 'Autori', type: 'relationship', relationTo: 'authors', hasMany: true },
    {
      name: 'image', label: 'Fotografia principală', type: 'group', fields: [
        { name: 'file', label: 'Încarcă', type: 'upload', relationTo: 'media' },
        { name: 'src', label: 'sau: imagine din biblioteca site-ului (ex. /img/05-spital-700.jpg)', type: 'text' },
        { name: 'alt', label: 'Text alternativ: ce se vede', type: 'text' },
        { name: 'caption', label: 'Legenda', type: 'text' },
        { name: 'credit', type: 'text' },
        { name: 'chart', label: 'Grafic live peste fotografie', type: 'select', options: [{ label: 'Prețul curentului azi', value: 'energie' }] },
      ],
    },
    {
      name: 'sources', label: 'Surse', type: 'array', fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'url', type: 'text' },
      ],
    },
    { name: 'updates', label: 'Actualizări', type: 'array', fields: [{ name: 'at', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } }, { name: 'x', type: 'textarea', required: true }] },
    { name: 'corrections', label: 'Corecturi (publice, cu data lor)', type: 'array', fields: [{ name: 'at', type: 'date', required: true }, { name: 'x', type: 'textarea', required: true }] },
    {
      name: 'sponsor', label: 'Clientul (advertorial)', type: 'group', admin: { condition: (d) => d?.type === 'advertorial' },
      access: { update: campDoarEditor }, fields: [{ name: 'name', type: 'text' }, { name: 'url', type: 'text' }],
    },
    { name: 'readingTime', label: 'Timp de citire (minute, automat)', type: 'number', admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'aiAssisted', label: 'AI a contribuit la text (calculat din proveniență)', type: 'checkbox', defaultValue: false,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
