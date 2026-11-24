import type { GlobalConfig } from 'payload'
import { doarAdmin } from '../access/roluri'
import { invalideazaGlobal } from '../hooks/invalideaza'

// Datele editorului (apar in subsol, in paginile legale si in datele structurate).
// Locurile goale [..] se completeaza cand e stabilita firma editoare.
export const Site: GlobalConfig = {
  slug: 'site',
  label: 'Publicația',
  admin: { group: 'Administrare' },
  access: { read: () => true, update: doarAdmin },
  hooks: { afterChange: [invalideazaGlobal] },
  fields: [
    { name: 'name', type: 'text', defaultValue: 'Cadranul' },
    { name: 'tagline', type: 'text', defaultValue: 'România, oră de oră.' },
    {
      name: 'publisher', label: 'Editorul', type: 'group', fields: [
        { name: 'legalName', type: 'text', defaultValue: '[Denumire SRL]' },
        { name: 'cui', type: 'text', defaultValue: '[RO…]' },
        { name: 'orc', type: 'text', defaultValue: '[J…/…/…]' },
        { name: 'address', type: 'text', defaultValue: '[Adresa completă a sediului]' },
        { name: 'email', type: 'text', defaultValue: 'redactie@cadranul.ro' },
        { name: 'phone', type: 'text', defaultValue: '[+40 …]' },
        { name: 'dpoEmail', type: 'text', defaultValue: 'date@cadranul.ro' },
      ],
    },
  ],
}
