# Cum pornesti PULS in Claude Code

## 1. Pregatirea, o singura data

1. Dezarhiveaza pachetul intr-un dosar nou, de exemplu `puls`.
2. Deschide un terminal in acel dosar si ruleaza:
   ```
   git init
   git add .
   git commit -m "Pachetul de pornire PULS"
   ```
3. Creeaza depozitul pe GitHub **pe organizatia firmei editoare, nu pe contul tau personal**, si
   leaga-l. Asta e prima intrare reala in registrul de proprietate.
4. Porneste Claude Code in acel dosar: `claude`.

Claude Code citeste automat `CLAUDE.md` si vede echipa de agenti din `.claude/agents/`.

## 2. Primul mesaj, copiat exact

```
Citeste CLAUDE.md, apoi docs/stare.md, apoi toate fisierele din docs/ in ordine, apoi audit/registru-proprietate.yaml
si audit/registru.md. Uita-te la structura din referinta/prototip/ fara sa o rulezi.

Nu scrie cod in aceasta sesiune.

Vreau trei lucruri:
1. Un rezumat de o pagina despre ce ai inteles ca trebuie construit si de ce, ca sa verific ca
   am aceeasi imagine.
2. Orice contradictie, lipsa sau ambiguitate pe care o gasesti intre documente. Cheama agentul
   avocatul-diavolului pe intregul plan si adauga ce gaseste el.
3. Lista deciziilor din Faza 0 (docs/09-plan-livrare.md) pe care trebuie sa le iau eu, cu ce
   depinde de fiecare.
```

Raspunde la deciziile din Faza 0 inainte de pasul urmator. Prima e cea mai importanta: **ce firma
este editorul**. Pana nu e stabilita, nu se deschide niciun cont.

## 3. Mesajele pentru fiecare faza

**Faza 1:**
```
Incepem Faza 1 din docs/09-plan-livrare.md. Inainte de cod, cheama arhitect-platforma sa
confirme planul tehnic al fazei si avocatul-diavolului sa il atace. Arata-mi ce gasesc.
Dupa ce aprob, lucreaza punct cu punct. La final ruleaza abilitatea audit-puls si cheama
auditor-sef. Nu trece la faza urmatoare fara sa ma intrebi.
```

**Fazele 2-5:** acelasi mesaj, cu numarul fazei schimbat.

## 4. Regulile de lucru cu Claude Code

- **O sarcina clara pe sesiune.** O faza dureaza saptamani si se intinde pe multe sesiuni. Nu cere tot proiectul deodata.
- **La finalul fiecarei sesiuni, cere actualizarea `docs/stare.md`.** Asa stie sesiunea urmatoare unde a ramas lucrul.
- **Cere planul inainte de cod**, la fiecare faza.
- **Nu accepta „am terminat" fara audit.** Fiecare faza se incheie cu `audit-puls` si `auditor-sef`.
- **Daca vrei sa schimbi o regula din CLAUDE.md, schimb-o in fisier**, nu doar in conversatie.
  Ce nu e in fisier se uita la sesiunea urmatoare.
- **Orice cont nou intra intai in registru.** Inainte sa existe in realitate.
- Daca Claude Code propune ceva ce contrazice o regula marcata NENEGOCIABIL, e gresit el, nu regula.

## 5. Ce sa nu ceri

- Publicare automata fara om. Pierde exceptia legala pentru textul verificat de om si e exact tiparul pe care Google il penalizeaza (cazul raportat in noiembrie 2026 e de reverificat).
- Rescrierea articolelor altor publicatii. Legea restrange preluarea extraselor peste 120 de caractere (faptele in sine nu sunt protejate), dar regula PULS e mai stricta: nu se lucreaza din articolele altora, ci din surse primare.
- Ferestre, interstitiale, video cu sunet automat, flux infinit, titluri-momeala.
- Lansarea tuturor celor 8 regiuni fara oameni in spatele lor.
