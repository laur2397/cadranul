import 'server-only'
import { fmt } from '../shared/format'
import { curbaFotoHTML, curbaHTML } from '../shared/energie'
import { lexicalInBlocuri, type BlocProto } from '../lib/lexical'
import { DEMO } from '../lib/rute'
import { h, raw, type Safe } from './html'
import { imagine, payloadul, type Art, type Reg, type Snap } from './date'
import { reclama } from './reclame'
import { ic, pagina } from './shell'
import { calcPensie, calcPlin, fuelCard, selectie } from './acasa'
import { candLung, dataSimpla, hhmm, oraRO, ziRO } from './timp'
import { jsonLdArticol, jsonLdFirimituri, jsonLdOrganizatie } from './seo'

type Doc = Record<string, any>

const slugTitlu = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
const textDin = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, ' ')

/** Articolul complet, din baza de date (doar publicat) */
export async function incarcaArticol(slug: string): Promise<Doc | null> {
  const payload = await payloadul()
  const r = await payload.find({ collection: 'articles', where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] }, depth: 1, limit: 1, overrideAccess: false })
  return (r.docs[0] as Doc) || null
}

const DEMO_REC: [string, string, string][] = [
  ['/img/36-piata-700.jpg', 'Piața volantă de Crăciun: producători din Dolj, în fiecare sâmbătă', 'Agroland Oltenia'],
  ['/img/15-scena-700.jpg', 'Concert de Crăciun la Craiova, bilete de la 40 de lei', 'Agenția Bilete Sud'],
  ['/img/20-tren-700.jpg', 'Weekend la Herculane, cu trenul inclus', 'Agenția Banat Tur'],
]

function graficBare(b: Extract<BlocProto, { t: 'chart' }>): Safe {
  const max = Math.max(...b.values, 1)
  const W = 680, bh = 26, H = b.labels.length * (bh + 8)
  const rows = b.labels.map((l, i) => {
    const w = (b.values[i] / max) * (W - 230)
    return `<text x="0" y="${i * (bh + 8) + 18}">${l.replace(/[<&]/g, '')}</text><rect x="150" y="${i * (bh + 8)}" width="${w.toFixed(1)}" height="${bh}" rx="5" fill="var(--brand)"/><text x="${(156 + w).toFixed(1)}" y="${i * (bh + 8) + 18}" style="font-weight:750;fill:var(--ink)">${fmt(b.values[i], b.values[i] % 1 ? 1 : 0)}${b.unit ? ' ' + b.unit.replace(/[<&]/g, '') : ''}</text>`
  }).join('')
  return h`<div class="embed"><h3>${b.title}</h3><svg class="curve" viewBox="0 0 ${W} ${H}" role="img" aria-label="${b.title}">${raw(rows)}</svg>${b.source ? h`<div class="demo">Sursa: ${b.source}</div>` : ''}</div>`
}

function calcCurentArticol(): Safe {
  return h`<div class="embed calc" id="artCalc"><h3>Cât economisești tu</h3><p class="sub">Bifează ce poți porni la prânz în loc de seară.</p>
  <div class="apps" id="apps2">
    <label><input type="checkbox" value="1" checked> Mașina de spălat <em>1 kWh/ciclu</em></label>
    <label><input type="checkbox" value="0.9" checked> Mașina de vase <em>0,9 kWh</em></label>
    <label><input type="checkbox" value="2.2"> Boilerul electric <em>2,2 kWh</em></label>
    <label><input type="checkbox" value="7"> Mașina electrică <em>7 kWh</em></label></div>
  <div class="res"><small>Cu preț dinamic, pe an</small><b class="num" id="eOut2">…</b><span id="eDiff2"></span></div></div>`
}

