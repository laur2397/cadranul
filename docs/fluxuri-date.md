# Fluxurile de date reale (importurile automate)

Sistemul automat (`src/surse/`) aduce datele utile din surse oficiale fără ca redacția să le tasteze.
Starea la 24.11.2026: **toate cele 8 surse sunt pornite**. ANM și OPCOM sunt date publice oficiale; drumurile, carburanții și
avariile sunt anunțuri publice preluate automat, cu atribuire, prin **decizia editorului** (statutul `public_notice`).
Scrisorile din `docs/cereri-acces/` rămân **opționale**: cer un flux structurat, mai sigur decât citirea paginilor.

**Limite care nu se negociază**: robots.txt respectat; nicio ocolire de validare anti-robot, CAPTCHA sau autentificare (sursa
care le cere apare cu eroare clară în registru); frecvență mică și User-Agent care ne identifică; atribuire și ora actualizării
pe site; păstrăm doar faptele (drum, porțiune, stare, ore; media pe județ și cea mai ieftină stație; zona și intervalul
avariei), nu copii ale paginilor.

## Cum funcționează
- **Un conector pe sursă** (`src/surse/conectori.ts`): descarcă → interpretează (`src/surse/parsere/`) → normalizează → scrie
  în colecțiile Payload existente prin API-ul local (`src/surse/rulare.ts`).
- **Idempotent**: fiecare document are `importer` (conectorul) și `externalId` (identificator stabil la sursă). A doua rulare
  actualizează, nu dublează; dacă nimic nu s-a schimbat, nu scrie nimic.
- **Nu atinge ce a scris redacția**: un conector scrie doar documentele cu `importer` = el. Pentru energie (o zi) și carburanți
  (județ + zi), dacă redacția are deja documentul, importul îl lasă neatins. Dacă un redactor salvează în /admin un document
  importat, se bifează singur „Modificat de redacție” și importul nu-l mai suprascrie (debifezi ca să-l dai înapoi importului).
- **Expirare**: la sursele „instantaneu” (coduri ANM, drumuri, avarii), ce nu mai apare la sursă primește `until = acum` și
  dispare de pe site; după 7 zile se șterge.
- **Politicos**: User-Agent `CadranulBot/1.0 (+<site>/pagina/despre; <SURSE_CONTACT>)`, timp limită 20 s, 3 încercări cu așteptare
  crescătoare (respectă `Retry-After`), cereri condiționate (ETag / Last-Modified, ținute în registru), robots.txt respectat
  (dacă nu poate fi citit din cauza serverului, nu descărcăm). După eșecuri repetate, intervalul se dublează (până la 6 ore).
- **Harta se actualizează singură**: după fiecare scriere, worker-ul cere site-ului (`POST /intern/reincarca-date`, semnat cu
  `PAYLOAD_SECRET`) să-și reîncarce instantaneul; dacă site-ul nu răspunde, instantaneul se reîncarcă oricum în 60 de secunde.
- **Pe site** fiecare widget alimentat automat arată „Sursa: ANM, actualizat azi, la 14:21”. Codurile meteo dispar după `until`;
  carburanții mai vechi de 48 de ore nu intră în media țării și apar estompați cu „Ultimele prețuri publicate: <zi>”.

## Registrul și comutatorul de oprire
/admin › Date utile › **Surse de date (automate)**: un rând pe conector cu „Pornit”, statutul legal (`public_official`,
`public_notice` = anunț public preluat cu atribuire, `needs_permission`, `permission_granted`, `partner_api`), adresa (se poate corecta dacă sursa își mută pagina), termenii,
atribuirea, ultima rulare, ultimul succes, documente scrise, eșecuri la rând, ultima eroare. Jurnalul: **Surse de date: jurnal**
(un rând pe rulare, se curăță după 30 de zile).
- Doar administratorul poate porni o sursă; editorul o poate opri.
- O sursă cu statutul `needs_permission` **nu descarcă nimic**, chiar dacă e bifată „Pornit” (de folosit dacă o sursă ne cere să oprim).
- Oprire de urgență fără /admin: `SURSE_OPRITE=all` (sau o listă de conectori) în `.env`.
- Alertă: după `SURSE_ALERTA_DUPA` eșecuri la rând (implicit 3) apare în jurnal și, dacă e setat, se trimite la `SURSE_ALERT_WEBHOOK`.

