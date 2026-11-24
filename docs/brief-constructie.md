# Cadranul: brief de constructie (de la proprietar, 24.11.2026)

Proprietar: Marius (Craiova). A ales numele **Cadranul** (slogan „Romania, ora de ora.”) si designul **D**:
prima pagina este harta vie a Romaniei. Modelul aprobat: `referinta-design-d/index.html` (+ `shots/`, `concept.md`).
Strategia de cititori si bani: `docs/strategie.md`. Elementele cerute de el: `docs/brief-design.md`.

## Ce conteaza pentru el (in ordinea asta)
1. Site-ul arata si se comporta EXACT ca modelul D (aceeasi harta cu relief, aceleasi straturi, aceeasi tipografie,
   culori, animatii, mod intunecat), dar devine un site real: continut din baza de date, adrese reale, rapid pe telefon.
2. Cele 6 elemente: „De la ultima vizita / Esti la zi”, „Ziua in 7 subiecte” + calculatoare, „Buna dimineata, <oras>”
   cu carduri locale (vreme, trafic, avarii, farmacii), pretul energiei (ora cu ora) si carburantii, starea drumurilor,
   locurile de munca (cu anunturi „Promovat” platite).
3. Bani din reclame fara agresivitate: locurile de reclama din model, marcate „Publicitate”; scripturile Google/Meta
   se incarca doar dupa acord (Consent Mode v2). Joburi promovate si sponsor de editie/rubrica = vanzare directa.
4. Redactia lucreaza simplu din /admin.
Nu ingropa proiectul in proceduri: regulile legale minime raman (reclame marcate, acord cookie corect), restul e produs.

## Motorul (deja in folder, refolosit din proiectul anterior)
Next.js 16.4.6 + Payload 3.94.1 + PostgreSQL, Node 24.22.3 (versiuni fixe). Colectiile existente: articole (ciorne,
versiuni, surse, corecturi), LIVE, autori, sectiuni, regiuni (cu „lansata”), judete, teme, pagini legale, imagini,
redirectionari, provenienta (doar adaugare), plus scriptul de import demonstrativ si testele. Frontend-ul vechi a fost scos.
