# Fluxurile de date reale (de construit după lansare)

Acum toate datele utile sunt **demonstrative** și se pot edita de mână în /admin (grupul „Date utile”).
Colecțiile sunt gândite ca un script de import să scrie în ele prin API-ul local Payload, fără schimbări de schemă.
Regulă comună: un import nu șterge ce a scris redacția; marchează sursa în câmpul `source` și setează `until`.
Fiecare import = un script în `scripts/import/<nume>.ts`, rulat periodic (cron pe server), cu jurnal și alertă la eșec.
Nu se face scraping fără acordul sursei: întâi date deschise sau parteneriate.

| Colecție | Sursa reală | Frecvență | Importul propus |
|---|---|---|---|
| `energy-prices` | OPCOM, rezultatele PZU (prețuri pe ore, publicate zilnic după 13:00 pentru ziua următoare) | zilnic, 14:00 | `opcom.ts`: descarcă raportul public, scrie `day` + cele 24 de valori |
| `fuel-prices` | Monitorul prețurilor la carburanți (Consiliul Concurenței) sau parteneriat cu un agregator | zilnic | `carburanti.ts`: media pe județ (benzină, motorină, GPL), plus cea mai ieftină stație în `cheapestNote` |
| `road-events` | CNAIR / Infotrafic (comunicate și harta drumurilor închise), IGPR | la 15 min | `drumuri.ts`: un eveniment pe drum+porțiune, `mapSegment` ales din tabelul de tronsoane (`src/shared/harta.ts`) |
| `travel-times` | API de rutare (ex. timpi în trafic) pe rutele fixe ale fiecărei ediții | la 15 min | `timpi.ts` |
| `weather-alerts` | ANM, avertizările oficiale (coduri pe județe) | la 30 min | `anm-coduri.ts`: cod, fenomen, județe, interval |
| `weather` | ANM (prognoză orașe) sau un model numeric deschis | orar | `vreme.ts`: temperatura acum + 4 ore din zi |
| `outages` | Distribuitorii de curent, apă, gaz (anunțurile de întreruperi programate și avarii) | orar | `avarii-<distribuitor>.ts`, câte unul pe furnizor |
| `pharmacies` | Colegiul Farmaciștilor / DSP județene (programul de gardă) | săptămânal | `farmacii.ts` |
| `jobs` + `counties.jobsActive` | Parteneriate cu site-uri de joburi (feed XML/JSON) + anunțurile directe ale firmelor | zilnic | `joburi.ts`: anunțurile cu `source=import`, numărul total pe județ în `jobsActive` |

După fiecare import, instantaneul site-ului se reîncarcă singur în cel mult 60 de secunde.
