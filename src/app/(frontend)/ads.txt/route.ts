import { text } from '@/site/raspuns'

export const dynamic = 'force-dynamic'
// Servit text/plain, cod 200, fara redirectionare. Liniile vin din ADS_TXT_LINES (separate prin \n),
// doar dupa deschiderea conturilor de reclame ale firmei editoare.
export function GET() {
  const dom = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  const linii = (process.env.ADS_TXT_LINES || '').split('\\n').map((l) => l.trim()).filter(Boolean)
  return text([dom && !dom.startsWith('localhost') ? `OWNERDOMAIN=${dom}` : '# OWNERDOMAIN se completeaza la lansare', ...linii, ''].join('\n'))
}
