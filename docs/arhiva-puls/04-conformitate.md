# Conformitate legala PULS

Cercetat la 24 noiembrie 2026. **Este informare, nu consultanta juridica.** Un avocat roman pe
drept media, proprietate intelectuala si protectia datelor confirma inainte de lansare.
Punctele marcate „neverificat" sunt explicit nesigure.

---

## 1. Cum este incadrata PULS (de aici decurge tot)

| Regim | Statutul PULS | Ce inseamna |
|---|---|---|
| Regulamentul UE privind AI | **Utilizator** (deployer) de sisteme AI generative. Devine **furnizor** daca lanseaza un asistent AI public sub marca proprie. | art. 50(1), 50(4), 50(5), art. 4 |
| GDPR si Legea 506/2004 | **Operator** pentru analiza, publicitate, newsletter, comentarii | GDPR integral, consimtamant prealabil la cookie-uri |
| DSA | **Nu e serviciu intermediar** cat timp publica doar continut propriu. Devine **serviciu de gazduire** din clipa in care permite comentarii. Practic sigur **nu** e platforma online. | Doar art. 11, 12, 14, 16, 17, 18, si doar cu comentarii. **Sectiunea 3 (art. 19-28, inclusiv tiparele intunecate si transparenta publicitatii) nu se aplica.** |
| Regulamentul european privind libertatea mass-media (EMFA) | **Furnizor de servicii media**. Publicatiile de presa sunt incluse expres. | art. 6(1), 6(3), 18 |
| Legea 365/2002 | Furnizor de servicii ale societatii informationale | art. 5 identificare, art. 6 comunicari comerciale |
| Legea 8/1996 | Editor de presa cu drept conex | drepturi fata de agregatori, obligatii fata de alti editori |

## 2. Ce trebuie sa existe pe site inainte de primul articol

### 2.1 Identificarea legala
O pagina legata din subsolul fiecarei pagini, afisata „intr-o forma clara, vizibil si permanent":
denumirea firmei si sediul, telefon si e-mail de contact direct, numarul de la Registrul
Comertului, CUI, plus structura de proprietate si finantare (EMFA art. 6(1), aplicabil din
8 august 2025). Amenda: 1.000-50.000 lei.

### 2.2 Etichetarea AI - **in vigoare din 2 august 2026**
Doua regimuri diferite, care nu se confunda:

**Imagini, audio, video generate sau modificate de AI.** Legea (art. 50(4)) obliga utilizatorii la
etichetare pentru continutul de tip deepfake, cu reguli mai usoare pentru lucrari evident artistice.
**Ca politica PULS, se eticheteaza intotdeauna**, mai strict decat legea. Pentru deepfake nu exista
exceptie pentru verificarea editoriala. Preferinta deja stabilita pentru fotografii reale in locul
ilustratiilor este si alegerea cu risc minim aici.

**Text generat de AI pe subiecte de interes public: se eticheteaza, CU EXCEPTIA cazului in care
a trecut printr-o verificare umana substantiala** si o persoana fizica sau juridica isi asuma
responsabilitatea editoriala. Ghidurile finale ale Comisiei (20 iulie 2026) cer ca verificarea sa
fie reala: substantiala, facuta de o persoana competenta, **documentata ca flux de lucru, nu
afirmata**. Corectura ortografica sau o aprobare superficiala nu se califica. **O modificare
substantiala facuta de AI dupa verificarea umana anuleaza exceptia.**

Consecinta directa pentru arhitectura: fiecare articol are o pista de provenienta imuabila care
dovedeste cine a verificat, cand, si ca nicio interventie automata substantiala nu a urmat
verificarii. Asta transforma obligatia de etichetare intr-o exceptie aplicabila.

Asistentii AI publici, daca exista: utilizatorul afla ca vorbeste cu un AI la prima interactiune,
vizibil, nu ascuns in termeni.

Forma etichetei: clara, distincta, cel tarziu la prima expunere, accesibila. Comisia a finalizat
trei pictograme oficiale UE pentru etichetare. Sanctiune: pana la 15 milioane euro sau 3% din
cifra de afaceri mondiala.

Pagina `/pagina/ai` (ruta existenta in prototip), cu descrierea exacta a folosirii AI in redactie, serveste trei scopuri
deodata: transparenta ceruta de art. 50, dezvaluirea „cum a fost facut" ceruta de Google, si
declaratia EMFA art. 18 catre marile platforme.

### 2.3 Consimtamantul
- **Platforma de consimtamant certificata Google si inregistrata TCF v2.2 este obligatorie**, nu
  optionala, pentru a servi reclame Google personalizate utilizatorilor din SEE. Atentie: aceasta este
  **o politica comerciala Google, nu o lege**; legea cere consimtamantul, Google cere forma lui. Site-ul anterior al
  proprietarului nu avea niciuna, ceea ce explica in parte veniturile aproape nule.
