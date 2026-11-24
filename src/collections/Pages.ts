import type { CollectionConfig } from 'payload'
import { doarAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

// Paginile legale si de incredere (/pagina/<slug>). Textele sunt modele care se valideaza de avocat.
// Continutul HTML il editeaza doar administratorul.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Pagină (legal, despre)', plural: 'Pagini (legal, despre)' },
  admin: { useAsTitle: 'title', group: 'Legal' },
  hooks: HOOKURI_DATE,
  access: { read: public_, create: doarAdmin, update: doarAdmin, delete: doarAdmin },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'short', label: 'Titlu scurt', type: 'text' },
    { name: 'updated', label: 'Actualizat (text afisat)', type: 'text' },
    { name: 'description', label: 'Descriere (pentru căutare)', type: 'text' },
    { name: 'html', type: 'code', admin: { language: 'html' }, required: true },
    { name: 'lawyerReviewed', label: 'Verificată de avocat', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Cât timp nu e bifată, pagina afișează nota „model, de verificat de avocat”.' } },
  ],
}
