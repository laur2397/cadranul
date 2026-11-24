// Datele utile demonstrative (din tablourile prototipului D: REG, ROADS/EV, OUT, WX, PRICES, JOBS, PHARM, RTIMES).
// Toate cifrele sunt de proba.

export const REGIUNI = [
  { key: 'ne', slug: 'nord-est', name: 'Nord-Est', short: 'Nord-Est', city: 'Iași', ck: 'Iasi', ref: 'iasi', t: 0, w: 'cloud', cond: 'Înnorat, ger ușor', fuel: [7.55, 7.69, 3.52], jobs: 2140 },
  { key: 'se', slug: 'sud-est', name: 'Sud-Est', short: 'Sud-Est', city: 'Constanța', ck: 'Constanta', ref: 'constanta', t: 7, w: 'sun', cond: 'Soare, vânt de la mare', fuel: [7.61, 7.75, 3.58], jobs: 1980 },
  { key: 'sm', slug: 'sud-muntenia', name: 'Sud-Muntenia', short: 'Sud-Muntenia', city: 'Pitești', ck: 'Pitesti', ref: 'arges', t: 2, w: 'fog', cond: 'Ceață până la 11', fuel: [7.57, 7.70, 3.54], jobs: 2310 },
  { key: 'sv', slug: 'sud-vest-oltenia', name: 'Sud-Vest Oltenia', short: 'Oltenia', city: 'Craiova', ck: 'Craiova', ref: 'dolj', t: 3, w: 'fog', cond: 'Ceață densă până la 11, apoi soare', fuel: [7.62, 7.74, 3.59], jobs: 2797 },
  { key: 'v', slug: 'vest', name: 'Vest', short: 'Vest', city: 'Timișoara', ck: 'Timisoara', ref: 'timis', t: 5, w: 'cloud', cond: 'Înnorat, fără precipitații', fuel: [7.54, 7.66, 3.49], jobs: 2650 },
  { key: 'nv', slug: 'nord-vest', name: 'Nord-Vest', short: 'Nord-Vest', city: 'Cluj-Napoca', ck: 'Cluj-Napoca', ref: 'cluj', t: 1, w: 'cloud', cond: 'Înnorat, posibil lapoviță', fuel: [7.59, 7.72, 3.56], jobs: 3420 },
  { key: 'c', slug: 'centru', name: 'Centru', short: 'Centru', city: 'Brașov', ck: 'Brasov', ref: 'brasov', t: -2, w: 'snow', cond: 'Ninge de la 14:00, cod galben', fuel: [7.63, 7.77, 3.61], jobs: 2890 },
  { key: 'bi', slug: 'bucuresti-ilfov', name: 'București-Ilfov', short: 'București', city: 'București', ck: 'Bucuresti', ref: 'bucuresti', t: 4, w: 'fog', cond: 'Ceață, apoi înnorat', fuel: [7.52, 7.65, 3.47], jobs: 9840 },
]

// [cheia hartii, nume, resedinta, slug]
export const JUDETE: [string, string, string][] = [
  ['Alba', 'Alba', 'Alba Iulia'], ['Arad', 'Arad', 'Arad'], ['Arges', 'Argeș', 'Pitești'], ['Bacau', 'Bacău', 'Bacău'], ['Bihor', 'Bihor', 'Oradea'],
  ['Bistrita-Nasaud', 'Bistrița-Năsăud', 'Bistrița'], ['Botosani', 'Botoșani', 'Botoșani'], ['Braila', 'Brăila', 'Brăila'], ['Brasov', 'Brașov', 'Brașov'],
  ['Bucuresti', 'București', 'București'], ['Buzau', 'Buzău', 'Buzău'], ['Calarasi', 'Călărași', 'Călărași'], ['Caras-Severin', 'Caraș-Severin', 'Reșița'],
  ['Cluj', 'Cluj', 'Cluj-Napoca'], ['Constanta', 'Constanța', 'Constanța'], ['Covasna', 'Covasna', 'Sfântu Gheorghe'], ['Dambovita', 'Dâmbovița', 'Târgoviște'],
  ['Dolj', 'Dolj', 'Craiova'], ['Galati', 'Galați', 'Galați'], ['Giurgiu', 'Giurgiu', 'Giurgiu'], ['Gorj', 'Gorj', 'Târgu Jiu'], ['Harghita', 'Harghita', 'Miercurea Ciuc'],
  ['Hunedoara', 'Hunedoara', 'Deva'], ['Ialomita', 'Ialomița', 'Slobozia'], ['Iasi', 'Iași', 'Iași'], ['Ilfov', 'Ilfov', 'Buftea'], ['Maramures', 'Maramureș', 'Baia Mare'],
  ['Mehedinti', 'Mehedinți', 'Drobeta-Turnu Severin'], ['Mures', 'Mureș', 'Târgu Mureș'], ['Neamt', 'Neamț', 'Piatra Neamț'], ['Olt', 'Olt', 'Slatina'],
  ['Prahova', 'Prahova', 'Ploiești'], ['Salaj', 'Sălaj', 'Zalău'], ['Satu Mare', 'Satu Mare', 'Satu Mare'], ['Sibiu', 'Sibiu', 'Sibiu'], ['Suceava', 'Suceava', 'Suceava'],
  ['Teleorman', 'Teleorman', 'Alexandria'], ['Timis', 'Timiș', 'Timișoara'], ['Tulcea', 'Tulcea', 'Tulcea'], ['Valcea', 'Vâlcea', 'Râmnicu Vâlcea'], ['Vaslui', 'Vaslui', 'Vaslui'],
  ['Vrancea', 'Vrancea', 'Focșani'],
]
export const JOBC: Record<string, number> = { Dolj: 1248, Valcea: 512, Gorj: 437, Olt: 389, Mehedinti: 211 }

