# Mostre reale ale surselor (pentru testele offline ale parserelor)

Descărcate pe 24.11.2026 (cu User-Agent-ul `CadranulBot/1.0`) sau, unde sursa nu a răspuns din mediul de dezvoltare, reconstituite
din texte publice. Fiecare rând spune cât e copiat exact și cât e reconstituit.

| Fișier | Sursa | Cât e real |
|---|---|---|
| `anm-avertizari-2026-11-24.xml` | https://www.meteoromania.ro/avertizari-xml.php | **Copiat exact** (descărcat pe 24.11.2026, ~14:30, 272 KB; cea mai mare parte sunt poligoanele `coordGis`). Conține două atenționări cod galben, una doar cu zone montane (`<zona cod="SV_munte">`). |
| `anm-nowcasting-gol.xml` | https://www.meteoromania.ro/avertizari-nowcasting-xml.php | **Copiat exact** (în acea zi nu era nicio avertizare nowcasting). |
| `anm-nowcasting-exemplu.xml` | idem | **Reconstituit din descriere**: structura unui element nowcasting nu a putut fi observată; parserul e tolerant. De înlocuit cu primul cod real. |
| `opcom-pip-2026-11-24.csv`, `opcom-pip-2026-11-25.csv` | https://www.opcom.ro/rapoarte-pzu-raportPIP-export-csv/24/11/2026/ro (și 25/11) | **Copiate exact** (OPCOM le servește cu `Content-Type: text/html`, deși sunt CSV). Ziua de 25.11 era deja publicată la 14:30 pe 24.11. |
| `igpr-infotrafic-2026-08-01.html` | Comunicatul Centrului INFOTRAFIC (IGPR), 01.08.2026, preluat de AGERPRES | Frazele **copiate exact**; învelișul HTML e generic (politiaromana.ro nu a putut fi citit). Rândul „DN 3A Fetești - Cernavodă: trafic intens” e reconstituit din fraza-continuare care urmează. |
| `cnair-drumuri-inchise.html` | Comunicate CNAIR preluate de economica.net și alba24.ro | Rândurile **copiate exact**; titlurile secțiunilor și învelișul HTML sunt reconstituite. |
| `carburanti-exemplu.csv` | Formatul cerut Consiliului Concurenței (docs/cereri-acces/) | **Fictiv** (prețuri de probă): Monitorul prețurilor nu publică un export și nu răspunde din afara României. |
| `deo-gorj-2026-03-23.csv` | PDF-ul Distribuție Energie Oltenia „Lucrări pentru prevenire și corectare avarii, săptămâna 23.03-29.03.2026, Gorj” | Rândurile **copiate exact** din tabelul PDF (rândul 3 e trunchiat), puse în formatul CSV cerut distribuitorilor (coloana `judet` adăugată). |
