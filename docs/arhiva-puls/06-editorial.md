# Redactia PULS: flux, standarde, politica AI, diferentiere

Cercetat la 24 noiembrie 2026.

---

## 1. Trei fapte care schimba planul

**1. Obligatia de etichetare AI e deja in vigoare** din 2 august 2026. Exceptia pentru text exista doar
cu verificare umana substantiala, documentata. Un flux cu semnatura umana bine proiectat transforma
obligatia in exceptie. Detalii in docs/04-conformitate.md.

**2. Google a scos din Discover noua site-uri de stiri generate de AI pe 3-4 noiembrie 2026**, inclusiv
subdomenii subcontractate ale unor editori consacrati precum Ouest-France si 20 Minutes. Motivele
invocate: probleme majore de spam, folosire la scara mare a continutului, repetitie. **Sa fii editor
legitim nu te protejeaza** daca produsul e parafrazat, facut cu efort mic sau publicat automat.

**3. Doua decizii din planul initial trebuie schimbate:** publicarea automata dispare, iar
administrarea fara server se inlocuieste cu un server real. Vezi docs/04-conformitate.md, sectiunea 7.

## 2. Fluxul de lucru, cu portile umane

Echipa realista la inceput: 2-4 oameni. **Capacitatea de verificare este gatul sticlei, nu calitatea AI.**

Plafon zilnic la pornire: **12-18 materiale publicate pe zi, dintre care cel putin 4 produse integral de
PULS**, nu derivate din munca altei publicatii. Daca nu se poate verifica ca lumea, nu se publica.

| Etapa | Masina face | Omul trebuie sa | Poarta |
|---|---|---|---|
| 1. Monitorizare | Citeste sursele, elimina dublurile, detecteaza schimbari in documente, OCR, traduce, clasifica pe regiune si domeniu, alerteaza | Defineasca lista de surse si pragurile | - |
| 2. Triaj | Grupeaza, scrie un rezumat „ce e, de ce conteaza, ce lipseste", propune responsabil si regiune | **Editorul alege** ce se acopera | **Poarta 1** |
| 3. Verificare | Aduce documentul primar, verifica cifre, gaseste acoperirea anterioara, listeaza sursele care ar confirma | Obtina si confirme sursa primara; regula celor doua surse | **Poarta 2: reporterul atesta sursele** |
| 4. Redactare | Ciorna structurata **doar din materialul primar verificat**, niciodata din articolul altei publicatii | Rescrie in vocea PULS, adauga context si reportaj; sterge tot ce nu are sursa | - |
| 5. Editare | Verificari automate: fiecare cifra cu sursa, fiecare nume si functie, citatele cu inregistrarea, semnale legale, titlu fata de text, metadate | Editare rand cu rand; decizie pe semnalele legale | **Poarta 3: editorul numit aproba** |
| 6. Fact-check | Lista de afirmatii cu sursa fiecareia | La investigatii si politica, **a doua persoana** semneaza lista | **Poarta 4** |
| 7. Publicare | Construieste adresa, marcajul, sitemap-ul, cardurile sociale | **Un om apasa „publica"** | **Poarta 5** |
| 8. Dupa publicare | Urmareste dezmintiri, corecturi la altii, anomalii de trafic, actiuni manuale Google | Decide corectura, actualizarea sau retragerea | **Poarta 6** |

**Jurnalele sunt un activ.** Pentru fiecare material: ce surse l-au alimentat, ce unelte AI l-au atins,
cine a semnat, cand. Sunt dovada pentru exceptia AI Act, pista pentru corecturi si materialul pentru
autoevaluarea de incredere. **Dupa ultima verificare umana, nicio modificare automata substantiala.**

## 3. Sursele pentru Romania

**Verificat citibile de masina:** serviciile web ANAF (date fiscale dupa CUI), cursurile BNR in XML,
data.gov.ro cu licenta deschisa, achizitiile publice prin standardul Open Contracting (OpenTender),
API-ul comercial termene.ro pentru firme.

