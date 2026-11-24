import type { Block } from 'payload'

// Blocurile din corpul articolului (designul D). Paragrafele, subtitlurile, listele si legaturile
// sunt native in editorul Lexical. Reclamele din text NU sunt blocuri: le pune site-ul automat
// (dupa paragraful 3 si apoi la cel putin 350 de cuvinte), maxim 2 in text.

export const BlocTabel: Block = {
  slug: 'date',
  labels: { singular: 'Tabel de date', plural: 'Tabele de date' },
  fields: [
    { name: 'title', label: 'Titlu', type: 'text', required: true },
    { name: 'cols', label: 'Coloane', type: 'array', required: true, fields: [{ name: 'c', type: 'text', required: true }] },
    { name: 'rows', label: 'Rânduri', type: 'array', fields: [{ name: 'cells', type: 'array', fields: [{ name: 'v', type: 'text' }] }] },
    { name: 'source', label: 'Sursa', type: 'text', required: true },
  ],
}

export const BlocGrafic: Block = {
  slug: 'grafic',
  labels: { singular: 'Grafic', plural: 'Grafice' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'kind', type: 'select', defaultValue: 'bar', options: [{ label: 'Bare', value: 'bar' }, { label: 'Linie', value: 'line' }] },
    { name: 'unit', label: 'Unitate', type: 'text' },
    { name: 'points', label: 'Valori', type: 'array', required: true, fields: [
      { name: 'label', type: 'text', required: true }, { name: 'value', type: 'number', required: true },
    ] },
    { name: 'source', label: 'Sursa', type: 'text', required: true },
  ],
}

export const BlocCitat: Block = {
  slug: 'citat',
  labels: { singular: 'Citat', plural: 'Citate' },
  fields: [
    { name: 'x', label: 'Text', type: 'textarea', required: true },
    { name: 'by', label: 'Cine a spus / de unde', type: 'text' },
  ],
}

export const BlocCitesteSi: Block = {
  slug: 'citesteSi',
  labels: { singular: 'Citește și', plural: 'Citește și' },
  fields: [{ name: 'article', type: 'relationship', relationTo: 'articles', required: true }],
}

export const BlocEnergie: Block = {
  slug: 'energieAzi',
  labels: { singular: 'Grafic: prețul curentului azi (live)', plural: 'Grafice energie' },
  fields: [
    { name: 'title', type: 'text', defaultValue: 'Curentul azi, oră de oră' },
    { name: 'sub', type: 'text', defaultValue: 'Piața pentru ziua următoare, lei/MWh. Linia punctată arată ora la care citești.' },
  ],
}

export const BlocCalculator: Block = {
  slug: 'calculator',
  labels: { singular: 'Calculator „Cât primești tu”', plural: 'Calculatoare' },
  fields: [
    { name: 'kind', label: 'Calculator', type: 'select', required: true, options: [
      { label: 'Pensia din ianuarie', value: 'pensie' }, { label: 'Cât economisești la curent', value: 'curent' }, { label: 'Plinul la mașină', value: 'plin' },
    ] },
    { name: 'title', type: 'text' },
  ],
}

export const BlocCronologie: Block = {
  slug: 'cronologie',
  labels: { singular: 'Cronologie', plural: 'Cronologii' },
  fields: [
    { name: 'title', type: 'text', defaultValue: 'Cum am ajuns aici' },
    { name: 'items', type: 'array', required: true, fields: [{ name: 'when', label: 'Când', type: 'text', required: true }, { name: 'x', label: 'Ce s-a întâmplat', type: 'textarea', required: true }] },
  ],
}

export const BLOCURI_CORP = [BlocEnergie, BlocCalculator, BlocCronologie, BlocCitat, BlocGrafic, BlocTabel, BlocCitesteSi]