export const SECTIUNI: [string, string, string][] = [
  ['politica', 'Politică', 'Parlamentul, Guvernul și deciziile care ajung la tine, explicate fără partizanat.'],
  ['bani', 'Bani', 'Salarii, pensii, taxe, prețuri: ce înseamnă pentru buzunarul tău.'],
  ['economie', 'Economie', 'Firme, investiții, agricultură și fonduri europene, pe regiuni.'],
  ['energie', 'Energie', 'Prețul curentului, gazul, carburanții și tranziția energetică.'],
  ['sanatate', 'Sănătate', 'Spitale, medici, tratamente și drepturile pacienților.'],
  ['educatie', 'Educație', 'Școli, examene, universități.'],
  ['trafic', 'Trafic și transport', 'Drumuri, autostrăzi, trenuri și transportul în comun.'],
  ['vreme', 'Vremea', 'Prognoze, coduri meteo și ce înseamnă pentru drumuri.'],
  ['mediu', 'Mediu', 'Dunărea, Delta, pădurile și aerul pe care îl respirăm.'],
  ['tehnologie', 'Tehnologie', 'Firme de tehnologie, cercetare și viața digitală.'],
  ['oras', 'Oraș', 'Utilități, primării, piețe și viața de zi cu zi în orașele tale.'],
  ['munca', 'Muncă', 'Locuri de muncă, salarii, recalificare.'],
  ['sport', 'Sport', 'Echipele din regiune și marile competiții.'],
  ['cultura', 'Cultură și turism', 'Patrimoniu, spectacole, munte și mare.'],
]

