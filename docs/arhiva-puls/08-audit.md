# Sistemul de audit continuu PULS

Acesta nu este un capitol de calitate. Este componenta care justifica forma intregului proiect.

---

## 1. De ce exista, concret

La site-ul anterior al proprietarului, sase lucruri au mers prost ani de zile fara ca nimeni sa
observe. Fiecare dintre ele este prins de o verificare din acest sistem. Tabelul de mai jos este
contractul: daca o verificare nu prinde esecul pereche, verificarea e gresita.

| Ce s-a intamplat la site-ul anterior | Ce il prinde aici | In cat timp |
|---|---|---|
| Un cont AdSense tert, nedeclarat, servea reclame pe site | Scanarea identificatorilor de publicitate din pagina de productie, comparata cu registrul; diferenta `ads.txt` fata de registru; lista conturilor AdSense prin API; reconcilierea venit-cont | sub 6 ore |
| O agentie a detinut singurele conturi de administrator 2 ani si jumatate | Inventarul rolurilor: fiecare resursa trebuie sa aiba cel putin un proprietar pe domeniul firmei si zero proprietari externi; atestare trimestriala cu aprobator numit | sub 24 ore pentru o schimbare noua |
| `ads.txt` cu o singura linie, in timp ce concurenta avea sute | Verificarea completitudinii fata de partenerii declarati; cautare inversa in `sellers.json`; comparatie cu numarul de linii al concurentei | sub 24 ore, plus comparatie saptamanala |
| Pluginul de backup licentiat pe contul unui tert, cu acces de telecomanda | Registrul de licente: fiecare abonament platit trebuie sa fie pe o identitate de facturare a firmei; scanare de conexiuni de administrare la distanta; verificarea proprietarului destinatiei de backup | sub 24 ore |
| O parola afisata in clar intr-o pagina de administrare | Reguli de analiza statica care blocheaza livrarea codului; scanare automata a suprafetelor de administrare dupa valori care arata a credentiale | la livrarea codului, blocant |
| Nimeni nu a observat nimic, ani de zile | Semnal de viata pentru fiecare verificare; meta-auditul care verifica verificarile; raport saptamanal catre un om numit, cu confirmare obligatorie | sub 1 ora pentru o verificare amutita |

Ultimul rand e cel mai important. **O verificare care tace este tratata exact ca o verificare
care esueaza.** Asta e lectia din „nimeni nu a observat ani de zile": tacerea arata identic cu
succesul.

## 2. Cele cinci principii

1. **Declara, apoi verifica.** Nimic nu e crezut pentru ca a spus cineva. Fiecare cont, domeniu,
   inregistrare DNS, marcaj, cont de publicitate si furnizor este scris intr-un registru
   citibil de masina, iar o sarcina programata compara registrul cu realitatea observata.
   Diferenta este constatare, **in ambele directii**: ceva nedeclarat gasit in realitate, sau
   ceva declarat care lipseste.
2. **Tacerea este esec.** Vezi mai sus.
3. **Firma este intotdeauna proprietarul.** Furnizorii primesc acces delegat, limitat in timp,
   fara drept de proprietate. Regula asta e aplicata de o verificare automata, nu de o clauza
   intr-un contract.
4. **Adevarul e ce incarca browserul.** Ce incarca efectiv pagina de productie intr-un browser
   real este autoritatea asupra tertilor, a urmaririi si a conturilor de publicitate. Nu ce
   sustine configurarea sau codul.
5. **Fiecare constatare are proprietar, termen si reverificare.** Inchiderea se dovedeste printr-o
   verificare care trece, nu prin cineva care spune ca a reparat.

## 3. Severitati si termene

| Nivel | Ce inseamna | Confirmare | Reparare | Escaladare |
|---|---|---|---|---|
| **S1** | Pierdere de control sau de proprietate, flux de bani nedeclarat, date care pleaca fara consimtamant, secret expus, site compromis | 1 ora | 24 ore | proprietarul e sunat; poarta de lansare se inchide imediat |
| **S2** | Risc material legal, de confidentialitate, de venit sau de disponibilitate | 8 ore | 7 zile | in raportul zilnic; poarta se inchide dupa 7 zile |
| **S3** | Regresie de calitate, performanta, cautare sau accesibilitate | 2 zile lucratoare | 30 zile | raport saptamanal |
| **S4** | Igiena, documentatie, impact mic | - | 90 zile | raport lunar |

## 4. Cele zece domenii

1. **Proprietate si acces** - coloana vertebrala. Registrul din `audit/registru-proprietate.yaml`
   este sursa de adevar; totul se raporteaza la el. Domenii, DNS, gazduire, depozite, conturi
   Google, conturi in aplicatie, retele sociale, furnizori.
2. **Terti si lant de aprovizionare** - ce se incarca efectiv in browser pe paginile de
   productie, cu diferenta fata de ieri; scanarea dependentelor proiectului.
3. **Performanta** - bugete impuse la integrare, plus masurare in teren.
4. **Cautare si date structurate** - validarea marcajelor, sitemap-urilor, canonicelor,
   legaturilor rupte si a paginilor orfane.
