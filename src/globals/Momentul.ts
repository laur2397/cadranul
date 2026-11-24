import type { GlobalConfig } from 'payload'
import { editorSauAdmin } from '../access/roluri'
import { invalideazaGlobal } from '../hooks/invalideaza'
import { EDITII } from '../collections/Frontpages'

// „Fraza momentului” de sub salut si salutul insusi, pe editii. Gol = se compune automat din date.
export const Momentul: GlobalConfig = {
  slug: 'momentul',
  label: 'Fraza momentului',
  admin: { group: 'Redacție', description: 'Textul de sub „Bună dimineața”. Butoane: {vreme|cod galben de ninsoare}, {drum|A1|spre Pitești}, {avarii|Apa caldă se oprește joi}, {joburi|180 de locuri noi}, {ieftin|12:00 și 15:00}.' },
  access: { read: () => true, update: editorSauAdmin },
  hooks: { afterChange: [invalideazaGlobal] },
  fields: [
    {
      name: 'items', label: 'Fraze pe ediții', type: 'array', fields: [
        { type: 'row', fields: [
          { name: 'edition', label: 'Ediția', type: 'select', required: true, options: EDITII, admin: { width: '40%' } },
          { name: 'until', label: 'Valabilă până la (gol = mereu)', type: 'date', admin: { width: '60%', date: { pickerAppearance: 'dayAndTime' } } },
        ] },
        { name: 'greeting', label: 'Salut special (opțional, ex. „Crăciun fericit, Craiova.”)', type: 'text' },
        { name: 'phrase', label: 'Fraza', type: 'textarea' },
      ],
    },
    {
      type: 'row', fields: [
        { name: 'pensionPct', label: 'Calculatorul de pensie: creșterea (%)', type: 'number', defaultValue: 6.1, admin: { width: '50%' } },
        { name: 'pensionFrom', label: 'de la data (text afișat)', type: 'text', defaultValue: '1 ianuarie 2027', admin: { width: '50%' } },
      ],
    },
    { name: 'nextUpdate', label: 'Sub „Ești la zi” (ex. Următoarea actualizare mare: ediția de seară, la 18:00.)', type: 'text', defaultValue: 'Următoarea actualizare mare: ediția de seară, la 18:00.' },
  ],
}