export const AUTORI = [
  { slug: 'ana-mitrea', name: 'Ana Mitrea', role: 'Reporteră, bani și energie', base: 'Craiova', beat: 'energie, economie și joburi', initials: 'AM', bio: 'Scrie despre prețuri, energie și piața muncii din Oltenia. Fost redactor economic la un cotidian regional.' },
  { slug: 'radu-parvu', name: 'Radu Pârvu', role: 'Editor, politică', base: 'București', beat: 'Parlament, buget și administrație', initials: 'RP', bio: 'Urmărește Parlamentul și bugetul de stat. Explică deciziile pe înțelesul celor pe care îi afectează.' },
  { slug: 'ioana-stan', name: 'Ioana Stan', role: 'Reporteră', base: 'Cluj-Napoca', beat: 'Nord-Vest, tehnologie', initials: 'IS', bio: 'Acoperă ediția Nord-Vest și firmele de tehnologie din Cluj.' },
  { slug: 'mihai-dobre', name: 'Mihai Dobre', role: 'Reporter', base: 'Iași', beat: 'Nord-Est', initials: 'MD', bio: 'Acoperă Moldova: infrastructură, sănătate și administrație locală.' },
  { slug: 'elena-vlad', name: 'Elena Vlad', role: 'Reporteră', base: 'Timișoara', beat: 'Vest', initials: 'EV', bio: 'Acoperă ediția Vest: Timiș, Arad, Hunedoara, Caraș-Severin.' },
  { slug: 'cristian-oprea', name: 'Cristian Oprea', role: 'Reporter, vreme și munte', base: 'Brașov', beat: 'Centru, vreme', initials: 'CO', bio: 'Acoperă ediția Centru și tot ce ține de munte: vreme, drumuri, turism.' },
  { slug: 'andreea-rusu', name: 'Andreea Rusu', role: 'Reporteră', base: 'Constanța', beat: 'Sud-Est, porturi și Delta', initials: 'AR', bio: 'Acoperă Dobrogea, porturile și Delta Dunării.' },
  { slug: 'sorin-ilie', name: 'Sorin Ilie', role: 'Reporter, trafic', base: 'Pitești', beat: 'Sud-Muntenia, trafic', initials: 'SI', bio: 'Acoperă ediția Sud-Muntenia și autostrăzile din jurul Capitalei.' },
  { slug: 'laura-neagu', name: 'Laura Neagu', role: 'Reporteră, sănătate', base: 'Craiova', beat: 'sănătate', initials: 'LN', bio: 'Scrie despre spitale, medici și drepturile pacienților.' },
  { slug: 'victor-matei', name: 'Victor Matei', role: 'Coordonatorul ediției Oltenia', base: 'Craiova', beat: 'Oltenia: oraș, trafic, utilități', initials: 'VM', bio: 'Coordonează ediția Sud-Vest Oltenia. Îl găsești la redacția din Craiova.' },
]

// Evenimente rutiere [drum, unde, ce, stare, eticheta/intarziere, pozitie, judet (cheie harta), tronsoane]
export const EVENIMENTE: { road: string; where: string; what: string; st: 'queue' | 'works' | 'closed' | 'ok'; lab?: string; delay?: number; at: string | [number, number]; cty: string; seg?: string[] }[] = [
  { road: 'A1', where: 'București–Pitești, km 95–105', what: 'Coadă de 6 km după un accident. O bandă e redeschisă.', st: 'queue', delay: 25, at: [25.12, 44.78], cty: 'Dambovita', seg: ['a1-buc-pit'] },
  { road: 'DN1', where: 'Valea Prahovei, Sinaia–Predeal', what: 'Trafic intens spre Brașov. Cod galben de ninsoare de la 14:00.', st: 'queue', delay: 40, at: 'Sinaia', cty: 'Prahova', seg: ['dn1-plo-bv'] },
  { road: 'DN7', where: 'Valea Oltului, Brezoi–Câineni', what: 'Lucrări la A1. Trafic alternativ ziua, închis între 22:00 și 6:00.', st: 'works', lab: 'închis noaptea', at: [24.3, 45.47], cty: 'Valcea', seg: ['dn7-olt', 'a1-pit-sib'] },
  { road: 'DN6', where: 'Caracal–Craiova, 12 km', what: 'Lucrări de reabilitare. Un singur sens, cu semafor.', st: 'works', delay: 15, at: [24.12, 44.21], cty: 'Olt', seg: ['dn6-car-cv'] },
  { road: 'DN66', where: 'Defileul Jiului, Bumbești–Livezeni', what: 'Restricții pentru camioane peste 7,5 t. Ceață pe porțiuni.', st: 'queue', delay: 10, at: [23.33, 45.24], cty: 'Gorj', seg: ['dn66-tj-pet'] },
  { road: 'DX12', where: 'Drumul expres Craiova–Pitești, la Balș', what: 'Ceață densă, vizibilitate sub 200 m. Viteză redusă la 60 km/h.', st: 'queue', lab: 'ceață', at: 'Bals', cty: 'Olt', seg: ['dx12'] },
  { road: 'DN67C', where: 'Transalpina, Novaci–Sebeș', what: 'Închis sezonier până în mai.', st: 'closed', lab: 'închis', at: [23.62, 45.5], cty: 'Gorj', seg: ['dn67c'] },
  { road: 'DN7C', where: 'Transfăgărășan', what: 'Închis sezonier până la 30 iunie.', st: 'closed', lab: 'închis', at: [24.62, 45.45], cty: 'Arges', seg: ['dn7c'] },
  { road: 'A3', where: 'Gilău–Nădășelu', what: 'Lucrări pe banda 2, sensul spre Oradea.', st: 'works', delay: 5, at: [23.38, 46.75], cty: 'Cluj', seg: ['a3-tur-zal'] },
  { road: 'A2', where: 'București–Constanța', what: 'Circulație normală pe ambele sensuri.', st: 'ok', at: [27.3, 44.36], cty: 'Constanta' },
  { road: 'A1', where: 'Lugoj–Deva', what: 'Circulație normală. Polei posibil pe viaducte dimineața.', st: 'ok', at: [22.4, 45.77], cty: 'Hunedoara' },
  { road: 'DN2', where: 'Focșani–Bacău (E85)', what: 'Circulație normală.', st: 'ok', at: [27.02, 46.1], cty: 'Bacau' },
  { road: 'DN1', where: 'Calea Bucureștilor, Otopeni', what: 'Aglomerat spre centru, 3 km de coloană.', st: 'queue', delay: 20, at: 'Otopeni', cty: 'Ilfov' },
  { road: 'DN13', where: 'Brașov–Sighișoara', what: 'Drum umed, utilaje pregătite pentru ninsoare.', st: 'ok', at: [25.2, 46.0], cty: 'Brasov' },
]