## Comenzi
```bash
npm run surse -- ajutor                 # lista conectorilor
npm run surse -- anm-avertizari         # rulează o sursă acum
npm run surse -- all --dry-run          # ce s-ar schimba, fără să scrie nimic
npm run surse:status                    # registrul în terminal
npm run surse:worker                    # procesul permanent (al doilea proces pe server)
```

## Sursele

| Conector | Colecție | Adresa folosită | Format | Frecvență | Statut | Verificat de aici |
|---|---|---|---|---|---|---|
| `anm-avertizari` | `weather-alerts` | https://www.meteoromania.ro/avertizari-xml.php (+ …/avertizari-nowcasting-xml.php) | XML | 10 min | public_official | **da, date reale** |
| `opcom-pzu` | `energy-prices` | https://www.opcom.ro/rapoarte-pzu-raportPIP-export-csv/ZZ/LL/AAAA/ro | CSV (servit ca text/html) | zilnic după 13:15, reîncercare la 20 min | public_official | **da, date reale** |
| `igpr-infotrafic` | `road-events` | https://www.politiaromana.ro/ro/info-trafic (pagină-listă → cel mai nou comunicat) | HTML | 15 min | public_notice | nu (site-ul nu răspunde din afara României) |
| `cnair-drumuri` | `road-events` | https://www.cnadnr.ro/ro (→ comunicatul despre drumuri închise / restricții) | HTML | 30 min | public_notice | nu (idem) |
| `carburanti-cc` | `fuel-prices` | https://monitorulpreturilor.info/pmonsvc/Gas/ `GetUATByName` + `GetGasItemsByUat`, pe reședința fiecărui județ | XML/JSON | zilnic 09:40 (84 de cereri, 1,5 s pauză) | public_notice | nu (idem) |
| `avarii-deo` | `outages` | https://www.distributieoltenia.ro/ro/intreruperi-programate → PDF-urile săptămânale | HTML + PDF | 6 ore | public_notice | pagina cere validare anti-robot: **blocat, raportat** |
| `avarii-apa-oltenia` | `outages` | https://www.apaoltenia.ro/index.php/category/anunturi/feed/ | RSS | 60 min | public_notice | **da, date reale** |
| `avarii-distrigaz-sud` | `outages` | https://www.distrigazsud-retele.ro/clienti/utile-clienti/intreruperi-gaze-naturale/ | HTML | 60 min | public_notice | nu (site în mentenanță / nu răspunde) |

Adresa se poate corecta din /admin › Surse de date (câmpul gol = adresa din cod). Migrarea `20261124_123700_surse_pornite`
a trecut registrele existente la `public_notice`, pornite, cu adresa din cod.

## Prima rulare pe serverul cu internet (din România): ce verifici
1. `npm run surse -- all --dry-run` și apoi `npm run surse:status`. Pentru fiecare sursă cu `eroare`, mesajul spune exact ce lipsește.
2. **IGPR** (`igpr-infotrafic`): dacă apare „pagina … nu conține drumuri și nicio legătură către un comunicat”, deschide
   politiaromana.ro, găsește pagina cu comunicatele INFOTRAFIC și pune adresa ei în /admin. Verifică în simulare că apar
   rânduri „+ DN1 …” cu porțiuni corecte.