5. **Accesibilitate** - automat la fiecare livrare, manual trimestrial.
6. **Confidentialitate si consimtamant** - ca nimic nu se executa inainte de acord, ca semnalele
   sunt corecte, ca fluxurile reale corespund politicii publicate.
7. **Securitate** - secrete, dependente, antete, acces administrativ, doi factori, si **testarea
   restaurarii din backup**, nu doar a rularii lui.
8. **Editorial si legal** - etichetarea AI, atribuirea surselor, registrul de corecturi,
   paginile de autor, identificarea publicitatii.
9. **Venit** - reconcilierea intre ce raporteaza retelele si ce intra in contul firmei, si
   verificarea ca fiecare cont de publicitate activ apartine editorului.
10. **Sistemul insusi** - semnale de viata, meta-audit, raport saptamanal cu confirmare.

## 5. Cadenta

| Cand | Ce ruleaza | Blocheaza? |
|---|---|---|
| Inainte de livrarea codului | scanare de secrete | da, local |
| La fiecare propunere de modificare | proprietate, dependente, analiza statica, performanta, accesibilitate, cautare, terti, confidentialitate | **da** |
| La publicare | setul complet plus poarta de registru si prospetimea verificarilor | **da** |
| Imediat dupa publicare | terti, consimtamant, antete, venit, `robots.txt` | revenire automata la S1 |
| La fiecare minut | disponibilitate si timp de raspuns | - |
| Orar | terti, consimtamant, venit, DNS live, semnale de viata, meta-audit | alerta |
| Noaptea | proprietate, conturi, securitate, cautare, accesibilitate, editorial, venit, performanta | alerta |
| Saptamanal | istoric complet de secrete, scanare de vulnerabilitati, **exercitiu de restaurare**, comparatie cu concurenta, raport | raport |
| Lunar | licente si furnizori, confidentialitate, **reconciliere in trei directii a veniturilor** | raport |
| Trimestrial | atestarea accesului, acces de urgenta, WCAG manual, restaurare manuala, audit de securitate aprofundat | pachet semnat |
| Anual | test de penetrare extern, reconstruirea registrului de la zero, revizuirea contractelor | revizuire |

Reconstruirea anuala a registrului de la zero inseamna: daca am incepe azi, ce ar fi pe lista?
Si apoi compararea cu lista existenta. Elementele care supravietuiesc din inertie se vad doar asa.

## 6. Ordinea de constructie

Sistemul trebuie sa functioneze **inainte** de lansare, nu dupa. Pasii de mai jos sunt legati de
fazele din docs/09-plan-livrare.md, care este calendarul de referinta.

1. **Faza 1 - registrul si poarta.** Fara registru, nimic altceva nu are sens.
2. **Faza 2 - ochii.** Un singur instrument de automatizare a browserului care deschide
   paginile de productie si verifica: ce terti se incarca, ce se executa inainte de consimtamant,
   ce identificatori de publicitate apar, ce etichete editoriale exista. Se construieste o
   singura data, bine.
3. **Faza 4 - bani si derivare de proprietate**, odata cu primele conturi de publicitate. `ads.txt` generat din registru, conturi,
   DNS, verificari incrucisate.
4. **Fazele 1-2 - portile de calitate**, de la primul articol portat. Performanta, accesibilitate, antete.
5. **Faza 2 - sistemul**, impreuna cu ochii. Semnale de viata, meta-audit, raportul saptamanal, poarta de lansare.
6. **Faza 5 - rezilienta si restul**, inainte de lansare. Exercitii de restaurare, scanari aprofundate, cautare, venit.

Elementul cu cel mai mare efect este pasul 2 impreuna cu testarea saptamanala a faptului ca acel
instrument nu a orbit. Combinatia asta transforma „un cont de publicitate nedeclarat a rulat doi
ani si jumatate" in „un cont de publicitate nedeclarat a rulat patruzeci si trei de minute".

## 7. Ce se refoloseste din ce exista deja

Pluginurile de mai jos sunt instalate in mediul in care a fost pregatit pachetul. **In Claude Code-ul
tau local trebuie instalate separat**, din directorul de pluginuri: „Security Audit Loop by ATeam",
„finecomb", „AEOTester". Sunt optionale: sistemul functioneaza si fara ele, cu verificarile din
sectiunile de mai sus.

- Pluginul de audit de securitate acopera domeniul 7 cu fluxul lui propriu:
  auditeaza, repara, verifica, si tine un registru de constatari cu poarta de aprobare.
  **Registrul lui si registrul de aici se aliniaza pe aceleasi denumiri de campuri**, ca sa existe
  un singur registru, nu doua.
- Pluginul de revizuire exhaustiva a codului acopera revizuirea aprofundata trimestriala.
- Pluginul de audit pentru vizibilitate in cautarea generata de AI acopera o parte din domeniul 4.
- Abilitatile de SEO instalate acopera revizuirea umana lunara.

## 8. Decizia care blocheaza prima saptamana

Primul camp din registru este entitatea juridica editoare. **Trebuie stabilit care firma este
editorul publicatiei PULS** inainte de a deschide orice cont pe numele careva. Toate conturile,
domeniul, gazduirea si contul de publicitate se deschid pe acea entitate, de la bun inceput.

Asta este exact pasul care nu s-a facut la site-ul anterior, si din care decurg toate celelalte.
