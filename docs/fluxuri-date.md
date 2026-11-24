# Fluxurile de date reale (importurile automate)

Sistemul automat (`src/surse/`) aduce datele utile din surse oficiale fără ca redacția să le tasteze.
Starea la 24.11.2026 (sursele verificate din România de editor, în aceeași zi): **pornite** ANM, OPCOM (date publice
oficiale), CNAIR (flux RSS), Monitorul prețurilor și Compania de Apă Oltenia (anunțuri publice preluate cu atribuire,
statutul `public_notice`, decizia editorului). **Oprite**, cu motivul scris în /admin: Poliția Română Infotrafic (robots.txt
interzice), Distribuție Energie Oltenia (validare anti-robot), Distrigaz Sud Rețele (formular interactiv legat de sesiune).
Pentru acestea calea este cererea din `docs/cereri-acces/`; pentru celelalte scrisorile sunt opționale (flux structurat).

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

| Conector | Colecție | Adresa folosită | Format | Frecvență | Statut | Pornit |
|---|---|---|---|---|---|---|
| `anm-avertizari` | `weather-alerts` | https://www.meteoromania.ro/avertizari-xml.php (+ …/avertizari-nowcasting-xml.php) | XML | 10 min | public_official | **da** |
| `opcom-pzu` | `energy-prices` | https://www.opcom.ro/rapoarte-pzu-raportPIP-export-csv/ZZ/LL/AAAA/ro | CSV (servit ca text/html) | zilnic după 13:15, reîncercare la 20 min | public_official | **da** |
| `cnair-drumuri` | `road-events` | https://www.cnadnr.ro/ro/comunicare/comunicate-de-presa/rss | RSS | 30 min (Crawl-delay 10 s respectat) | public_notice | **da** |
| `carburanti-cc` | `fuel-prices` | https://monitorulpreturilor.info/pmonsvc/Gas/ `GetUATByName` + `GetGasItemsByUat` (un produs pe cerere) | XML | zilnic 09:40 | public_notice | **da** |
| `avarii-apa-oltenia` | `outages` | https://www.apaoltenia.ro/index.php/category/anunturi/feed/ | RSS | 60 min | public_notice | **da** |
| `tomtom-trafic` | `road-events` | https://api.tomtom.com/maps/orbis/traffic/incidents/details (rezervă: API clasic v5 `incidentDetails`) | JSON | 25 min (`TOMTOM_MINUTE`) | partner_api | **da, doar cu `TOMTOM_API_KEY`** |
| `igpr-infotrafic` | `road-events` | https://www.politiaromana.ro/ro/info-trafic | HTML | 15 min | needs_permission | nu: robots.txt interzice |
| `avarii-deo` | `outages` | https://www.distributieoltenia.ro/ro/intreruperi-programate → PDF-uri | HTML + PDF | 6 ore | needs_permission | nu: validare anti-robot |
| `avarii-distrigaz-sud` | `outages` | https://www.distrigazsud-retele.ro/clienti/utile-clienti/intreruperi-gaze-naturale/ | formular | 60 min | needs_permission | nu: formular legat de sesiune |

Adresa se poate corecta din /admin › Surse de date (câmpul gol = adresa din cod). Migrările `…123700_surse_pornite` și
`…130000_surse_verificate` aduc registrele existente la starea din tabel.

## Trafic în timp real (TomTom)

Accidentele, cozile, drumurile închise și lucrările de pe hartă vin, în timp real, din **TomTom Traffic** („Incident Details”),
un API cu licență, nu din preluarea unui site. Pași (o singură dată, îi face proprietarul, cu contul lui):

1. Cont gratuit pe https://developer.tomtom.com (fără card). În contul tău: „Keys” › copiezi cheia (are acces la Traffic API).
2. În fișierul `.env` al site-ului adaugi un rând: `TOMTOM_API_KEY=cheia-ta`. Cheia nu se trimite nimănui și nu intră în git.
3. Repornești site-ul cu importurile (`porneste-mac.sh --cu-surse` / `porneste-windows-cu-date-reale.cmd`).