3. **CNAIR** (`cnair-drumuri`): la fel, cu pagina de comunicate / „drumuri închise” de pe cnadnr.ro.
4. **Carburanți** (`carburanti-cc`): serviciul nu a putut fi observat de aici; formatul e presupus. Verifică: `GetUATByName`
   întoarce un Id pentru „CRAIOVA”; `GetGasItemsByUat` conține prețuri (Price / ProductId / StationId); ID-urile produselor
   standard (implicit `11,21,31`, se schimbă cu `SURSE_CARBURANTI_PRODUSE`). Dacă numele câmpurilor diferă, salvează un
   răspuns în `tests/fixtures/surse/monitor-gas-craiova.xml` (înlocuind mostra reconstituită) și ajustează `parsere/monitor.ts`.
   Media e calculată din stațiile reședinței județului.
5. **Distribuție Oltenia** (`avarii-deo`): dacă pagina cere în continuare validare („Validation request”, „Blocked”), sursa
   rămâne în eroare; nu o ocolim. Variante corecte: cererea din `docs/cereri-acces/` sau un export de la ei.
   Dacă pagina se deschide, verifică că găsește PDF-urile și că rândurile au data corectă (parserul a fost testat pe un PDF real).
6. **Distrigaz** (`avarii-distrigaz-sud`): verifică structura reală a paginii „Întreruperi gaze naturale” și înlocuiește
   mostra reconstituită `distrigaz-intreruperi-exemplu.html`. Fiecare paragraf / rând cu o dată „ZZ.LL.AAAA” devine o întrerupere.
7. **Nowcasting ANM**: la primul cod nowcasting real, salvează răspunsul și verifică textul (`anm-nowcasting-exemplu.xml` e reconstituit).
8. Pornește worker-ul (`npm run surse:worker` ca serviciu) și urmărește 24 de ore jurnalul „Surse de date: jurnal”.

### ANM (coduri meteo pe județe), pornit
- `<avertizari><avertizare tipMesaj numeTipMesaj dataAparitiei="2026-11-24T10:00" dataExpirarii culoare numeCuloare fenomeneVizate
  intervalul="24 noiembrie, ora 10 – 24 noiembrie, ora 20;" zonaAfectata catre mesaj="<HTML escapat>">` cu
  `<judet cod="DJ" culoare="1">` (tot județul) și `<zona cod="SJ_munte" culoare="1">` (doar o parte: munte, depresiune).
  Culoare: 0 neafectat, 1 galben, 2 portocaliu, 3 roșu. Codul de județ = indicativul auto (B = București).
- Un document pe (avertizare, culoare), cu toate județele acelei culori. Intervalul se citește din `intervalul` (ora României),
  altfel din `dataAparitiei`/`dataExpirarii`. Fenomenele: `fenomeneVizate` dacă e explicit, altfel rândurile „Fenomene vizate:”
  din mesaj. Dacă toate județele sunt afectate doar prin zone `_munte`, textul spune „la munte”.
- Nowcasting: răspunsul gol `<avertizariNowcasting/>` e verificat; structura unui element nu a putut fi observată (nu era niciun
  cod în ziua verificării), parserul e tolerant. **De verificat la primul cod nowcasting real** (mostra `anm-nowcasting-exemplu.xml`).
- robots.txt: `Disallow:` gol (permis). Fluxul XML e publicat pentru redistribuire; afișăm „Sursa: ANM”.

### OPCOM (prețul pe ore), pornit
- Raportul public „PIP și volum tranzacționat”, export CSV, publicat după ~13:00 pentru ziua următoare (la 14:30 pe 24.11,
  ziua de 25.11 era deja publicată). Antet: `"PIP si volum tranzactionat pentru ziua de livrare: 24/11/2026"`, apoi indicii ROPEX,
  apoi tabelul `"Zona de tranzactionare","Interval","Pret de Inchidere a Pietei [lei/MWh]",…,"Rezolutie"` cu rândurile `"Romania"`.
