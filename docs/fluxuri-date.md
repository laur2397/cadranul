# Fluxurile de date reale (importurile automate)

Sistemul automat (`src/surse/`) aduce datele utile din surse oficiale fără ca redacția să le tasteze.
Starea la 24.11.2026: **ANM și OPCOM rulează automat**; drumurile, carburanții și avariile au conectorii gata și testați,
dar sunt **opriți până la acordul scris al sursei** (cererile sunt în `docs/cereri-acces/`).

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
`needs_permission`, `permission_granted`, `partner_api`), adresa (se poate corecta dacă sursa își mută pagina), termenii,
atribuirea, ultima rulare, ultimul succes, documente scrise, eșecuri la rând, ultima eroare. Jurnalul: **Surse de date: jurnal**
(un rând pe rulare, se curăță după 30 de zile).
- Doar administratorul poate porni o sursă; editorul o poate opri.
- O sursă cu statutul `needs_permission` **nu descarcă nimic**, chiar dacă e bifată „Pornit”.
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

| Conector | Colecție | Sursa (verificată 24.11.2026) | Format | Frecvență | Statut | Pornit |
|---|---|---|---|---|---|---|
| `anm-avertizari` | `weather-alerts` | ANM: https://www.meteoromania.ro/avertizari-xml.php și …/avertizari-nowcasting-xml.php | XML | la 10 min | public_official | **da** |
| `opcom-pzu` | `energy-prices` | OPCOM: https://www.opcom.ro/rapoarte-pzu-raportPIP-export-csv/ZZ/LL/AAAA/ro | CSV (servit ca text/html) | zilnic după 13:15, reîncercare la 20 min până la 23:30 | public_official | **da** |
| `igpr-infotrafic` | `road-events` | Poliția Română, Centrul INFOTRAFIC (comunicate) | HTML/text | la 15 min | needs_permission | nu |
| `cnair-drumuri` | `road-events` | CNAIR: **www.cnadnr.ro** (atenție: cnair.ro e altă firmă!) | HTML/text | la 15 min | needs_permission | nu |
| `carburanti-cc` | `fuel-prices` | Consiliul Concurenței, Monitorul prețurilor (monitorulpreturilor.info) | CSV/JSON cerut | zilnic 09:40 + la cerere | needs_permission | nu |
| `avarii-deo` | `outages` | Distribuție Energie Oltenia (PDF săptămânal pe județe) | CSV/JSON cerut | la 60 min | needs_permission | nu |
| `avarii-apa-oltenia` | `outages` | Compania de Apă Oltenia | CSV/JSON cerut | la 60 min | needs_permission | nu |
| `avarii-distrigaz-sud` | `outages` | Distrigaz Sud Rețele (comunicate DOCX) | CSV/JSON cerut | la 60 min | needs_permission | nu |

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

### Drumuri: IGPR Infotrafic și CNAIR, oprite (necesită acord)
- **Ce am găsit**: comunicatele Infotrafic sunt publice (preluate integral de AGERPRES), dar politiaromana.ro nu a răspuns din
  mediul nostru (nici robots.txt) și nu publică termeni de reutilizare automată. CNAIR folosește **cnadnr.ro** (cnair.ro este
  site-ul unei firme private fără legătură); harta drumurilor închise și comunicatele nu au termeni de reutilizare, iar site-ul
  nu a răspuns. Nu există un set pe data.gov.ro.
- **Parserele sunt gata și testate** pe formulările reale („DN 1 Ploiești - Brașov: coloane de autovehicule între Nistorești - Comarnic;”,
  „DN23, Mândrești Munteni (Jud Vrancea) – Olăneasca (Jud. Brăila);”, „DN 1 - km 65+913 - km 66+500, Bărcăneşti;”): starea
  (închis / lucrări / coadă / normal, plus ceață, polei, zăpadă), județul, km, localitățile.
- **Potrivirea pe hartă** (`src/surse/tronsoane.ts`): 1) localitățile numite care stau pe traseul unui tronson al aceluiași drum
  (dicționar de ~180 de localități în `src/surse/geo.ts`); 2) kilometrajul, din tabelul `TABEL_KM` (aproximativ, de verificat cu
  CNAIR); 3) drum cu un singur tronson desenat. Altfel: fără tronson, doar semnul de pe hartă la localitate sau la reședința județului.
- Valabilitate: un eveniment IGPR rămâne 6 ore, unul CNAIR 12 ore, prelungite la fiecare comunicat; ce dispare din comunicat expiră.
- **Acțiune proprietar**: trimite `docs/cereri-acces/igpr-infotrafic.md` și `cnair-drumuri.md`; după răspuns, în /admin: statutul
  „Acord primit”, adresa fluxului primit, „Pornit”.

### Carburanți: Consiliul Concurenței, oprit (necesită acord)
- monitorulpreturilor.info nu publică o licență de reutilizare, nu are export public și nu răspunde din afara României
  (agregatorii europeni îl listează explicit „fără licență” și au scos datele României pe 08.11.2026 pentru revizuirea licenței).
- Conectorul așteaptă formatul cerut în scrisoare: CSV/JSON pe stații `judet;localitate;statie;retea;adresa;produs;pret;actualizat`.
  Calculează media pe județ (benzină și motorină standard, GPL; fără premium), cea mai ieftină stație și ignoră prețurile mai vechi de 48 h.
- Alternativă deschisă, doar națională și săptămânală: Weekly Oil Bulletin al Comisiei Europene (CC BY 4.0), nu pe județe.
- **Acțiune proprietar**: trimite `docs/cereri-acces/consiliul-concurentei-carburanti.md`.

### Avarii (curent, apă, gaz), oprite (necesită acord)
- **Distribuție Energie Oltenia**: PDF săptămânal pe județe „Lucrări pentru prevenire și corectare avarii” cu coloanele
  Data | Interval orar | Localitatea | Zona (data goală = ziua de deasupra); parserul citește exact aceste coloane (mostră reală,
  Gorj 23.03.2026). Site-ul cere validare anti-robot (cod 338) clienților automați: nu o ocolim, cerem acord și un export.
- **Compania de Apă Oltenia**: anunțuri pe site / presă, fără format structurat (robots.txt permite, dar fără termeni).
- **Distrigaz Sud Rețele**: comunicate de presă DOCX în wp-content.
- Un singur parser pentru toți: `judet;data;interval;localitate;zona` (CSV sau JSON). Titlul afișat: „Curent oprit joi, 09:00–16:00”.
- **Acțiune proprietar**: trimite cele trei cereri din `docs/cereri-acces/`.

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

Lista e orientativă (concesiunile se mai schimbă); se verifică pe site-ul ANRE înainte de cereri. Un conector nou = o linie în
`src/surse/conectori.ts` cu `avarii('<cheie>', …)` și o cerere în `docs/cereri-acces/`.

## Ce nu e încă automat (din tabelul inițial)
| Colecție | Sursa propusă | Stare |
|---|---|---|
| `weather` (orașe) | ANM prognoză sau un model numeric deschis | manual / demo |
| `travel-times` | API de rutare | manual / demo |
| `pharmacies` | Colegiul Farmaciștilor / DSP | manual / demo |
| `jobs` | parteneriate cu site-uri de joburi | manual / demo |

## În producție
Un al doilea proces lângă site, cu același `.env`: `npm run surse:worker` (vezi README, secțiunea „Importurile automate”).