Cum lucrează: România e împărțită în ~36 de dreptunghiuri (API-ul acceptă cel mult 10.000 km² pe cerere), câte o cerere pe
dreptunghi la fiecare rulare. Planul gratuit are 2.500 de cereri pe zi, deci implicit o rulare la 25 de minute (~2.100 de
cereri pe zi). Mai des (`TOMTOM_MINUTE=10` sau `5`) se plătește: la 10 minute ~5.200 de cereri pe zi, peste limită ~0,75 USD
la 1.000 de cereri. Se păstrează doar ce contează pentru cititor: drumuri închise, accidente, polei / inundații, cozi de peste
5 minute (`TOMTOM_MIN_INTARZIERE`), lucrări și vehicule defecte pe autostrăzi și drumuri naționale. Textele sunt scrise în
română după categoria incidentului; pe site apare „Sursa: TomTom Traffic”. Incidentele dispar singure când TomTom nu le mai
raportează. Înainte de lansarea publică: se citesc condițiile TomTom de afișare și păstrare a datelor (atribuire, cât timp se
pot ține) și, dacă e nevoie, se trece pe planul plătit / contract.

Pentru o instalare demonstrativă, `npm run curata-demo` scoate de pe hartă drumurile, avariile, codurile meteo, timpii de
parcurs și frazele de sus demonstrative, ca să rămână doar datele reale (articolele și joburile demonstrative rămân).

## Prima rulare pe server: ce verifici
1. `npm run surse -- all --dry-run`, apoi `npm run surse:status`. Fiecare sursă cu `eroare` spune ce lipsește.
2. **CNAIR**: în simulare trebuie să apară închiderile curente (ex. „+ DN67C Obârșia Lotrului–Curpăt”), fără transporturi
   agabaritice, achiziții sau mentenanță IT. O rulare durează ≥ 10 s (Crawl-delay).
3. **Carburanți**: prima rulare caută UAT-ul fiecărei reședințe (42 de cereri, apoi ținute minte în registru) și face câte o
   cerere pe produs (11, 21, 31): ~170 de cereri, ~4-5 minute cu pauza de 1,5 s. Verifică mesajul „fără date pentru N județe”
   (București sau alte reședințe al căror UAT are alt nume: corectează în `RESEDINTE`, `src/surse/geo.ts`).
4. **Apa Oltenia, ANM, OPCOM**: verificate cu date reale; nimic special.
5. Pornește worker-ul (`npm run surse:worker` ca serviciu) și urmărește 24 de ore jurnalul „Surse de date: jurnal”.
6. Sursele oprite: trimite cererile din `docs/cereri-acces/`; după răspuns, în /admin: statutul „Acord primit”, adresa fluxului, „Pornit”.

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

### Drumuri
**CNAIR, pornit.** Fluxul RSS oficial al comunicatelor (verificat 24.11.2026; robots.txt permite, `Crawl-delay: 10`, respectat
de `src/surse/http.ts`). Fiecare `<item>` are titlu, `description` (corpul Drupal escapat; textul e în `field-item` cu
`property="content:encoded"`) și `pubDate`. Păstrăm doar comunicatele despre închideri / restricții / lucrări care afectează
circulația; ignorăm transporturile agabaritice, achizițiile (DALI, SF) și mentenanța IT. Din text: drumul („DN 7C” → `DN7C`),
porțiunea („între Obârșia Lotrului și Curpăt”), km („între km 61+000 și km 79+000”), începutul („Luni, 23 noiembrie, ora 10:30”
sau „Marți, 27.10.2026, ora 18:00”, altfel `pubDate`), motivul („din cauza …”). CNAIR nu publică sfârșitul: un comunicat
rămâne **7 zile** de la început; un comunicat mai nou „se redeschide” pe același drum îl anulează. Atenție: cnair.ro e altă firmă.