- **15 minute din 2025**: 96 de intervale `PT15M` (92 / 100 în zilele schimbării orei). **Decizia**: păstrăm toate valorile brute
  în `quarterValues` și afișăm media pe oră (ora României) în `values` (24), pentru că widgetul, cadranul și calculatoarele lucrează
  pe ore. Ziua de 23 de ore: ora lipsă = media vecinilor; ziua de 25 de ore: ora dublă = media tuturor sferturilor ei.
  Verificare automată: media celor 96 de valori = ROPEX_DAM_Base publicat (1276,40 lei/MWh pe 24.11; 1506,31 pe 25.11).
- Rulează pentru azi și mâine; dacă mâine nu e publicat, reîncearcă la 20 de minute până la 23:30. robots.txt permite.
- Dacă redacția a scris deja ziua (sau seed-ul demonstrativ), importul nu o atinge: șterge documentul demo ca să-l preia importul.

### Drumuri: IGPR Infotrafic și CNAIR, pornite (anunț public)
- Comunicatele Infotrafic sunt publice (le preia integral și AGERPRES); CNAIR folosește **cnadnr.ro** (cnair.ro este site-ul
  unei firme private fără legătură). Ambele site-uri nu au răspuns din mediul de dezvoltare (nici robots.txt): adresele se
  confirmă la prima rulare. Nu există un set pe data.gov.ro.
- Conectorul citește pagina dată; dacă ea nu e chiar comunicatul, urmează prima legătură de pe același site al cărei text
  pomenește Infotrafic / trafic / drumuri închise / restricții.
- Parserele sunt testate pe formulările reale („DN 1 Ploiești - Brașov: coloane de autovehicule între Nistorești - Comarnic;”,
  „DN23, Mândrești Munteni (Jud Vrancea) – Olăneasca (Jud. Brăila);”, „DN 1 - km 65+913 - km 66+500, Bărcăneşti;”).
- **Potrivirea pe hartă** (`src/surse/tronsoane.ts`): 1) localitățile numite care stau pe traseul unui tronson al aceluiași drum
  (dicționar de ~180 de localități în `src/surse/geo.ts`); 2) kilometrajul (`TABEL_KM`, aproximativ, de verificat cu CNAIR);
  3) drum cu un singur tronson desenat. Altfel doar semnul de pe hartă la localitate sau la reședința județului.
- Un eveniment IGPR rămâne 6 ore, unul CNAIR 12 ore, prelungite la fiecare comunicat; ce dispare din comunicat expiră.
- Dacă un comunicat nu conține nicio frază de forma „DN 1 …: …”, rularea e marcată eroare (format schimbat), nu se șterge nimic.

### Carburanți: Monitorul prețurilor, pornit (anunț public)
- Serviciul public fără autentificare al aplicației Monitorul prețurilor (`/pmonsvc/Gas/…`), o dată pe zi, câte două cereri
  pe județ (UAT-ul reședinței, apoi prețurile), cu 1,5 s pauză. Nu răspunde din afara României, deci formatul e presupus și
  parserul e tolerant (XML sau JSON, după numele câmpurilor). Dacă trei județe la rând dau eroare și nu avem niciun preț,
  rularea e eroare cu motivul.
- Păstrăm doar media pe județ (benzină și motorină standard, GPL; fără premium) și cea mai ieftină stație; prețurile mai vechi
  de 48 h se ignoră, iar pe site cele vechi apar estompate.
- Alternativă deschisă, doar națională și săptămânală: Weekly Oil Bulletin al Comisiei Europene (CC BY 4.0).

### Avarii (curent, apă, gaz), pornite (anunț public)
- **Distribuție Energie Oltenia**: PDF săptămânal pe județe „Lucrări pentru prevenire și corectare avarii”, coloanele
  Data | Interval orar | Localitatea | Zona, cu celule centrate vertical. Parserul (`parsere/deo-pdf.ts`, cu `unpdf`) refăce
  rândurile din poziția textului; testat pe un PDF real (Dolj, 11-17.12.2023, 48 de rânduri). **Pagina cere validare
  anti-robot (cod 338) / „Blocked” pentru clienții automați: nu o ocolim**; conectorul raportează blocajul în registru.