/** Corpul articolului, cu reclamele puse automat: dupa paragraful 3, apoi la cel putin 350 de cuvinte */
function corp(blocuri: BlocProto[], snap: Snap, ed: Reg | null, acum: Date, toc: [string, string][]): { html: Safe; cuvinte: number } {
  const { h: ora, m: min } = oraRO(acum)
  const out: Safe[] = []
  let par = 0, cuvinte = 0, dupaReclama = -1, reclame = 0
  const totalPar = blocuri.filter((b) => b.t === 'p').length
  const ADS = [
    { titlu: 'Analizele anuale, cu 20% reducere în decembrie', sub: 'Laboratorul Medica Plus, Craiova și Târgu Jiu.', img: '/img/28-laborator-700.jpg' },
    { titlu: 'Panouri pe casă, montate în 3 zile', sub: 'Solar Jiu, Târgu Jiu. Calcul gratuit pentru acoperișul tău.', img: '/img/19-camp-700.jpg' },
  ]
  for (const b of blocuri) {
    switch (b.t) {
      case 'p': {
        out.push(h`<p>${raw(b.x)}</p>`)
        par++; const n = textDin(b.x).split(/\s+/).filter(Boolean).length; cuvinte += n
        if (dupaReclama >= 0) dupaReclama += n
        const pune = (reclame === 0 && par === 3 && totalPar >= 5) || (reclame === 1 && dupaReclama >= 350 && par < totalPar - 1)
        if (pune) {
          const r = reclama('mrec', `articol-text-${reclame + 1}`, ADS[reclame])
          if (r.s) out.push(h`<div class="inline-ad">${r}</div>`)
          reclame++; dupaReclama = 0
        }
        break
      }
      case 'h2': { const id = slugTitlu(b.x) || `s${toc.length}`; toc.push([id, textDin(b.x)]); out.push(h`<h2 id="${id}">${raw(b.x)}</h2>`); break }
      case 'list': out.push(h`<ul>${b.items.map((i) => h`<li>${raw(i)}</li>`)}</ul>`); break
      case 'quote': out.push(h`<blockquote>${raw(b.x)}${b.by ? h`<footer class="qby">${b.by}</footer>` : ''}</blockquote>`); break
      case 'energie':
        if (snap.pret) out.push(h`<div class="embed"><h3>${b.title || 'Curentul azi, oră de oră'}</h3><p class="sub">${b.sub || ''}</p><div id="artCurve">${raw(curbaHTML(snap.pret.values, ora, min))}</div><div class="demo">${DEMO() ? 'Cifre demonstrative. ' : ''}Graficul se actualizează în fiecare zi la 14:00 pentru ziua următoare. Sursa: ${snap.pret.source}.</div></div>`)
        break
      case 'calc':
        if (b.kind === 'curent') out.push(calcCurentArticol())
        else if (b.kind === 'pensie') out.push(h`<div class="embed-calc">${calcPensie(snap.pensie, 2450)}</div>`)
        else out.push(h`<div class="embed-calc">${calcPlin(snap, ed, fuelCard(snap, ed).f)}</div>`)
        break
      case 'timeline': {
        const id = slugTitlu(b.title || 'cronologie') || 'cronologie'
        toc.push([id, b.title || 'Cronologie'])
        out.push(h`<h2 id="${id}">${b.title || 'Cum am ajuns aici'}</h2><ol class="timeline">${b.items.map((i) => h`<li><b>${i.when}</b><span>${i.x}</span></li>`)}</ol>`)
        break
      }
      case 'data': out.push(h`<div class="embed"><h3>${b.title}</h3><div class="tablewrap"><table class="tbl"><thead><tr>${b.cols.map((c) => h`<th scope="col">${c}</th>`)}</tr></thead><tbody>${b.rows.map((r) => h`<tr>${r.map((c) => h`<td>${String(c)}</td>`)}</tr>`)}</tbody></table></div>${b.source ? h`<div class="demo">Sursa: ${b.source}</div>` : ''}</div>`); break
      case 'chart': out.push(graficBare(b)); break
      case 'related': { const a = snap.artBySlug.get(b.id); if (a) out.push(h`<p class="readalso"><span>Citește și</span> <a href="/articol/${a.slug}">${a.title}</a></p>`); break }
    }
  }
  return { html: h`${out}`, cuvinte }
}

