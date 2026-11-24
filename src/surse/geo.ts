// Geografia comuna a conectorilor: judetele (cu codurile auto folosite de ANM), un mic dictionar de localitati
// (coordonate aproximative, suficiente pentru un semn pe harta) si potrivirea text -> judet / localitate.
import hartaDate from '../shared/harta-date.json'
import { ORASE_EXTRA, fara, invP, type Punct } from '../shared/harta'

/** cheie de comparatie: fara diacritice, litere mici, spatii simple, fara cratime */
export const cheie = (s: string) => fara(String(s || '')).toLowerCase().replace(/[‐-―-]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

/** slug judet -> [cod auto (folosit de ANM), nume] */
export const JUDETE: Record<string, [string, string]> = {
  alba: ['AB', 'Alba'], arad: ['AR', 'Arad'], arges: ['AG', 'Argeș'], bacau: ['BC', 'Bacău'], bihor: ['BH', 'Bihor'],
  'bistrita-nasaud': ['BN', 'Bistrița-Năsăud'], botosani: ['BT', 'Botoșani'], braila: ['BR', 'Brăila'], brasov: ['BV', 'Brașov'],
  bucuresti: ['B', 'București'], buzau: ['BZ', 'Buzău'], calarasi: ['CL', 'Călărași'], 'caras-severin': ['CS', 'Caraș-Severin'],
  cluj: ['CJ', 'Cluj'], constanta: ['CT', 'Constanța'], covasna: ['CV', 'Covasna'], dambovita: ['DB', 'Dâmbovița'], dolj: ['DJ', 'Dolj'],
  galati: ['GL', 'Galați'], giurgiu: ['GR', 'Giurgiu'], gorj: ['GJ', 'Gorj'], harghita: ['HR', 'Harghita'], hunedoara: ['HD', 'Hunedoara'],
  ialomita: ['IL', 'Ialomița'], iasi: ['IS', 'Iași'], ilfov: ['IF', 'Ilfov'], maramures: ['MM', 'Maramureș'], mehedinti: ['MH', 'Mehedinți'],
  mures: ['MS', 'Mureș'], neamt: ['NT', 'Neamț'], olt: ['OT', 'Olt'], prahova: ['PH', 'Prahova'], salaj: ['SJ', 'Sălaj'],
  'satu-mare': ['SM', 'Satu Mare'], sibiu: ['SB', 'Sibiu'], suceava: ['SV', 'Suceava'], teleorman: ['TR', 'Teleorman'], timis: ['TM', 'Timiș'],
  tulcea: ['TL', 'Tulcea'], valcea: ['VL', 'Vâlcea'], vaslui: ['VS', 'Vaslui'], vrancea: ['VN', 'Vrancea'],
}
const PE_COD = new Map(Object.entries(JUDETE).map(([slug, [cod]]) => [cod, slug]))
const PE_NUME = new Map(Object.entries(JUDETE).map(([slug, [, n]]) => [cheie(n), slug]))
PE_NUME.set('municipiul bucuresti', 'bucuresti'); PE_NUME.set('bistrita', 'bistrita-nasaud'); PE_NUME.set('caras', 'caras-severin')

/** „DJ” -> „dolj”; „B” sau „IF” -> bucuresti / ilfov */
export const judetDinCod = (cod: string) => PE_COD.get(String(cod || '').trim().toUpperCase()) || null
/** „Jud. Vâlcea”, „județul Dolj”, „Caras Severin” -> slug */
export function judetDinNume(s: string): string | null {
  const k = cheie(s).replace(/^(jud|judet|judetul|judetului|jud\.)\s+/, '')
  return PE_NUME.get(k) || null
}

// Orasele de pe harta: judetul fiecaruia (coordonatele vin din datele hartii)
const JUDET_ORAS: Record<string, string> = {
  Bucuresti: 'bucuresti', Craiova: 'dolj', 'Cluj-Napoca': 'cluj', Timisoara: 'timis', Iasi: 'iasi', Constanta: 'constanta', Brasov: 'brasov',
  Sibiu: 'sibiu', Pitesti: 'arges', Ploiesti: 'prahova', Oradea: 'bihor', Arad: 'arad', Deva: 'hunedoara', Galati: 'galati', Braila: 'braila',
  Bacau: 'bacau', Suceava: 'suceava', Tulcea: 'tulcea', 'Targu Jiu': 'gorj', 'Drobeta-Turnu Severin': 'mehedinti', Slatina: 'olt',
  'Ramnicu Valcea': 'valcea', Caracal: 'olt', 'Targu Mures': 'mures', 'Baia Mare': 'maramures', 'Satu Mare': 'satu-mare', Focsani: 'vrancea',
  Buzau: 'buzau', Alexandria: 'teleorman', Nadlac: 'arad', Lugoj: 'timis', Petrosani: 'hunedoara', Calafat: 'dolj', Bals: 'olt', Filiasi: 'dolj',
  Motru: 'gorj', Horezu: 'valcea', Sebes: 'alba', Turda: 'cluj', Zalau: 'salaj', Bistrita: 'bistrita-nasaud', 'Piatra Neamt': 'neamt',
  Vaslui: 'vaslui', Botosani: 'botosani', Slobozia: 'ialomita', Calarasi: 'calarasi', Giurgiu: 'giurgiu', Targoviste: 'dambovita',
  'Sfantu Gheorghe': 'covasna', 'Miercurea Ciuc': 'harghita', 'Alba Iulia': 'alba', Resita: 'caras-severin', Caransebes: 'caras-severin',
  Fagaras: 'brasov', Fetesti: 'ialomita', Orsova: 'mehedinti', Corabia: 'olt', Rovinari: 'gorj', Sinaia: 'prahova', Otopeni: 'ilfov',
  Bechet: 'dolj', Segarcea: 'dolj', Brezoi: 'valcea', 'Curtea de Arges': 'arges', Cartisoara: 'sibiu', Novaci: 'gorj', Predeal: 'brasov',
}

// Localitati care apar des in comunicatele de trafic si de avarii: [lon, lat, judet]. Coordonate aproximative.
const EXTRA: Record<string, [number, number, string]> = {
  Comarnic: [25.63, 45.25, 'prahova'], Busteni: [25.54, 45.41, 'prahova'], Campina: [25.74, 45.13, 'prahova'], Nistoresti: [25.66, 45.2, 'prahova'],
  Azuga: [25.55, 45.45, 'prahova'], Barcanesti: [26.06, 44.88, 'prahova'], Cornu: [25.71, 45.21, 'prahova'], 'Valenii de Munte': [26.04, 45.18, 'prahova'],
  Mizil: [26.44, 45.0, 'prahova'], Calimanesti: [24.34, 45.24, 'valcea'], Caciulata: [24.32, 45.27, 'valcea'], Dragasani: [24.26, 44.66, 'valcea'],
  Voineasa: [23.95, 45.42, 'valcea'], 'Obarsia Lotrului': [23.63, 45.43, 'valcea'], Boita: [24.27, 45.63, 'sibiu'], Talmaciu: [24.26, 45.66, 'sibiu'],
  Medias: [24.35, 46.16, 'sibiu'], 'Balea Lac': [24.62, 45.6, 'sibiu'], Fundulea: [26.52, 44.45, 'calarasi'], 'Drajna Noua': [27.05, 44.4, 'calarasi'],
  'Lehliu Gara': [26.85, 44.43, 'calarasi'], Cernavoda: [28.03, 44.34, 'constanta'], Medgidia: [28.27, 44.25, 'constanta'], Lazu: [28.62, 44.09, 'constanta'],
  Agigea: [28.62, 44.08, 'constanta'], 'Eforie Nord': [28.63, 44.06, 'constanta'], 'Eforie Sud': [28.65, 44.02, 'constanta'], Mangalia: [28.58, 43.82, 'constanta'],
  'Vama Veche': [28.57, 43.75, 'constanta'], Navodari: [28.61, 44.32, 'constanta'], Ovidiu: [28.56, 44.27, 'constanta'], Harsova: [27.95, 44.69, 'constanta'],
  Babadag: [28.71, 44.9, 'tulcea'], Macin: [28.13, 45.24, 'tulcea'], Gaesti: [25.32, 44.72, 'dambovita'], Mioveni: [24.94, 44.96, 'arges'],
  Topoloveni: [25.08, 44.81, 'arges'], Capatanenii: [24.62, 45.39, 'arges'], Vidraru: [24.63, 45.36, 'arges'], 'Ramnicu Sarat': [27.05, 45.38, 'buzau'],
  Nehoiu: [26.3, 45.42, 'buzau'], Patarlagele: [26.36, 45.32, 'buzau'], Adjud: [27.18, 46.1, 'vrancea'], Marasesti: [27.23, 45.88, 'vrancea'],
  Soveja: [26.66, 45.99, 'vrancea'], 'Mandresti Munteni': [27.2, 45.53, 'vrancea'], Olaneasca: [27.3, 45.32, 'braila'], Roman: [26.92, 46.92, 'neamt'],
  'Targu Neamt': [26.37, 47.2, 'neamt'], Bicaz: [26.09, 46.91, 'neamt'], Pascani: [26.72, 47.25, 'iasi'], 'Targu Frumos': [27.01, 47.21, 'iasi'],
  Falticeni: [26.3, 47.46, 'suceava'], Siret: [26.07, 47.95, 'suceava'], 'Vatra Dornei': [25.36, 47.35, 'suceava'], 'Gura Humorului': [25.89, 47.55, 'suceava'],
  Radauti: [25.92, 47.84, 'suceava'], Onesti: [26.77, 46.25, 'bacau'], Tecuci: [27.43, 45.85, 'galati'], Husi: [28.06, 46.67, 'vaslui'],
  Barlad: [27.67, 46.23, 'vaslui'], Albita: [28.17, 46.8, 'vaslui'], Dorohoi: [26.4, 47.95, 'botosani'], Sighisoara: [24.79, 46.22, 'mures'],
  Reghin: [24.71, 46.78, 'mures'], Ludus: [24.1, 46.48, 'mures'], 'Odorheiu Secuiesc': [25.3, 46.3, 'harghita'], Gheorgheni: [25.6, 46.72, 'harghita'],
  'Campia Turzii': [23.88, 46.55, 'cluj'], Huedin: [23.04, 46.87, 'cluj'], Gilau: [23.38, 46.75, 'cluj'], Ciucea: [22.82, 46.96, 'cluj'],
  Dej: [23.88, 47.14, 'cluj'], Gherla: [23.91, 47.03, 'cluj'], Aiud: [23.72, 46.31, 'alba'], Cugir: [23.55, 45.84, 'alba'],
  Orastie: [23.2, 45.84, 'hunedoara'], Simeria: [23.01, 45.85, 'hunedoara'], Hunedoara: [22.9, 45.75, 'hunedoara'], Hateg: [22.95, 45.61, 'hunedoara'],
  Lupeni: [23.23, 45.36, 'hunedoara'], Ilia: [22.65, 45.93, 'hunedoara'], 'Bumbesti Jiu': [23.39, 45.18, 'gorj'], 'Targu Carbunesti': [23.51, 44.96, 'gorj'],
  Lelesti: [23.18, 45.1, 'gorj'], Runcu: [23.13, 45.12, 'gorj'], Ranca: [23.7, 45.29, 'gorj'], Faget: [22.18, 45.85, 'timis'], Margina: [22.27, 45.86, 'timis'],
  Lipova: [21.7, 46.09, 'arad'], Bors: [21.81, 47.11, 'bihor'], Alesd: [22.4, 47.06, 'bihor'], 'Sighetu Marmatiei': [23.89, 47.93, 'maramures'],
  Carei: [22.47, 47.69, 'satu-mare'], 'Baile Herculane': [22.41, 44.88, 'caras-severin'], Strehaia: [23.2, 44.62, 'mehedinti'], Simian: [22.7, 44.63, 'mehedinti'],
  'Turnu Magurele': [24.87, 43.75, 'teleorman'], 'Rosiorii de Vede': [24.98, 44.11, 'teleorman'], Zimnicea: [25.37, 43.65, 'teleorman'],
  'Draganesti Olt': [24.53, 44.17, 'olt'], Dabuleni: [24.09, 43.8, 'olt'], Podari: [23.79, 44.24, 'dolj'], Isalnita: [23.74, 44.39, 'dolj'],
  Pielesti: [24.0, 44.33, 'dolj'], Bailesti: [23.35, 44.03, 'dolj'], Afumati: [26.25, 44.53, 'ilfov'], Chitila: [25.98, 44.51, 'ilfov'],
  Voluntari: [26.18, 44.49, 'ilfov'], 'Popesti Leordeni': [26.17, 44.38, 'ilfov'], 'Bolintin Vale': [25.76, 44.45, 'giurgiu'], Mihailesti: [25.91, 44.32, 'giurgiu'],
  'Adunatii Copaceni': [26.1, 44.25, 'giurgiu'], Uzunu: [26.07, 44.16, 'giurgiu'], Urziceni: [26.64, 44.72, 'ialomita'], Bran: [25.37, 45.52, 'brasov'],
  Rasnov: [25.46, 45.59, 'brasov'], Codlea: [25.45, 45.7, 'brasov'], Sacele: [25.69, 45.62, 'brasov'], 'Intorsura Buzaului': [26.03, 45.68, 'covasna'],
}

export type Loc = { nume: string; lon: number; lat: number; judet: string }
const ORASE_HARTA = { ...(hartaDate.cities as unknown as Record<string, Punct>), ...ORASE_EXTRA }
export const LOCALITATI = new Map<string, Loc>()
for (const [n, j] of Object.entries(JUDET_ORAS)) {
  const p = ORASE_HARTA[n]
  if (!p) continue
  const [lon, lat] = invP(p[0], p[1])
  LOCALITATI.set(cheie(n), { nume: n, lon: +lon.toFixed(4), lat: +lat.toFixed(4), judet: j })
}
for (const [n, [lon, lat, j]] of Object.entries(EXTRA)) LOCALITATI.set(cheie(n), { nume: n, lon, lat, judet: j })
LOCALITATI.set('drobeta turnu severin', LOCALITATI.get(cheie('Drobeta-Turnu Severin'))!)
LOCALITATI.set('severin', LOCALITATI.get(cheie('Drobeta-Turnu Severin'))!)
LOCALITATI.set('cluj', LOCALITATI.get(cheie('Cluj-Napoca'))!)
LOCALITATI.set('capitala', LOCALITATI.get('bucuresti')!)

/** Cauta o localitate dupa nume (tolereaza diacritice, „mun.”, „orașul”, „com.”). */
export function localitate(s: string): Loc | null {
  const k = cheie(s).replace(/^(mun|municipiul|orasul|oras|loc|localitatea|com|comuna|sat|statiunea|zona)\s+/, '')
  return LOCALITATI.get(k) || null
}
