// Geometria hartii din designul D, comuna serverului si scriptului din browser.
// Coordonatele sunt in spatiul SVG 1000x704 al hartii (proiectie simpla lon/lat, ca in prototip).

export const VB_TARA: [number, number, number, number] = [0, 0, 1000, 704]

/** lon/lat -> punct pe harta (identic cu P() din prototip) */
export const P = (lon: number, lat: number): [number, number] => [(lon - 20.2) * 104.71, (48.3 - lat) * 150.47]
/** punct pe harta -> lon/lat (pentru formulare si importuri) */
export const invP = (x: number, y: number): [number, number] => [x / 104.71 + 20.2, 48.3 - y / 150.47]

/** Cheile regiunilor pe harta, in ordinea din prototip */
export const ORDINE = ['ne', 'se', 'sm', 'sv', 'v', 'nv', 'c', 'bi'] as const
export type CheieRegiune = (typeof ORDINE)[number]

/** Pozitia etichetei regiunii pe harta nationala (REG.rp din prototip) */
export const ETICHETA_REGIUNE: Record<CheieRegiune, [number, number]> = {
  ne: [662, 170], se: [790, 500], sm: [560, 480], sv: [300, 520], v: [178, 478], nv: [330, 92], c: [440, 300], bi: [640, 640],
}

/** Diacriticele pentru cheile fara diacritice din datele hartii */
export const DIA: Record<string, string> = {
  Bucuresti: 'București', Constanta: 'Constanța', Brasov: 'Brașov', Pitesti: 'Pitești', Ploiesti: 'Ploiești', Timisoara: 'Timișoara', Iasi: 'Iași',
  Galati: 'Galați', Braila: 'Brăila', Bacau: 'Bacău', 'Targu Jiu': 'Târgu Jiu', 'Ramnicu Valcea': 'Râmnicu Vâlcea', 'Targu Mures': 'Târgu Mureș',
  Focsani: 'Focșani', Buzau: 'Buzău', Nadlac: 'Nădlac', Petrosani: 'Petroșani', Bals: 'Balș', Filiasi: 'Filiași', Sebes: 'Sebeș', Zalau: 'Zalău',
  Bistrita: 'Bistrița', Botosani: 'Botoșani', Calarasi: 'Călărași', Targoviste: 'Târgoviște', 'Sfantu Gheorghe': 'Sfântu Gheorghe', Resita: 'Reșița',
  Caransebes: 'Caransebeș', Fagaras: 'Făgăraș', Fetesti: 'Fetești', Orsova: 'Orșova', 'Piatra Neamt': 'Piatra Neamț', Neamt: 'Neamț', Arges: 'Argeș',
  Dambovita: 'Dâmbovița', Ialomita: 'Ialomița', Mehedinti: 'Mehedinți', Valcea: 'Vâlcea', 'Caras-Severin': 'Caraș-Severin', Timis: 'Timiș',
  'Bistrita-Nasaud': 'Bistrița-Năsăud', Maramures: 'Maramureș', Salaj: 'Sălaj', Mures: 'Mureș', 'Curtea de Arges': 'Curtea de Argeș', Cartisoara: 'Cârțișoara',
}
export const D = (n: string) => DIA[n] || n
/** Cheie fara diacritice (pentru potrivirea cu datele hartii) */
export const fara = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ș|ş/g, 's').replace(/ț|ţ/g, 't')

/** Orase suplimentare fata de datele hartii (din prototip) */
export const ORASE_EXTRA: Record<string, [number, number]> = {
  'Curtea de Arges': P(24.68, 45.14), Cartisoara: P(24.58, 45.71), Novaci: P(23.67, 45.18), Predeal: P(25.58, 45.50),
}

export type Punct = [number, number]