export function paginaArticol(snap: Snap, d: Doc, ed: Reg | null, acum: Date, ultimaVizita: number | null): string {
  const a: Art = snap.artBySlug.get(d.slug) || {
    id: d.id, slug: d.slug, title: d.title, dek: d.dek || '', sec: { id: 0, slug: d.section?.slug || 'stiri', name: d.section?.name || 'Știri' }, label: d.label || d.section?.name || 'Știri',
    regKey: '', counties: [], place: null, img: imagine(d.image, new Map()), pub: new Date(d.publishedAt), upd: new Date(d.updatedAt), prio: d.priority ?? 3, type: d.type, authors: [], min: d.readingTime || 2,
  }
  if (d.image?.file && typeof d.image.file === 'object') a.img = { ...a.img, src: d.image.file.sizes?.hero?.url || d.image.file.url || a.img.src }
  const sel = selectie(snap, ed, acum, ultimaVizita)
  const blocuri = lexicalInBlocuri(d.body, (r) => { const id = typeof r === 'object' && r ? (r as Doc).id : r; const x = snap.arts.find((y) => y.id === id); return x ? { slug: x.slug, title: x.title } : null })
  const toc: [string, string][] = []
  const { html: corpHTML, cuvinte } = corp(blocuri, snap, ed, acum, toc)
  const { h: ora, m: min } = oraRO(acum)
  const explicat = a.type === 'explicatie'
  const platit = a.type === 'advertorial'
  const nou = sel.noi.has(a.slug)
  const lista = sel.seven.map((x) => x.slug)
  const idx = lista.indexOf(a.slug)
  const urm = snap.artBySlug.get(lista[(idx + 1) % lista.length] === a.slug ? lista[(idx + 2) % lista.length] : lista[(idx + 1) % Math.max(lista.length, 1)]) || sel.grila.find((x) => x.slug !== a.slug)
  const facute = lista.filter((x) => x === a.slug).length
  const autori = a.authors.length ? a.authors : ((d.authors || []) as Doc[]).filter((x) => typeof x === 'object').map((x) => ({ slug: x.slug, name: x.name, base: x.base, initials: x.initials }))
  const autor = autori[0]
  const initiale = autor ? (autor.initials || autor.name.split(/\s+/).map((x: string) => x[0]).join('').slice(0, 2)) : 'C'
  const actualizat = ((d.updates || []) as Doc[]).map((u) => new Date(u.at)).sort((x, y) => +y - +x)[0]
  const updDate = actualizat && +actualizat > +a.pub ? actualizat : a.pub
  const corecturi = (d.corrections || []) as Doc[]
  const sumar = ((d.summary || []) as Doc[]).map((s) => s.x as string)
  const fy = d.forYou || {}
  const legate = snap.arts.filter((x) => x.sec.slug === a.sec.slug && x.slug !== a.slug && x.type !== 'advertorial').slice(0, 3)
  const legate3 = legate.length >= 3 ? legate : legate.concat(sel.grila.filter((x) => x.slug !== a.slug && !legate.includes(x)).slice(0, 3 - legate.length))
  const crumbEd = ed ? h`<a href="/editie/${ed.slug}">Cadranul ${ed.short}</a>` : h`<a href="/">Prima pagină</a>`
  const redactia = autor?.base || (ed ? ed.city : 'București')
  const cand = ziRO(a.pub) === ziRO(acum) ? `Azi, la ${hhmm(a.pub)}` : candLung(a.pub, acum)

  const main = h`
<div class="art">
  <article class="art-main" aria-labelledby="artT" data-id="${a.slug}">
    <div class="crumb">${crumbEd}<span>/</span><a class="sec" href="/${a.sec.slug === 'energie' ? 'energie' : a.sec.slug}">${a.label}</a>${explicat ? h`<span class="lv">Explicat</span>` : ''}${nou ? h`<span class="lv" style="color:var(--live-ink)">Nou</span>` : ''}${platit ? h`<span class="lv">Conținut plătit${d.sponsor?.name ? ` de ${d.sponsor.name}` : ''}</span>` : ''}</div>
    <h1 id="artT">${a.title}</h1>
    <p class="dek">${a.dek}</p>
    <div class="byline"><span class="av" aria-hidden="true">${initiale}</span><span>${autor ? h`<b><a href="/autor/${autor.slug}" class="bylink">${autor.name}</a></b>, redacția ${redactia}` : h`<b>Redacția Cadranul</b>`}<br>${cand}${+updDate > +a.pub ? `, actualizat la ${hhmm(updDate)}` : ''}, ${a.min} min de citit</span>
      <span class="acts"><button class="pill" id="listenBtn">${ic('play')}Ascultă, ${a.min + 1} min</button><button class="pill" aria-pressed="false" id="saveBtn">${ic('save')}Salvează</button><button class="pill" id="shareBtn">${ic('share')}Trimite</button></span></div>
    <figure><div class="${a.img.chart === 'energie' && snap.pret ? 'livefig' : ''}" id="heroFig"><img src="${a.img.src}" alt="${a.img.alt}" fetchpriority="high">${a.img.chart === 'energie' && snap.pret ? raw(curbaFotoHTML(snap.pret.values, ora, min)) : ''}</div><figcaption>${a.img.caption || ''}${a.img.credit ? ` Foto: ${a.img.credit}.` : ''}</figcaption></figure>
    ${sumar.length ? h`<div class="brief"><h2>Pe scurt</h2><ul>${sumar.map((x) => h`<li>${x}</li>`)}</ul></div>` : ''}
    ${fy.who || fy.when || fy.todo ? h`<div class="foryou"><h2>Ce înseamnă pentru tine</h2><div><b>Pe cine privește</b>${fy.who || ''}</div><div><b>De când</b>${fy.when || ''}</div><div><b>Ce ai de făcut</b>${fy.todo || ''}</div></div>` : ''}
    <div class="body" id="artBody">${corpHTML}</div>
    ${((d.sources || []) as Doc[]).length ? h`<p class="sources"><b>Surse:</b> ${((d.sources || []) as Doc[]).map((s, i) => h`${i ? ', ' : ''}${s.url ? h`<a href="${s.url}" rel="noopener">${s.name}</a>` : s.name}`)}.</p>` : ''}
    ${urm ? h`<section class="endcard" aria-label="Ai terminat">
      <div class="row"><span class="big">Ai terminat.</span><span id="endTxt" data-total="${lista.length}">${Math.max(1, facute)} din ${lista.length || 7} subiecte azi. Încă ${Math.max(0, (lista.length || 7) - Math.max(1, facute))} și ești la zi.</span></div>
      <a class="next" href="/articol/${urm.slug}"><img src="${urm.img.src}" alt="" loading="lazy"><span><small>Următorul subiect</small><b>${urm.title}</b></span></a>
      <div class="row"><button class="pill" id="followBtn" aria-pressed="false" data-topic="${a.sec.slug}">${ic('bell')}Urmărește subiectul ${a.label}</button><span style="font-size:13.5px;opacity:.75">Primești o notificare doar când apare ceva nou.</span></div>
    </section>` : ''}
    <div class="helpful"><span>Ți-a fost util?</span><button class="pill" data-help>Da</button><button class="pill" data-help>Nu prea</button><a class="pill" href="mailto:${snap.site.publisher.email || 'redactie@cadranul.ro'}?subject=${encodeURIComponent('Despre: ' + a.title)}">Trimite redacției</a></div>
    <div class="corr">${corecturi.length ? h`<p><b>Corecturi:</b></p><ul>${corecturi.map((c) => h`<li>${dataSimpla(new Date(c.at))}: ${c.x}</li>`)}</ul>` : ''}Am greșit ceva? Scrie-ne la <a href="mailto:corecturi@cadranul.ro">corecturi@cadranul.ro</a>. Corecturile apar la finalul articolului, cu data lor. <a href="/pagina/corecturi">Cum corectăm greșelile</a>.</div>
    <h2 style="font-size:20px;margin:26px 0 4px">Tot despre ${a.label.toLowerCase()}</h2>
    <div class="related">${legate3.map((x) => h`<a href="/articol/${x.slug}"><img src="${x.img.src}" alt="" loading="lazy"><b>${x.title}</b></a>`)}</div>
    ${DEMO() ? h`<div style="margin-top:26px"><div class="adlabel"><span>Publicitate, de la parteneri</span><a href="/pagina/publicitate#de-ce" data-why>De ce văd asta?</a></div>
      <div class="related" style="margin-top:6px">${DEMO_REC.map(([im, t, b]) => h`<a href="/pagina/publicitate" rel="sponsored"><img src="${im}" alt="" loading="lazy"><b>${t}</b><small style="color:var(--ink-2);font-size:12.5px">${b}, conținut plătit</small></a>`)}</div></div>` : ''}
  </article>
  <aside class="aside" aria-label="În articol">
    <div class="aside-in">
      ${toc.length >= 3 ? h`<nav class="toc" aria-label="Cuprins"><h2 class="toc-h">În articol</h2>${toc.map(([id, t]) => h`<a href="#${id}" data-t="${id}">${t}</a>`)}</nav><div class="remain" id="remain" data-min="${a.min}">${a.min} min rămase</div>` : ''}
      ${reclama('half', 'articol-lateral', { titlu: 'Lemne de foc uscate, livrate acasă în 24 de ore.', sub: 'Depozitul Gilort, Târgu Jiu. Livrăm în toată Oltenia, de la 2 steri.', img: '/img/33-padure-700.jpg' })}
    </div>
  </aside>
</div>`

  const corpText = blocuri.filter((b) => b.t === 'p').map((b) => textDin((b as { x: string }).x)).join(' ')
  void cuvinte
  return pagina({
    snap, acum, ed, titlu: `${a.seoTitle || a.title} | Cadranul`, descriere: a.dek.slice(0, 300), cale: `/articol/${a.slug}`, main, tip: 'article', imagine: a.img.src,
    jsonld: [jsonLdArticol(a, corpText, updDate), jsonLdFirimituri([['Cadranul', '/'], [a.sec.name, `/${a.sec.slug}`], [a.title, `/articol/${a.slug}`]]), jsonLdOrganizatie(snap)],
    preincarca: [a.img.src],
    client: { pagina: 'articol', id: a.slug, seven: lista, pr: snap.pret?.values || null, fuel: fuelCard(snap, ed).f, pensie: snap.pensie.pct },
  })
}
