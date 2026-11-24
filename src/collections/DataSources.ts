import type { CollectionConfig } from 'payload'
import { are, autentificat, doarAdmin } from '../access/roluri'

// Registrul surselor de date automate (src/surse). Un rand pe conector: comutatorul de oprire,
// statutul legal, ultima rulare si ultima eroare. Randurile le creeaza conectorii la prima rulare.
export const STATUT_LEGAL = [
  { label: 'Date publice oficiale (se pot prelua cu citarea sursei)', value: 'public_official' },
  { label: 'Necesită acordul sursei (oprit până la răspuns)', value: 'needs_permission' },
  { label: 'Acord primit (scris)', value: 'permission_granted' },
  { label: 'API de partener (contract)', value: 'partner_api' },
]

export const DataSources: CollectionConfig = {
  slug: 'data-sources',
  labels: { singular: 'Sursă de date', plural: 'Surse de date (automate)' },
  admin: {
    useAsTitle: 'name', group: 'Date utile',
    defaultColumns: ['name', 'enabled', 'legalStatus', 'lastStatus', 'lastSuccess', 'itemsWritten', 'consecutiveFailures'],
    description: 'Importurile automate: ce sursă, dacă are voie să ruleze, când a mers ultima dată. Starea și din terminal: npm run surse:status.',
  },
  access: {
    read: autentificat,
    create: doarAdmin,
    // doar administratorul poate porni o sursa; editorul poate doar s-o opreasca (comutatorul de urgenta)
    update: ({ req }) => are(req.user as never, 'admin', 'editor'),
    delete: doarAdmin,
  },
  hooks: {
    beforeChange: [({ data, originalDoc, req, operation }) => {
      if (operation !== 'update' || req.context?.surse || are(req.user as never, 'admin')) return data
      if (data.enabled && !originalDoc?.enabled) throw new Error('Doar administratorul poate porni o sursă de date.')
      return data
    }],
  },
  fields: [
    {
      type: 'row', fields: [
        { name: 'key', label: 'Conectorul', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true, width: '30%' } },
        { name: 'name', label: 'Sursa', type: 'text', required: true, admin: { width: '70%' } },
      ],
    },
    {
      type: 'row', fields: [
        { name: 'enabled', label: 'Pornit (comutatorul de oprire)', type: 'checkbox', defaultValue: false, admin: { width: '30%' } },
        {
          name: 'legalStatus', label: 'Statut legal', type: 'select', required: true, defaultValue: 'needs_permission', options: STATUT_LEGAL, admin: { width: '70%' },
        },
      ],
    },
    { name: 'url', label: 'Adresa de la care se descarcă', type: 'text', admin: { description: 'Se poate corecta aici dacă sursa își mută pagina. Gol = adresa din cod.' } },
    {
      type: 'row', fields: [
        { name: 'termsUrl', label: 'Termenii sursei', type: 'text', admin: { width: '50%' } },
        { name: 'attribution', label: 'Atribuirea afișată pe site', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'schedule', label: 'Frecvența', type: 'text', admin: { readOnly: true } },
    { name: 'requestLetter', label: 'Cererea de acces (ciornă)', type: 'text', admin: { readOnly: true, description: 'Fișierul din docs/cereri-acces/ de trimis de pe adresa firmei editoare.' } },
    { name: 'notes', label: 'Note', type: 'textarea' },
    {
      type: 'collapsible', label: 'Ultima rulare', fields: [
        {
          type: 'row', fields: [
            { name: 'lastStatus', label: 'Starea', type: 'select', admin: { readOnly: true, width: '25%' }, options: [
              { label: 'Reușit', value: 'ok' }, { label: 'Fără schimbări', value: 'neschimbat' }, { label: 'Eroare', value: 'eroare' }, { label: 'Oprit', value: 'oprit' },
            ] },
            { name: 'lastRun', label: 'Ultima rulare', type: 'date', admin: { readOnly: true, width: '25%', date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'lastSuccess', label: 'Ultimul succes', type: 'date', admin: { readOnly: true, width: '25%', date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'consecutiveFailures', label: 'Eșecuri la rând', type: 'number', defaultValue: 0, admin: { readOnly: true, width: '25%' } },
          ],
        },
        { name: 'itemsWritten', label: 'Documente scrise la ultimul succes', type: 'number', admin: { readOnly: true } },
        { name: 'lastError', label: 'Ultima eroare', type: 'textarea', admin: { readOnly: true } },
      ],
    },
    // ETag / Last-Modified pentru cereri conditionate (nu se afiseaza)
    { name: 'httpCache', type: 'json', admin: { hidden: true } },
  ],
}

// Jurnalul rularilor (un rand pe rulare; se curata automat dupa 30 de zile).
export const SourceRuns: CollectionConfig = {
  slug: 'source-runs',
  labels: { singular: 'Rulare import', plural: 'Surse de date: jurnal' },
  admin: { useAsTitle: 'connector', group: 'Date utile', defaultColumns: ['connector', 'startedAt', 'status', 'created', 'updated', 'expired', 'message'] },
  access: { read: autentificat, create: () => false, update: () => false, delete: doarAdmin },
  fields: [
    { name: 'connector', type: 'text', required: true, index: true },
    { name: 'startedAt', type: 'date', index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'durationMs', type: 'number' },
    { name: 'status', type: 'select', options: ['ok', 'neschimbat', 'eroare', 'oprit'] },
    { name: 'dryRun', type: 'checkbox' },
    { type: 'row', fields: [
      { name: 'created', type: 'number' }, { name: 'updated', type: 'number' }, { name: 'expired', type: 'number' }, { name: 'skipped', type: 'number' },
    ] },
    { name: 'message', type: 'textarea' },
  ],
}