- Totul blocat implicit: fara analiza, fara etichete de publicitate, fara pixel Meta, fara
  continut incorporat (YouTube, X, Facebook, Instagram, Spotify, Google Maps) inainte de acord.
  Continutul incorporat se inlocuieste cu substituenti „apasa ca sa incarci".
- Consent Mode v2 in **modul Basic**: valorile implicite pe `denied` in `<head>`, iar etichetele
  Google se incarca abia dupa decizie. Modul Advanced (semnale fara cookie-uri inainte de acord) nu se
  foloseste fara aviz scris de la avocat.
- Acceptarea si refuzul cu greutate egala in primul strat; numarul de furnizori afisat in primul
  strat; control pe scopuri in al doilea.
- Control permanent „Setari cookie-uri" in subsol; retragerea opreste efectiv urmarirea.
- Jurnalul consimtamantului: moment, sirul TCF, versiunea platformei; exportabil la cerere.
- **Fonturi gazduite local**, fara CDN-ul Google Fonts si fara avatare la distanta; au fost teme
  recurente de sanctionare in UE.

### 2.4 Identificarea publicitatii - obligatorie in Romania, independent de DSA
Legea 363/2007 interzice **in orice imprejurare** folosirea unui context editorial pentru a
promova un produs platit fara ca acest lucru sa fie precizat clar. Amenda 3.000-30.000 lei, plus
suspendarea activitatii. Legea 365/2002 cere ca orice comunicare comerciala sa fie clar
identificabila, impreuna cu cel in numele caruia se face.