export const TIMPI: Record<string, [string, string, string, 'ok' | 'queue' | 'works' | 'closed'][]> = {
  nat: [['București–Pitești', '1 h 35', '+25 min', 'queue'], ['București–Brașov', '3 h 10', '+40 min', 'queue'], ['Craiova–București', '2 h 50', '+15 min', 'works'], ['Cluj-Napoca–Oradea', '2 h 05', 'ca de obicei', 'ok'], ['Timișoara–Deva', '1 h 40', 'ca de obicei', 'ok']],
  sv: [['Craiova–Caracal', '1 h 05', '+15 min', 'works'], ['Craiova–Pitești', '1 h 35', '+10 min, ceață', 'queue'], ['Craiova–Târgu Jiu', '1 h 25', 'ca de obicei', 'ok'], ['Târgu Jiu–Petroșani', '1 h 10', '+10 min', 'queue'], ['Craiova–Drobeta-Tr. Severin', '1 h 50', 'ca de obicei', 'ok']],
  ne: [['Iași–Suceava', '2 h 05', 'ca de obicei', 'ok'], ['Iași–Bacău', '2 h 10', 'ca de obicei', 'ok'], ['Bacău–Piatra Neamț', '1 h 00', 'ca de obicei', 'ok']],
  se: [['Constanța–București', '2 h 25', 'ca de obicei', 'ok'], ['Constanța–Tulcea', '1 h 50', 'ca de obicei', 'ok'], ['Galați–Brăila', '0 h 30', 'ca de obicei', 'ok']],
  sm: [['Pitești–București', '1 h 35', '+25 min', 'queue'], ['Ploiești–Brașov', '2 h 05', '+40 min', 'queue'], ['Pitești–Râmnicu Vâlcea', '1 h 10', 'ca de obicei', 'ok']],
  v: [['Timișoara–Arad', '0 h 50', 'ca de obicei', 'ok'], ['Timișoara–Deva', '1 h 40', 'ca de obicei', 'ok'], ['Deva–Petroșani', '1 h 30', '+10 min', 'queue']],
  nv: [['Cluj-Napoca–Oradea', '2 h 05', '+5 min', 'works'], ['Cluj-Napoca–Baia Mare', '2 h 30', 'ca de obicei', 'ok'], ['Cluj-Napoca–Bistrița', '1 h 50', 'ca de obicei', 'ok']],
  c: [['Brașov–București', '3 h 10', '+40 min', 'queue'], ['Brașov–Sibiu', '2 h 15', 'ca de obicei', 'ok'], ['Brașov–Târgu Mureș', '2 h 40', 'ca de obicei', 'ok']],
  bi: [['Centru–Aeroportul Otopeni', '0 h 55', '+20 min', 'queue'], ['București–Pitești (A1)', '1 h 35', '+25 min', 'queue'], ['București–Ploiești (A3)', '0 h 50', 'ca de obicei', 'ok']],
}

