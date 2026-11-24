// Formatari comune (server + browser)
export const fmt = (n: number, d = 0) => n.toLocaleString('ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d })
export const pad = (n: number) => String(n).padStart(2, '0')
/** Numar mare scurt: 28.040 -> „28,0k” (ca pe stratul Joburi) */
export const scurt = (n: number) => (n >= 1000 ? fmt(n / 1000, 1) + 'k' : String(n))
/** Escapare pentru HTML (folosita si in browser) */
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
