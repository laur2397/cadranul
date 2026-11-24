import 'server-only'
import { DEMO } from '../lib/rute'
import { h, type Safe } from './html'

// Locurile de reclama din designul D. Toate poarta eticheta „Publicitate” si au spatiul rezervat
// (textul nu sare). In modul demonstrativ arata reclamele fictive din prototip; in productie,
// locul se umple doar de incarcatorul unic (src/client/consimtamant.ts), dupa decizia cititorului.
// Fara cont de reclame configurat, locul nu se afiseaza deloc.

export type Format = 'bill' | 'mrec' | 'half'
const MARIMI: Record<Format, [number, number]> = { bill: [970, 250], mrec: [300, 250], half: [300, 600] }
export type Creatie = { titlu: string; sub: string; img: string; firma?: string; cta?: string }

const configurat = () => !!(process.env.NEXT_PUBLIC_GAM_NETWORK || process.env.NEXT_PUBLIC_ADSENSE_CLIENT)

const eticheta = (w?: number) => h`<div class="adlabel"${w ? h` style="width:${w}px;max-width:100%"` : ''}><span>Publicitate</span><a href="/pagina/publicitate#de-ce" data-why>De ce văd asta?</a></div>`

/** Un loc de reclama. `id` = numele locului in Ad Manager (ex. acasa-billboard). */
export function reclama(format: Format, id: string, demo: Creatie, clasa = ''): Safe {
  const [w, hh] = MARIMI[format]
  if (DEMO()) {
    if (format === 'bill') {
      return h`<div class="ad bill-d ${clasa}" role="complementary" aria-label="Publicitate">${eticheta()}<a class="creative bill" href="/pagina/publicitate" rel="sponsored"><img class="cimg" src="${demo.img}" alt="" loading="lazy" width="407" height="250"><span class="ctx"><span>${demo.firma || ''}</span><b>${demo.titlu}</b><span>${demo.sub}</span><i>${demo.cta || 'Cere o ofertă'}</i></span></a></div>`
    }
    return h`<div class="ad ${clasa}" role="complementary" aria-label="Publicitate" style="width:${w}px;max-width:100%">${eticheta()}<a class="creative ${format}" href="/pagina/publicitate" rel="sponsored"><img class="cimg" src="${demo.img}" alt="" loading="lazy"><span class="ctx"><b>${demo.titlu}</b><span>${demo.sub}</span>${format === 'half' ? h`<i>${demo.cta || 'Vezi oferta'}</i>` : ''}</span></a></div>`
  }
  if (!configurat()) return h``
  return h`<div class="ad ${format === 'bill' ? 'bill-d' : ''} ${clasa}" role="complementary" aria-label="Publicitate" style="width:${w}px;max-width:100%">${eticheta()}<div class="adslot" data-slot="${id}" data-size="${w}x${hh}" style="width:${w}px;max-width:100%;height:${hh}px"></div></div>`
}

/** Billboard 970x250 pe calculator + 300x250 pe telefon (prima pagina, dupa stiri) */
export function billboard(id: string, demo: Creatie): Safe {
  if (DEMO()) {
    return h`${reclama('bill', id, demo)}<div class="ad bill-m" role="complementary" aria-label="Publicitate">${eticheta(300)}<a class="creative mrec" href="/pagina/publicitate" rel="sponsored"><img class="cimg" src="${demo.img}" alt="" loading="lazy"><span class="ctx"><b>${demo.titlu}</b><span>${demo.firma || ''}. ${demo.sub}</span></span></a></div>`
  }
  if (!configurat()) return h``
  return h`${reclama('bill', id, demo)}<div class="ad bill-m" role="complementary" aria-label="Publicitate">${eticheta(300)}<div class="adslot" data-slot="${id}-m" data-size="300x250" style="width:300px;height:250px"></div></div>`
}