export const AVARII: { k: 'water' | 'power' | 'gas'; at: string; t: string; d: string; cty: string }[] = [
  { k: 'water', at: 'Craiova', t: 'Apă caldă oprită joi', d: 'Brazda lui Novac și Rovine, 8:00–20:00', cty: 'Dolj' },
  { k: 'power', at: 'Targu Jiu', t: 'Curent oprit azi, 9:00–13:00', d: 'Zona străzii Unirii, lucrări la rețea', cty: 'Gorj' },
  { k: 'water', at: 'Slatina', t: 'Apă rece oprită, 10:00–16:00', d: 'Cartierul Crișan, se schimbă o conductă', cty: 'Olt' },
  { k: 'gas', at: 'Ramnicu Valcea', t: 'Gaz oprit până la 15:00', d: 'Ostroveni, trei blocuri, avarie', cty: 'Valcea' },
  { k: 'power', at: 'Drobeta-Turnu Severin', t: 'Curent oprit, 10:00–14:00', d: 'Cartierul Crihala', cty: 'Mehedinti' },
  { k: 'power', at: 'Iasi', t: 'Curent oprit, 9:00–12:00', d: 'Păcurari, străzile din spatele Bucium', cty: 'Iasi' },
  { k: 'gas', at: 'Brasov', t: 'Gaz oprit până la 14:00', d: 'Tractorul, două scări de bloc', cty: 'Brasov' },
  { k: 'water', at: 'Constanta', t: 'Apă rece oprită, 8:00–17:00', d: 'Zona Tomis Nord', cty: 'Constanta' },
  { k: 'power', at: 'Cluj-Napoca', t: 'Curent oprit, 10:00–15:00', d: 'Mănăștur, lucrări programate', cty: 'Cluj' },
  { k: 'water', at: 'Ploiesti', t: 'Apă caldă, revine la 12:00', d: 'Cartierul Republicii', cty: 'Prahova' },
  { k: 'power', at: 'Timisoara', t: 'Curent oprit, 9:00–11:00', d: 'Zona Complexul Studențesc', cty: 'Timis' },
  { k: 'water', at: 'Bucuresti', t: 'Apă caldă oprită în 3 cartiere', d: 'Drumul Taberei, Militari, Crângași', cty: 'Bucuresti' },
]

// Vremea in orase [cheie, temperatura, cer, nivel, judet]  nivel: principal | secundar | local
export const VREME: [string, number, string, string, string][] = [
  ['Bucuresti', 4, 'fog', 'principal', 'Bucuresti'], ['Craiova', 3, 'fog', 'principal', 'Dolj'], ['Cluj-Napoca', 1, 'cloud', 'principal', 'Cluj'], ['Timisoara', 5, 'cloud', 'principal', 'Timis'],
  ['Iasi', 0, 'cloud', 'principal', 'Iasi'], ['Constanta', 7, 'sun', 'principal', 'Constanta'], ['Brasov', -2, 'snow', 'principal', 'Brasov'],
  ['Sibiu', 0, 'snow', 'secundar', 'Sibiu'], ['Suceava', -1, 'snow', 'secundar', 'Suceava'], ['Galati', 3, 'cloud', 'secundar', 'Galati'], ['Oradea', 4, 'cloud', 'secundar', 'Bihor'],
  ['Baia Mare', 1, 'cloud', 'secundar', 'Maramures'], ['Bacau', 1, 'cloud', 'secundar', 'Bacau'], ['Pitesti', 2, 'fog', 'secundar', 'Arges'], ['Targu Mures', 0, 'cloud', 'secundar', 'Mures'], ['Tulcea', 6, 'sun', 'secundar', 'Tulcea'],
  ['Targu Jiu', 1, 'cloud', 'local', 'Gorj'], ['Drobeta-Turnu Severin', 5, 'cloud', 'local', 'Mehedinti'], ['Slatina', 3, 'fog', 'local', 'Olt'], ['Ramnicu Valcea', 2, 'cloud', 'local', 'Valcea'],
  ['Caracal', 3, 'fog', 'local', 'Olt'], ['Calafat', 4, 'fog', 'local', 'Dolj'], ['Petrosani', -1, 'snow', 'local', 'Hunedoara'], ['Novaci', -3, 'snow', 'local', 'Gorj'], ['Motru', 2, 'cloud', 'local', 'Gorj'],
]
export const COND_TEXT: Record<string, string> = { fog: 'Ceață, cod galben', cloud: 'Înnorat', sun: 'Soare', snow: 'Ninsoare, cod galben de la 14:00', rain: 'Ploaie' }

export const PRETURI = [520, 480, 455, 440, 450, 510, 640, 780, 812, 690, 520, 390, 310, 268, 290, 380, 560, 820, 1045, 1120, 980, 760, 640, 580]

