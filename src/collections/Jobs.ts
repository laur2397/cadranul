import type { CollectionConfig } from 'payload'
import { autentificat, campDoarEditor, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'
import { regiuneDinJudet } from '../hooks/regiune'
import { campRegiuneAuto } from './campuri'

// Locuri de munca. „Promovat” = anunt platit de angajator (de la 149 lei/saptamana), marcat vizibil.
// Doar editorul poate seta promovarea (e vanzare).
export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Loc de muncă', plural: 'Locuri de muncă' },
  admin: { useAsTitle: 'title', group: 'Date utile', defaultColumns: ['title', 'employer', 'county', 'promoted', 'deadline', 'active'] },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: { beforeChange: [regiuneDinJudet], ...HOOKURI_DATE },
  fields: [
    { name: 'slug', label: 'Adresa (/joburi/...)', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar' },
      validate: (v: unknown) => (typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? true : 'Doar litere mici fără diacritice, cifre și cratime.') },
    { name: 'active', label: 'Activ (vizibil)', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { type: 'row', fields: [
      { name: 'title', label: 'Postul', type: 'text', required: true, admin: { width: '50%' } },
      { name: 'employer', label: 'Angajatorul (ex. Fabrică de componente auto, Filiași)', type: 'text', required: true, admin: { width: '50%' } },
    ] },
    { type: 'row', fields: [
      { name: 'county', label: 'Județ', type: 'relationship', relationTo: 'counties', required: true, index: true, admin: { width: '50%' } },
      { name: 'city', label: 'Localitatea', type: 'text', required: true, admin: { width: '50%' } },
    ] },
    campRegiuneAuto,
    { type: 'row', fields: [
      { name: 'salaryMin', label: 'Salariu de la (lei net)', type: 'number', admin: { width: '25%' } },
      { name: 'salaryMax', label: 'până la (lei net)', type: 'number', admin: { width: '25%' } },
      { name: 'salaryNote', label: 'Adaos (ex. + diurnă, + cazare)', type: 'text', admin: { width: '50%' } },
    ] },
    { name: 'where', label: 'Detaliu scurt (ex. transport asigurat, ture de 12 h, hibrid)', type: 'text' },
    { name: 'description', label: 'Descrierea postului', type: 'textarea' },
    { name: 'requirements', label: 'Cerințe (câte una pe rând)', type: 'textarea' },
    { type: 'row', fields: [
      { name: 'applyEmail', label: 'Aplici pe e-mail', type: 'email', admin: { width: '50%' } },
      { name: 'applyUrl', label: 'sau pe pagina angajatorului', type: 'text', admin: { width: '50%' } },
    ] },
    { name: 'deadline', label: 'Termen de aplicare', type: 'date' },
    { type: 'row', fields: [
      { name: 'promoted', label: 'Promovat (plătit)', type: 'checkbox', defaultValue: false, access: { update: campDoarEditor, create: campDoarEditor }, admin: { width: '50%' } },
      { name: 'promotedUntil', label: 'Promovat până la', type: 'date', access: { update: campDoarEditor, create: campDoarEditor }, admin: { width: '50%' } },
    ] },
    { name: 'source', label: 'Sursa anunțului', type: 'select', defaultValue: 'direct', admin: { position: 'sidebar' }, options: [
      { label: 'Direct de la angajator', value: 'direct' }, { label: 'Import (site de joburi)', value: 'import' },
    ] },
    { name: 'sourceUrl', label: 'Adresa anunțului original', type: 'text', admin: { position: 'sidebar' } },
  ],
}