**Fara API public, cer extragere atenta:** SEAP/SICAP, portal.just.ro pentru dosare, Monitorul Oficial
(abonamentul e-Monitor e calea sigura), avertizarile ANM (alternative: fluxurile Meteoalarm si
Open-Meteo), INFP pentru seisme (alternativa: EMSC), ISU-urile judetene (mai ales comunicate si Facebook),
INS TEMPO, ANI, site-urile Parlamentului, transparenta decizionala, calitatea aerului, avertizarile de
inundatii.

**Evaluare realista:** suprafata de date deschise a Romaniei e subtire si inconsecventa. **Tocmai asta e
oportunitatea.** O echipa mica ce construieste si intretine extragatoare de incredere pentru Monitorul
Oficial, SICAP, ONRC/ANAF, dosare si ordinile de zi ale consiliilor judetene detine un activ pe care nu il
are nimeni, transformabil direct in stiri pe care nu le gaseste nimeni altcineva.

**Unelte:** n8n gazduit propriu pentru orchestrare; modelul local prin Ollama pentru clasificare,
extragere, traducere, rezumat si schelet de ciorna, pentru ca materialele surselor nu pleaca din
controlul redactiei; un model comercial doar pentru rationamentele cele mai grele, **niciodata cu
material care poate identifica o sursa**.

## 4. Politica de folosire a AI (de publicat la `/pagina/ai`, ruta existenta in prototip)

> Legata din subsolul fiecarei pagini, din paginile de autor si din caseta redactionala. Versionata si datata.

**Cum foloseste PULS inteligenta artificiala**
*Versiunea 1.0 - [data]. Responsabil: redactorul-sef. Urmatoarea revizuire: [data + 6 luni].*

**1. Principiul.** La PULS, AI nu publica. O persoana cu nume decide ce publicam si raspunde pentru asta.
Folosim AI ca sa gasim, sa citim, sa organizam si sa verificam mai mult material decat ar putea o echipa
mica. Nu ca sa fabricam articole.

**2. Cine raspunde.** Raspunderea editoriala pentru tot ce apare pe site apartine redactorului-sef,
[nume], la [e-mail], indiferent daca s-au folosit sau nu unelte AI.

**3. La ce folosim AI.** Urmarirea surselor oficiale si a registrelor publice; transcrierea interviurilor;
traducerea materialelor-sursa; cautarea in arhiva si in documente mari; extragerea cifrelor din documente
si seturi de date; rezumate interne si schelete de ciorna pentru reporteri; sugestii tehnice (etichete,
adrese, campuri de cautare); semnalarea posibilelor erori si riscuri legale inainte de publicare.

**4. La ce nu folosim AI niciodata.**
- Nu publicam text care nu a fost citit, verificat si aprobat rand cu rand de un editor cu nume.
- Nu publicam fotografii, video sau inregistrari audio generate de AI ca imagine a unui eveniment, a unei
  persoane sau a unui loc real. Nu adaugam, nu stergem si nu modificam nimic intr-o fotografie, un video
  sau o inregistrare de stiri. Regula se aplica si materialelor de la colaboratori si agentii.
- Nu folosim AI pentru stiri de ultima ora, relatari in direct sau orice afirmatie despre ce a spus sau a
  facut o persoana anume.
- Nu introducem niciodata in vreo unealta AI **externa** material nepublicat sau informatii confidentiale.
  Materialul de la surse confidentiale si orice ar putea identifica o sursa confidentiala nu intra in
  nicio unealta AI, nici macar in cele pe care le rulam noi. Restul materialului-sursa (documente
  publice, inregistrari ale unor declaratii publice) poate fi prelucrat cu uneltele care ruleaza pe
  echipamentele noastre.
- Nu cream si nu folosim autori inventati, portrete generate sau competente false. Fiecare semnatura de pe
  PULS este a unei persoane reale, a carei biografie e publicata pe site.
- Nu traducem un articol intr-o editie regionala ca sa il prezentam drept reportaj original separat.

**5. Unde ruleaza AI.** Pe materialele-sursa preferam modele care ruleaza pe echipamentele noastre, ca
documentele, inregistrarile si identitatea surselor sa nu iasa din controlul nostru. Cand folosim un
furnizor extern pentru o sarcina anume, consemnam furnizorul si scopul intr-un registru intern, pe care
il publicam rezumat in raportul anual de transparenta.

