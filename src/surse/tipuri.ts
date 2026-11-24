// Tipurile comune ale conectorilor de date (src/surse).

export type StatutLegal = 'public_official' | 'needs_permission' | 'permission_granted' | 'partner_api'
export type Colectie = 'weather-alerts' | 'energy-prices' | 'fuel-prices' | 'road-events' | 'outages'

/** Cand ruleaza: la fiecare N minute, sau zilnic dupa o ora (ora Romaniei) cu reincercari pana la `pana`. */
export type Planificare = { laMinute: number } | { zilnicDupa: string; reincearcaMinute: number; pana: string }

/** Un document normalizat: campurile colectiei, cu judetele date ca slug (`county: 'dolj'`, `counties: ['dolj']`). */
export type Element = { externalId: string; data: Record<string, unknown> }

export type Rezultat = {
  elemente: Element[]
  /** sursa a raspuns 304 / nimic nou: nu atingem baza */
  neschimbat?: boolean
  /** sursa inca n-a publicat ce asteptam (ex. OPCOM pentru maine): reincercam mai tarziu */
  incomplet?: string
}

export type Descarcare = { status: number; text: string; url: string; neschimbat: boolean; etag?: string; lastModified?: string }
export type Descarca = (url: string, opt?: { conditionat?: boolean; accept?: string }) => Promise<Descarcare>

export type ContextRulare = {
  url: string
  acum: Date
  descarca: Descarca
  log: (m: string) => void
}

export type Conector = {
  key: string
  name: string
  collection: Colectie
  legal: StatutLegal
  /** pornit implicit la prima rulare (doar pentru date publice oficiale) */
  pornitImplicit: boolean
  url: string
  termsUrl: string
  /** ce scrie in campul `source` al documentelor si pe site („Sursa: ANM”) */
  atribuire: string
  planificare: Planificare
  frecventaText: string
  /** documentele acestui conector care lipsesc din ultima descarcare expira (until = acum) */
  expiraLipsa: boolean
  cerere?: string
  note?: string
  ruleaza: (ctx: ContextRulare) => Promise<Rezultat>
}
