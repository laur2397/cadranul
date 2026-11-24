// Ora Romaniei (Europe/Bucharest), indiferent de fusul orar al serverului.
const TZ = 'Europe/Bucharest'
const parti = (d: Date) => {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
  const o: Record<string, string> = {}
  for (const p of f.formatToParts(d)) o[p.type] = p.value
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, min: +o.minute }
}
export const oraRO = (d: Date) => { const p = parti(d); return { h: p.h, m: p.min } }
/** Ziua in Romania, AAAA-LL-ZZ */
export const ziRO = (d: Date) => { const p = parti(d); return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` }
export const hhmm = (d: Date) => { const p = parti(d); return `${String(p.h).padStart(2, '0')}:${String(p.min).padStart(2, '0')}` }

const ZILE = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă']
const LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']
const LUNI_SCURT = ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.']

/** „Marți, 24 noiembrie” */
export function dataLunga(d: Date) {
  const p = parti(d)
  const wd = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()
  return `${ZILE[wd]}, ${p.d} ${LUNI[p.m - 1]}`
}
/** „24 noiembrie 2026” */
export const dataSimpla = (d: Date) => { const p = parti(d); return `${p.d} ${LUNI[p.m - 1]} ${p.y}` }

/** Ziua cu `zile` mai devreme/tarziu, AAAA-LL-ZZ */
export function ziPlus(zi: string, zile: number) {
  const [y, m, d] = zi.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + zile))
  return t.toISOString().slice(0, 10)
}

/** Momentul (Date) corespunzator orei hh:mm din ziua `zi` in Romania */
export function laOraRO(zi: string, ora: string): Date {
  const [y, m, d] = zi.split('-').map(Number)
  const [hh, mm] = ora.split(':').map(Number)
  let t = Date.UTC(y, m - 1, d, hh, mm)
  // corectam cu decalajul Romaniei in acel moment (UTC+2 iarna, UTC+3 vara)
  for (let i = 0; i < 2; i++) {
    const p = parti(new Date(t))
    const vazut = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min)
    t += Date.UTC(y, m - 1, d, hh, mm) - vazut
  }
  return new Date(t)
}

/** Cand s-a publicat, scurt: „07:58”, „ieri”, „12 nov.” */
export function cand(d: Date, acum: Date) {
  const z = ziRO(d), az = ziRO(acum)
  if (z === az) return hhmm(d)
  if (z === ziPlus(az, -1)) return 'ieri'
  const p = parti(d)
  return `${p.d} ${LUNI_SCURT[p.m - 1]}`
}
/** „Aseară, la 22:14” / „Azi, la 07:10” / „Pe 20 noiembrie, la 9:00” */
export function candLung(d: Date, acum: Date) {
  const z = ziRO(d), az = ziRO(acum), o = hhmm(d), h = oraRO(d).h
  if (z === az) return `Azi, la ${o}`
  if (z === ziPlus(az, -1)) return `${h >= 18 ? 'Aseară' : 'Ieri'}, la ${o}`
  const p = parti(d)
  return `Pe ${p.d} ${LUNI[p.m - 1]}, la ${o}`
}

/** Salutul dupa ora */
export function salut(h: number) {
  if (h >= 5 && h < 11) return 'Bună dimineața'
  if (h >= 11 && h < 18) return 'Bună ziua'
  if (h >= 18 && h < 23) return 'Bună seara'
  return 'Noapte bună'
}