/** Curba Catmull-Rom -> Bezier, ca in prototip */
export function smooth(pts: Punct[]): string {
  if (pts.length < 3) return 'M' + pts.map((p) => p.join(',')).join('L')
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/** Cadrul (viewBox) in care „zboara” harta pentru o regiune */
export function fitVB(bbox: [number, number, number, number] | undefined, cheie?: string): [number, number, number, number] {
  if (!bbox) return [...VB_TARA]
  let [x, y, w, h] = bbox
  const padf = cheie === 'bi' ? 1.2 : 0.14
  x -= w * padf; y -= h * padf; w *= 1 + 2 * padf; h *= 1 + 2 * padf
  const A = 1000 / 704
  if (w / h < A) { const nw = h * A; x -= (nw - w) / 2; w = nw } else { const nh = w / A; y -= (nh - h) / 2; h = nh }
  return [x, y, w, h]
}

/** Starea unui tronson: aceleasi clase CSS ca in prototip */
export type StareDrum = 'ok' | 'slow' | 'works' | 'closed'

/**
 * Reteaua de drumuri desenata pe harta (ROADS din prototip). Fiecare tronson are un identificator
 * stabil: evenimentele de trafic din /admin pot alege tronsonul pe care il coloreaza.
 * Punctele sunt chei de oras sau [lon, lat].
 */
export const RETEA: { id: string; n: string; mw?: 1; p: (string | Punct)[]; eticheta: string }[] = [
  { id: 'a1-buc-pit', n: 'A1', mw: 1, p: ['Bucuresti', 'Pitesti'], eticheta: 'A1 București–Pitești' },
  { id: 'a1-pit-sib', n: 'A1', mw: 1, p: ['Pitesti', 'Curtea de Arges', 'Cartisoara', 'Sibiu'], eticheta: 'A1 Pitești–Sibiu (șantier)' },
  { id: 'a1-sib-nad', n: 'A1', mw: 1, p: ['Sibiu', 'Sebes', 'Deva', 'Lugoj', 'Timisoara', 'Arad', 'Nadlac'], eticheta: 'A1 Sibiu–Nădlac' },
  { id: 'a2', n: 'A2', mw: 1, p: ['Bucuresti', 'Fetesti', 'Constanta'], eticheta: 'A2 București–Constanța' },
  { id: 'a3-buc-plo', n: 'A3', mw: 1, p: ['Bucuresti', 'Ploiesti'], eticheta: 'A3 București–Ploiești' },
  { id: 'a7', n: 'A7', mw: 1, p: ['Ploiesti', 'Buzau', 'Focsani', 'Bacau'], eticheta: 'A7 Ploiești–Bacău' },
  { id: 'a10', n: 'A10', mw: 1, p: ['Sebes', 'Turda'], eticheta: 'A10 Sebeș–Turda' },
  { id: 'a3-tur-zal', n: 'A3', mw: 1, p: ['Turda', 'Cluj-Napoca', 'Zalau'], eticheta: 'A3 Turda–Zalău' },
  { id: 'dx12', n: 'DX12', mw: 1, p: ['Craiova', 'Bals', 'Slatina', 'Pitesti'], eticheta: 'DX12 Craiova–Pitești' },
  { id: 'dn1-plo-bv', n: 'DN1', p: ['Ploiesti', 'Sinaia', 'Predeal', 'Brasov'], eticheta: 'DN1 Ploiești–Brașov (Valea Prahovei)' },
  { id: 'dn7-olt', n: 'DN7', p: ['Ramnicu Valcea', 'Brezoi', 'Sibiu'], eticheta: 'DN7 Valea Oltului' },
  { id: 'dn7c', n: 'DN7C', p: ['Curtea de Arges', [24.62, 45.45], 'Cartisoara'], eticheta: 'DN7C Transfăgărășan' },
  { id: 'dn67c', n: 'DN67C', p: ['Novaci', [23.62, 45.5], 'Sebes'], eticheta: 'DN67C Transalpina' },
  { id: 'dn6-buc-car', n: 'DN6', p: ['Bucuresti', 'Alexandria', 'Caracal'], eticheta: 'DN6 București–Caracal' },
  { id: 'dn6-car-cv', n: 'DN6', p: ['Caracal', 'Craiova'], eticheta: 'DN6 Caracal–Craiova' },
  { id: 'dn6-cv-lug', n: 'DN6', p: ['Craiova', 'Filiasi', 'Drobeta-Turnu Severin', 'Orsova', 'Caransebes', 'Lugoj'], eticheta: 'DN6 Craiova–Lugoj' },
  { id: 'dn66-fil-tj', n: 'DN66', p: ['Filiasi', 'Targu Jiu'], eticheta: 'DN66 Filiași–Târgu Jiu' },
  { id: 'dn66-tj-pet', n: 'DN66', p: ['Targu Jiu', 'Petrosani'], eticheta: 'DN66 Defileul Jiului' },
  { id: 'dn66-pet-dev', n: 'DN66', p: ['Petrosani', 'Deva'], eticheta: 'DN66 Petroșani–Deva' },
  { id: 'dn67', n: 'DN67', p: ['Drobeta-Turnu Severin', 'Motru', 'Targu Jiu', 'Novaci', 'Horezu', 'Ramnicu Valcea', 'Pitesti'], eticheta: 'DN67 Severin–Pitești' },
  { id: 'dn56', n: 'DN56', p: ['Craiova', 'Segarcea', 'Calafat'], eticheta: 'DN56 Craiova–Calafat' },
  { id: 'dn65', n: 'DN65', p: ['Caracal', 'Slatina'], eticheta: 'DN65 Caracal–Slatina' },
  { id: 'dn2', n: 'DN2', p: ['Bucuresti', 'Buzau', 'Focsani', 'Bacau', 'Suceava', 'Botosani'], eticheta: 'DN2 București–Botoșani' },
  { id: 'dn1-bv-sb', n: 'DN1', p: ['Brasov', 'Fagaras', 'Sibiu'], eticheta: 'DN1 Brașov–Sibiu' },
  { id: 'dn13', n: 'DN13', p: ['Brasov', 'Targu Mures'], eticheta: 'DN13 Brașov–Târgu Mureș' },
  { id: 'dn1-cj-or', n: 'DN1', p: ['Cluj-Napoca', 'Oradea'], eticheta: 'DN1 Cluj–Oradea' },
  { id: 'dn24', n: 'DN24', p: ['Bacau', 'Vaslui', 'Iasi', 'Suceava'], eticheta: 'DN24 Bacău–Suceava' },
  { id: 'dn22-bz-gl', n: 'DN22', p: ['Buzau', 'Braila', 'Galati'], eticheta: 'DN22 Buzău–Galați' },
  { id: 'dn22-ct-tl', n: 'DN22', p: ['Constanta', 'Tulcea'], eticheta: 'DN22 Constanța–Tulcea' },
  { id: 'dn79', n: 'DN79', p: ['Arad', 'Oradea'], eticheta: 'DN79 Arad–Oradea' },
  { id: 'dn1c', n: 'DN1C', p: ['Cluj-Napoca', 'Baia Mare', 'Satu Mare'], eticheta: 'DN1C Cluj–Satu Mare' },
  { id: 'dn15', n: 'DN15', p: ['Targu Mures', 'Bistrita'], eticheta: 'DN15 Târgu Mureș–Bistrița' },
  { id: 'dn12', n: 'DN12', p: ['Brasov', 'Sfantu Gheorghe', 'Miercurea Ciuc'], eticheta: 'DN12 Brașov–Miercurea Ciuc' },
]

/** Autostrada sau drum expres (scut verde) vs drum national (scut albastru) */
export const eAutostrada = (drum: string) => /^(A\d|DX)/i.test(drum.trim())