Concret: eticheta neambigua pe fiecare material platit („Publicitate", „Articol sponsorizat",
„Advertorial - continut platit de [client]"), nu formulari moi ca „Parteneriat" folosite singure;
eticheta deasupra textului, si in lista, si pe pagina articolului; tratament vizual distinct;
`rel="sponsored"` pe legaturile comerciale; aceeasi adresa unica de articol (`/articol/<id>`), cu `noindex, follow` cum face deja prototipul; excludere din
sitemap-ul de stiri, din fluxurile Top Stories si din marcajul `NewsArticle`.

### 2.5 Restrictii pe categorii de publicitate, de codat in stiva
- **Jocuri de noroc** - zona cu cea mai mare schimbare: din 7 octombrie 2025 sunt interzise
  reclamele cu persoane publice, inclusiv online. ONJN poate ordona eliminarea reclamelor ilegale.
  Doua proiecte adoptate de Senat pe 16 februarie 2026 ar interzice reclama online intre 06:00 si
  24:00; **promulgarea neverificata**. Se construieste acum un strat de publicitate care poate
  bloca o categorie si o poate opri pe interval orar. Operatorii fara licenta se blocheaza absolut.
- **Alcool, tutun, minori** - Legea 148/2000, partial inlocuita de Legea 158/2008; **starea
  exacta a abrogarilor neverificata**. Avocatul produce versiunea consolidata inainte de orice
  contract de publicitate pentru alcool sau tutun.
- Medicamente si suplimente alimentare - reglementate separat; regula proprie in politica de
  publicitate.

### 2.6 Corecturi si drept la replica
**Romania nu are drept la replica legal pentru presa scrisa sau online**; procedura detaliata
priveste doar audiovizualul. Remediile online sunt civile, iar refuzul de a corecta poate agrava
raspunderea. De aceea autoreglementarea face aici treaba legii: pagina `/pagina/corecturi` cu politica,
formular, termenele deja publicate in prototip (erorile analizate in 24 de ore; dreptul la replica confirmat in 2 zile lucratoare si decis motivat in cel mult 5) si
arhiva corecturilor; bloc datat „Actualizat la / Rectificare" pe articol, niciodata editare tacita.

### 2.7 Independenta editoriala - EMFA art. 6(3), aplicabil deja (data exacta de confirmat in Jurnalul Oficial: sursele secundare indica fie 8 noiembrie 2024, fie 8 februarie 2025)
Statut editorial public: linia editoriala, cine poate si cine nu poate interveni, cum e numit si
revocat redactorul-sef, cum e tratata presiunea comerciala. Declaratie de conflicte de interese,
permanenta (alte afaceri si afilieri ale proprietarilor) si pe articol unde e cazul.

### 2.8 Autori si transparenta
Pagini reale de autor cu fotografie, biografie, competente, contact, lista de articole; semnatura
pe fiecare articol legata de pagina; date vizibile de publicare si actualizare. **Profilurile de
autor fabricate, inclusiv fotografii generate si competente inventate, sunt tratate de Google ca
inselaciune** (ghid publicat in octombrie 2026).

## 3. Drepturi asupra continutului - schimba modelul de lucru

- **Limita de extras pentru publicatiile de presa este 120 de caractere** (Legea 8/1996, art. 94¹).
- Exceptia de revista a presei nu este disponibila unui site finantat din publicitate, pentru ca
  cere absenta oricarui avantaj comercial direct sau indirect.
- **Consecinta: un model construit pe agregarea sau rescrierea articolelor altor publicatii nu
  este legal.** Sursele primare (documente oficiale, date publice, reporterii proprii) nu sunt
  o preferinta editoriala, sunt singura cale legala de a acoperi tara.

## 4. Ce trebuie sa existe in organizatie in primele 30 de zile

Declaratiile EMFA art. 18 catre fiecare platforma foarte mare (un instrument concret impotriva
eliminarilor arbitrare de pe Facebook si YouTube, care cere insa disciplina de verificare umana
de la 2.2); aderarea la un organism de autoreglementare; o sesiune documentata de alfabetizare
AI pentru echipa (art. 4 AI Act, aplicabil din februarie 2025); registrul GDPR art. 30 si
evaluarea de impact; acordurile cu persoanele imputernicite; intrebarea scrisa catre ANCOM
privind notificarea; memoriul avocatului privind legislatia publicitatii in forma consolidata.

**Doar daca se permit comentarii:** termeni si conditii, formular de notificare, motivarea
deciziilor de moderare, puncte de contact, procedura pentru infractiuni, si raspunsul ANCOM
primit inainte.

## 5. Calendar

**Deja in vigoare** (de respectat din prima zi): Legea 365/2002; consimtamant prealabil la
cookie-uri; interdictia publicitatii mascate; GDPR si Legea 190/2018 (cu derogarea pentru
jurnalism); TCF v2.2 obligatoriu din noiembrie 2023; dreptul conex al editorilor de presa din
2022; DSA din februarie 2024; alfabetizarea AI din februarie 2025; independenta editoriala EMFA
din februarie 2025; transparenta proprietatii EMFA din august 2025; restrictiile pentru reclamele
de jocuri de noroc cu persoane publice din octombrie 2025; **etichetarea AI din 2 august 2026**.

**Urmeaza:** 2 decembrie 2026 sfarsitul perioadei de gratie a **furnizorilor** pentru marcarea tehnica a sistemelor AI generative (nu priveste PULS ca utilizator)
lansate inainte de august; 1 ianuarie 2027 taxa anuala ANCOM pentru furnizorii stabiliti in
Romania; 8 mai 2027 dreptul utilizatorilor de a-si personaliza oferta media (EMFA art. 20).

**De urmarit:** propunerea de Regulament privind echitatea digitala (publicata noiembrie 2026,
neadoptata); pachetul Omnibus digital pe GDPR si cookie-uri (neadoptat, peste 1.750 de
amendamente); proiectele romanesti privind reclama la jocuri de noroc.

## 6. Ce nu am putut verifica si trebuie confirmat de avocat

Daca PULS trebuie sa notifice ANCOM (se intreaba in scris; raspuns ieftin si decisiv). Starea
exacta a abrogarilor din Legea 148/2000. Daca proiectele privind jocurile de noroc au devenit lege.
Regimul „consimtamant sau plata" pentru un editor mijlociu. Cat de strict va fi interpretata
„verificarea umana substantiala" (documentarea mai mult decat pare necesar e asigurarea ieftina).
Absenta unei obligatii de inregistrare a publicatiilor online in Romania. Mandatul si tarifele
organismului de gestiune colectiva pentru dreptul conex.

## 7. Doua decizii din planul initial care trebuie schimbate

Aceste doua puncte au fost semnalate independent de doi experti diferiti, din doua directii
diferite (juridic si editorial). Nu sunt preferinte:

1. **Publicarea automata pe site si pe retele sociale, fara om, nu este conforma.** Media generata
   de AI se eticheteaza intotdeauna, iar exceptia pentru text cere verificare umana substantiala,
   documentata, pe fiecare articol. Serverul AI local ramane un activ foarte bun pentru
   monitorizare, triaj, transcriere, traducere, structurare si pregatirea ciornelor. **Pasul de
   publicare automata se elimina.**
2. **Panoul de administrare care salveaza in pagina publicata, fara server, nu poate fi folosit in
   productie.** Google News cere ca fiecare articol sa aiba adresa proprie permanenta, in HTML,
   fara textul incorporat in JavaScript. In plus, nu poate sustine nici pista de provenienta
   imuabila ceruta de exceptia AI Act, nici nivelul de securitate GDPR art. 32 pe care se
   concentreaza sanctiunile ANSPDCP (11 din 15 sanctiuni publicate in 2026). Portarea pe server
   rezolva ambele.