**Poliția Română Infotrafic, oprit.** `https://politiaromana.ro/robots.txt` (24.11.2026): `User-agent: * / Disallow: / /
Allow: /index.php`, deci accesul automat la `/ro/info-trafic` este interzis; nu îl ocolim (nici prin `/index.php`). Pagina are
liste „Sursa: INFOTRAFIC, Ora 09:15, Categorie Alertă trafic, Status Activ” cu titluri ca „JUDEȚUL ILFOV: CIRCULAȚIE ÎNTRERUPTĂ
PE AUTOSTRADA A0 …”. Calea: `docs/cereri-acces/igpr-infotrafic.md` (cerem RSS/JSON). Parserul comunicatelor e gata.

**Potrivirea pe hartă** (`src/surse/tronsoane.ts`): 1) localitățile numite care stau pe traseul unui tronson al aceluiași drum
(dicționar de ~180 de localități în `src/surse/geo.ts`); 2) kilometrajul (`TABEL_KM`, aproximativ); 3) drum cu un singur tronson
desenat. Altfel doar semnul de pe hartă la localitate sau la reședința județului. Exemplu: DN67C → `dn67c`, DN7C → `dn7c`.

### Carburanți: Monitorul prețurilor, pornit
Serviciul public al aplicației (fără autentificare; robots.txt: 404, deci fără reguli), format verificat din România pe 24.11.2026:
- `GET …/pmonsvc/Gas/GetUATByName?uatname=CRAIOVA` → `<UATs><Items><UAT><Id>69900</Id><Name>Municipiul Craiova, Dolj</Name>…`;
  alegem UAT-ul „Municipiul <Oraș>, <Județ>”. Id-urile se țin minte în registru, deci cererea se face o singură dată.
- `GET …/GetGasItemsByUat?UatId=69900&CSVGasCatalogProductIds=11&OrderBy=price`: **un singur id pe cerere** („11,21,31” dă
  eroare de server). 11 = Benzină standard, 21 = Motorină standard, 31 = GPL (`SURSE_CARBURANTI_PRODUSE`, implicit „11,21,31”,
  e lista din care se face câte o cerere).
- Răspuns: `<GasItems xmlns="…pmonsvc.Models.Protos"><Products><GasProduct><Catprod><Id>11</Id><Name>Benzină standard</Name>
  </Catprod>…<Price>8.93</Price><Stationid>P202</Stationid></GasProduct>…<Stations><GasStation><Addr><Addrstring>…</Addrstring>
  <Uatid>69900</Uatid></Addr><Id>R1399</Id><Name>28 CRAIOVA</Name><Network><Name>PETROM</Name></Network>
  <Updatedate>24/11/2026 11:05 </Updatedate></GasStation>`. Păstrăm doar stațiile din UAT-ul cerut, actualizate în ultimele 72 h.
- Rezultat: media pe județ (din stațiile reședinței) pentru benzină, motorină, GPL (opțional) și cea mai ieftină stație
  („LUKOIL Craiova 2, Calea Severinului: 8,93 lei”). Pe 24.11.2026 la Craiova: benzină 8,96, motorină 10,37 lei/l.
- 3 cereri pe județ (+1 prima dată), pauză 1,5 s, o dată pe zi.

### Avarii (curent, apă, gaz)
- **Compania de Apă Oltenia, pornit**: fluxul RSS public al anunțurilor (verificat, date reale): data, intervalul orar,
  localitatea, „Zone afectate”. Anunțurile de mediu, proiecte, achiziții sunt ignorate; o avarie fără dată ține 12 ore.
- **Distribuție Energie Oltenia, oprit**: pagina cere validare anti-robot (cod 338) și răspunde „Blocked” clienților automați;
  nu o ocolim. Parserul PDF-urilor săptămânale („Lucrări pentru prevenire și corectare avarii”, coloanele Data | Interval orar |
  Localitatea | Zona) e gata și testat pe un PDF real (Dolj, 11-17.12.2023, 48 de rânduri). Calea: cererea din `docs/cereri-acces/`.
- **Distrigaz Sud Rețele, oprit**: robots.txt permite, dar pagina „Întreruperi gaze naturale” e un formular interactiv care
  trimite date legate de sesiune la `/wp-content/themes/distrigaz/templates/special/opriri/opriri_ws_requests.php`; nu reproducem
  astfel de cereri. Cerem un flux structurat (`docs/cereri-acces/distrigaz-sud-retele.md`).

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