export const JOBURI_DEMO: { t: string; co: string; min?: number; max?: number; note?: string; w: string; cty: string; city: string; pr?: boolean; desc: string; req: string[] }[] = [
  { t: 'Operator producție', co: 'Fabrică de componente auto, Filiași', min: 4300, max: 4800, w: 'transport asigurat', cty: 'Dolj', city: 'Filiași', pr: true, desc: 'Lucru pe o linie nouă de cablaje auto, în trei ture. Curs de calificare plătit, de o lună, la angajare.\nTransport gratuit cu microbuzul din Craiova și Târgu Jiu.', req: ['Fără experiență necesară', 'Disponibilitate pentru lucru în ture', 'Atenție la detalii'] },
  { t: 'Asistent medical, ATI', co: 'Spital privat, Craiova', min: 5200, w: 'ture de 12 h', cty: 'Dolj', city: 'Craiova', desc: 'Secția de terapie intensivă a unui spital privat din Craiova angajează asistenți medicali generaliști.', req: ['Diplomă de asistent medical generalist', 'Aviz de liberă practică valabil', 'Experiența în ATI este un avantaj'] },
  { t: 'Șofer categoria C+E', co: 'Firmă de transport, Târgu Jiu', min: 7500, note: '+ diurnă', w: 'curse interne', cty: 'Gorj', city: 'Târgu Jiu', pr: true, desc: 'Curse interne cu întoarcere acasă în weekend. Camioane noi, cu cutie automată.', req: ['Permis C+E și atestat', 'Card tahograf', 'Minimum un an de experiență'] },
  { t: 'Contabil', co: 'Cabinet de expertiză, Râmnicu Vâlcea', min: 4500, w: 'program 8–16', cty: 'Valcea', city: 'Râmnicu Vâlcea', desc: 'Contabilitate pentru un portofoliu de firme mici și mijlocii din județ.', req: ['Studii economice', 'Experiență cu declarațiile lunare', 'Cunoașterea unui program de contabilitate'] },
  { t: 'Electrician de întreținere', co: 'Parc fotovoltaic, Rovinari', min: 5000, w: 'start în ianuarie', cty: 'Gorj', city: 'Rovinari', desc: 'Întreținerea instalațiilor unui parc fotovoltaic nou. Se acceptă foști mineri recalificați.', req: ['Calificare de electrician', 'Autorizație ANRE (de preferat)', 'Disponibilitate pentru intervenții'] },
  { t: 'Programator Java', co: 'Companie IT, Craiova', min: 9000, max: 13000, w: 'hibrid', cty: 'Dolj', city: 'Craiova', desc: 'Dezvoltare de aplicații pentru clienți din logistică. Două zile pe săptămână la birou.', req: ['Minimum 2 ani de Java', 'Experiență cu baze de date relaționale', 'Engleză de lucru'] },
  { t: 'Inginer software', co: 'Centru de cercetare IA, Cluj-Napoca', min: 11000, max: 16000, w: 'hibrid', cty: 'Cluj', city: 'Cluj-Napoca', pr: true, desc: 'Echipa lucrează la recunoașterea vorbirii pentru limbile din Europa de Est.', req: ['Python sau C++', 'Experiență cu învățare automată (avantaj)', 'Absolvenții sunt bineveniți'] },
  { t: 'Asistent medical', co: 'Spital universitar, București', min: 5400, w: 'ture', cty: 'Bucuresti', city: 'București', desc: 'Posturi în secțiile de medicină internă și chirurgie.', req: ['Diplomă de asistent medical', 'Aviz de liberă practică'] },
  { t: 'Sudor', co: 'Șantier naval, Galați', min: 6200, note: '+ cazare', w: 'cazare asigurată', cty: 'Galati', city: 'Galați', desc: 'Sudură pe corpuri de navă. Curs de trei luni pentru cei fără experiență navală.', req: ['Calificare de sudor', 'Disponibilitate pentru lucru în schimburi'] },
  { t: 'Contabil', co: 'Firmă de distribuție, Iași', min: 4800, w: 'program 9–17', cty: 'Iasi', city: 'Iași', desc: 'Contabilitate primară și raportări pentru o firmă de distribuție alimentară.', req: ['Studii economice', 'Minimum 2 ani de experiență'] },
  { t: 'Electrician', co: 'Fabrică de cabluri, Timișoara', min: 5300, w: 'trei ture', cty: 'Timis', city: 'Timișoara', desc: 'Mentenanță pe liniile de producție.', req: ['Calificare de electrician', 'Experiență în producție (avantaj)'] },
  { t: 'Recepționer', co: 'Hotel de munte, Poiana Brașov', min: 3900, note: '+ bacșiș', w: 'sezon de iarnă', cty: 'Brasov', city: 'Brașov', desc: 'Recepție și rezervări pentru sezonul de schi.', req: ['Engleză de conversație', 'Experiență în turism (avantaj)'] },
  { t: 'Lucrător comercial', co: 'Supermarket, Constanța', min: 3600, w: 'program în ture', cty: 'Constanta', city: 'Constanța', desc: 'Aprovizionarea raftului și casierie.', req: ['Fără experiență necesară'] },
  { t: 'Mecanic auto', co: 'Service auto, Pitești', min: 5200, w: 'luni–vineri', cty: 'Arges', city: 'Pitești', desc: 'Diagnoză și reparații pentru autoturisme.', req: ['Calificare de mecanic auto', 'Minimum 2 ani de experiență'] },
  { t: 'Operator call center', co: 'Firmă de servicii, Bacău', min: 3700, w: 'hibrid', cty: 'Bacau', city: 'Bacău', desc: 'Relații cu clienții pentru un furnizor de utilități.', req: ['Comunicare clară', 'Engleză (avantaj)'] },
  { t: 'Agent pază', co: 'Firmă de securitate, Oradea', min: 3500, w: 'ture de 12 h', cty: 'Bihor', city: 'Oradea', desc: 'Pază pentru un parc logistic.', req: ['Atestat de agent de pază'] },
  { t: 'Bucătar', co: 'Restaurant, Sibiu', min: 4600, w: 'program flexibil', cty: 'Sibiu', city: 'Sibiu', desc: 'Bucătărie tradițională, restaurant în centrul vechi.', req: ['Experiență de minimum un an'] },
  { t: 'Profesor de matematică (suplinitor)', co: 'Liceu tehnologic, Slatina', min: 4400, w: 'până în iunie', cty: 'Olt', city: 'Slatina', desc: 'Post de suplinitor pentru clasele a IX-a și a X-a.', req: ['Studii de specialitate', 'Modul psihopedagogic'] },
  { t: 'Instalator', co: 'Firmă de construcții, Drobeta-Turnu Severin', min: 4800, w: 'șantiere în județ', cty: 'Mehedinti', city: 'Drobeta-Turnu Severin', desc: 'Instalații sanitare și termice în blocuri noi.', req: ['Calificare de instalator', 'Permis B (avantaj)'] },
  { t: 'Vânzător', co: 'Magazin de bricolaj, Craiova', min: 3800, w: 'program în ture', cty: 'Dolj', city: 'Craiova', desc: 'Consiliere clienți în raionul de grădină și instalații.', req: ['Comunicare bună', 'Fără experiență necesară'] },
  { t: 'Analist date', co: 'Bancă, București', min: 10000, max: 14000, w: 'hibrid', cty: 'Bucuresti', city: 'București', desc: 'Rapoarte și modele pentru departamentul de risc.', req: ['SQL', 'Python sau R', 'Minimum 2 ani de experiență'] },
  { t: 'Asistent farmacist', co: 'Farmacie, Brăila', min: 4000, w: 'ture', cty: 'Braila', city: 'Brăila', desc: 'Eliberarea medicamentelor și consiliere.', req: ['Diplomă de asistent farmacist'] },
]

export const FARMACII_SV: [string, string, string, boolean][] = [['Farmacia Lunca', 'Calea București 54', 'non-stop', true], ['Farmacia Sfântul Dumitru', 'Str. Unirii 12', 'până la 23:00', false], ['Farmacia Rovine', 'Bd. Dacia 88', 'non-stop', false]]
export const NUME_FARMACII = ['Farmacia Centrală', 'Farmacia Sfânta Maria', 'Farmacia Tei', 'Farmacia Dumbrava', 'Farmacia Speranța', 'Farmacia Salvia', 'Farmacia Arnica', 'Farmacia Mentha']
export const STRAZI = ['Piața Unirii 3', 'Bd. Independenței 21', 'Str. Republicii 14', 'Calea Victoriei 40', 'Bd. Revoluției 7', 'Str. Mihai Eminescu 9', 'Str. Libertății 25', 'Bd. Decebal 31']