- **Compania de Apă Oltenia**: fluxul RSS public al anunțurilor (verificat, date reale): data, intervalul orar, localitatea,
  „Zone afectate”. Anunțurile de mediu, proiecte, achiziții sunt ignorate; o avarie fără dată ține 12 ore de la publicare.
- **Distrigaz Sud Rețele**: pagina publică „Întreruperi gaze naturale”; pe 24.11.2026 site-ul arăta pagina de mentenanță
  „ePortalDGSR indisponibil” (raportată ca eroare). Formatul se verifică la prima rulare.

#### Distribuitorii din celelalte regiuni (pentru cererile următoare)
| Regiune | Curent | Gaz | Apă (operatorul regional din reședință) |
|---|---|---|---|
| Sud-Vest Oltenia | Distribuție Energie Oltenia | Distrigaz Sud Rețele | Compania de Apă Oltenia (Dolj), Aquaterm/Apa Regio Gorj, Secom (Mehedinți), Compania de Apă Olt, APAVIL (Vâlcea) |
| Sud-Muntenia | Distribuție Energie Oltenia (Argeș, Teleorman), Rețele Electrice Muntenia (Giurgiu), Distribuție Energie Electrică România – Muntenia Nord (Prahova, Dâmbovița), Rețele Electrice Dobrogea (Călărași, Ialomița) | Distrigaz Sud Rețele | Apă Canal 2000 (Argeș), Hidro Prahova, Compania de Apă Târgoviște, Ecoaqua (Călărași), Urban (Ialomița) |
| București-Ilfov | Rețele Electrice Muntenia | Distrigaz Sud Rețele | Apa Nova București, Apa Canal Ilfov |
| Sud-Est | DEER Muntenia Nord (Buzău, Brăila, Galați, Vrancea), Rețele Electrice Dobrogea (Constanța, Tulcea) | Distrigaz Sud Rețele | RAJA Constanța, Compania de Utilități Publice Dunărea Brăila, Apă Canal Galați, Compania de Apă Buzău |
| Nord-Est | Delgaz Grid | Delgaz Grid | ApaVital Iași, ACET Suceava, Nova Apaserv Botoșani, Compania Județeană Apa Serv Neamț, CRAB Bacău, Aquavas Vaslui |
| Centru | DEER Transilvania Sud | Delgaz Grid | Compania Apa Brașov, Apă Canal Sibiu, Aquaserv Mureș, Apa CTTA Alba, Gospodărie Comunală Sfântu Gheorghe, Harviz Harghita |
| Nord-Vest | DEER Transilvania Nord | Delgaz Grid | Compania de Apă Someș (Cluj, Sălaj), Compania de Apă Oradea, Vital Maramureș, Apaserv Satu Mare, Aquabis Bistrița |
| Vest | Rețele Electrice Banat | Delgaz Grid (și Distrigaz Sud Rețele în unele localități) | Aquatim (Timiș), Compania de Apă Arad, Apa Prod Deva, Aquacaraș |

Lista e orientativă (concesiunile se mai schimbă); se verifică pe site-ul ANRE. Un conector nou = un obiect în
`src/surse/conectori.ts` (după modelul Apa Oltenia dacă sursa are RSS, al Distrigaz pentru o pagină HTML).

## Ce nu e încă automat (din tabelul inițial)
| Colecție | Sursa propusă | Stare |
|---|---|---|
| `weather` (orașe) | ANM prognoză sau un model numeric deschis | manual / demo |
| `travel-times` | API de rutare | manual / demo |
| `pharmacies` | Colegiul Farmaciștilor / DSP | manual / demo |
| `jobs` | parteneriate cu site-uri de joburi | manual / demo |

## În producție
Un al doilea proces lângă site, cu același `.env`: `npm run surse:worker` (vezi README, secțiunea „Importurile automate”).