**6. Ce va spunem.**
- Orice articol la care AI a avut **un rol substantial in producerea textului publicat** poarta o mentiune
  vizibila direct sub titlu: *„Acest articol a fost pregatit cu ajutorul unor unelte AI si a fost
  verificat si aprobat inainte de publicare de [nume editor]."* Niciodata in subsol, niciodata cu litere mici.
- Orice imagine, video, audio sau grafic generat sau modificat substantial de AI poarta eticheta vizibila
  in legenda, si eticheta il insoteste si pe retelele sociale.
- **Nu** etichetam folosirea AI pentru corectura, transcriere, traducerea surselor, cautarea in arhiva sau
  metadate interne, pentru ca acestea nu schimba ce afirmam.
- Daca o functie a site-ului personalizeaza sau recomanda continut cu AI, spunem asta pe acea functie.
- Publicam anual un rezumat al uneltelor AI folosite si pentru ce.

**7. Rezultatul AI e un pont, niciodata o sursa.** Ce produce o unealta AI este tratat ca afirmatie
neverificata dintr-o sursa necunoscuta. Nu se citeaza, nu se foloseste drept confirmare. O afirmatie se
publica doar dupa ce a fost dusa pana la o sursa numita si verificabila.

**8. Ce primim.** Aplicam aceeasi rigoare materialelor primite. Fotografiile, video-urile si documentele
trimise noua sunt verificate pentru semne de generare sau manipulare. Unde nu putem rezolva o indoiala
despre autenticitate, nu publicam; daca materialul e stire in sine, relatam indoiala, nu afirmatia.

**9. Limite de volum.** Plafonam numarul de materiale asistate de AI care intra zilnic la editare, la un
nivel pe care un editor il poate verifica real. Daca nu putem verifica ca lumea, nu publicam. Preferam sa
publicam mai putin.

**10. Erori.** Daca AI a contribuit la o eroare, o spunem in corectura. Nu ne ascundem in spatele uneltei.

**11. Raspundere si revizuire.** Politica se revizuieste la sase luni si dupa orice incident. Plangerile
privind folosirea AI la PULS: [e-mail]; raspundem in cinci zile lucratoare. Cititorii ne pot semnala o
eticheta lipsa sau gresita, iar noi o corectam.

## 5. Standardele editoriale, in esenta

Documentul complet se scrie cu agentul `editor-standarde`. Clauzele obligatorii: atribuirea surselor si
regula celor doua surse independente pentru acuzatii; dreptul persoanei acuzate de a raspunde **inainte**
de publicare; sursele anonime doar cu motiv, si cunoscute de cel putin un editor; conflictele de interese
declarate; echilibru in acoperirea politica, cu jurnal lunar de echilibru; relatarea despre minori;
prezumtia de nevinovatie in relatarea judiciara; regulile medicale privind relatarea sinuciderii, fara
exceptie; protocol electoral publicat **inainte** de campanie; corecturi si drept la replica; separarea
publicitatii de redactie; transparenta proprietatii.

## 6. Semnalele de incredere din prima zi

Pagini de autor cu nume real, fotografie, biografie, competente, contact; semnatura legata pe fiecare
articol; date de publicare si actualizare vizibile; caseta redactionala cu functii; standardele, politica
AI, metodologia de fact-check, politica de corecturi cu registru public; proprietate si finantare;
contact si sesizari; statut editorial. **Autoevaluarea gratuita Journalism Trust Initiative in primele 90
de zile.** Aderarea la Trust Project, apoi.

## 7. Unde se poate diferentia PULS - cu dovezi

**1. Golul regional e real si masurat.** Un studiu CMPF a gasit **opt judete fara nicio publicatie locala,
tiparita sau online: Bistrita-Nasaud, Buzau, Caras-Severin, Dambovita, Giurgiu, Gorj, Harghita si
Hunedoara.** Titlurile locale tiparite auditate de BRAT au scazut de la 54 in 2008 la 2 in 2023. Atentie:
Adevarul are deja o retea locala in 39 de judete. **Golul nu e acoperirea subtire. Golul e acoperirea
reala.** Gorj e in regiunea Oltenia.

**2. Nimeni nu are mainile curate pe banii publici si nimeni nu e transparent.** Presa locala traieste din
publicitatea autoritatilor locale, care o pot recompensa sau pedepsi politic. Foarte putine publicatii
au coduri etice. **Un refuz verificabil public al banilor publici nedeclarati, plus un registru public al
contractelor, este o pozitie pe care nu o ocupa nimeni.** Si costa putin. Este cel mai puternic
diferentiator disponibil.

**3. Asistentii AI devin un canal de descoperire, iar presa romaneasca lipseste din el.** Un studiu pe
circa 360.000 de raspunsuri AI arata ca nicio publicatie romaneasca nu domina, iar intrebarile in limba
romana scot la suprafata publicatii romanesti. **Un site bine structurat, cu atribuiri, autori cu
competente reale si metodologie explicita are sanse neobisnuit de mari sa fie citat.** Aceleasi lucruri
castiga si increderea Google. Construiesti o data, castigi de trei ori.

**4. Integritatea titlurilor si a formatului.** Raportul afisari pe utilizator al unor concurenti arata
modele bazate pe galerii si paginare. Un site care pur si simplu nu foloseste galerii paginate, titluri-
momeala sau fragmentare „citeste mai mult" se diferentiaza din prima impresie.

**5. Continuitatea.** Nimeni nu urmareste dosarele de la acuzare la verdict, nu publica jurnale de echilibru,
nu publica un index al corecturilor sau un raport de transparenta. Fiecare inseamna cateva ore pe luna si
fiecare poate fi verificat de cititor.

### Ce face PULS si nu face nimeni bine
1. **Redactia bazata pe registre.** Monitorizare automata si de incredere a Monitorului Oficial, SICAP,
   ONRC/ANAF, dosarelor si deciziilor consiliilor locale si judetene, declaratiilor de avere. Singurul lucru
   pe care AI il face cu adevarat posibil pentru o echipa mica si pe care nu il are nimeni. Original prin
   constructie, deci imun la penalizarile pentru parafraza. AI-ul citeste documente, nu scrie articole.
2. **Registrul public al banilor publici si refuzul banilor publici nedeclarati.**
3. **Rubrica regionala „unde se duc banii europeni"**, pe structura regiunilor de dezvoltare.
4. **Intreaga stiva de incredere din prima zi.** Publicatia demonstrabil cea mai transparenta din Romania,
   afirmatie sustinuta de documente.
5. **Protocol electoral si jurnal lunar de echilibru**, inainte de urmatorul ciclu electoral.
6. **Citarea de catre AI ca prim canal.**
7. **Membri, nu agregare.** Membrii platesc pentru munca originala.
8. **Fara duplicare intre editii.** O poveste nationala are o singura adresa; editiile regionale au doar
   material local original.

## 8. Riscuri oneste

- **Capacitatea de verificare**, nu calitatea AI, decide daca PULS e credibila. Doi oameni nu pot semna
  responsabil 60 de materiale pe zi. Plafonul si publicarea mai putina.
- **CNA se aplica si video-ului tau.** Decizia 573/2025 acopera continutul video la cerere si pe platforme
  de partajare sub jurisdictie romana. Se citeste inainte de lansarea video.
- **Riscul de procese abuzive impotriva presei e real** si nu exista lege anti-SLAPP in Romania. Se
  bugeteaza verificare juridica pentru investigatii.
- **Salariile mici si lipsa bazei de recrutare.** Salariile jurnalistilor sunt intre ~525 si 1.130 euro pe
  luna. Mai bine putini oameni bine platiti decat o retea de colaboratori ieftini; standardele de mai sus
  nu se pot aplica intr-o retea ieftina.
- **„AI slop" e o categorie pe care Google o pedepseste pe nume.** Apararea PULS e documentara: jurnale de
  semnatura umana, casete de metodologie, surse primare, autori reali.
