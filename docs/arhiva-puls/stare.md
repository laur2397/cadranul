# Starea proiectului PULS

Se actualizeaza **la finalul fiecarei sesiuni de lucru** in Claude Code. Fiecare sesiune noua il
citeste primul, dupa CLAUDE.md. Fazele dureaza saptamani; acest fisier e memoria dintre sesiuni.

## Faza curenta

Faza 0 - decizii ale proprietarului. Niciun cod scris.

## Decizii luate

| Data | Decizia | Unde e consemnata |
|---|---|---|
| 2026-11-24 | Editia este regiunea (8), judetul este eticheta | docs/02, sectiunea 5.1 |
| 2026-11-24 | Stiva: Next.js + Payload + PostgreSQL pe Hetzner, in spatele Cloudflare | docs/01 |
| 2026-11-24 | Fara publicare automata; un om apasa „publica" | docs/06, docs/04 sectiunea 7 |
| 2026-11-24 | Consent Mode in modul Basic | CLAUDE.md 3.4 |

## Decizii asteptate (Faza 0)

Vezi docs/09-plan-livrare.md, Faza 0. Prima: ce firma este editorul.

## Facut in ultima sesiune

- 2026-11-24: pachetul urcat in depozitul privat `laur2397/puls`. Constatarea OWN-001 deschisa (depozit pe cont personal).
- 2026-11-24 (sesiune programata, prima sesiune din PORNIRE.md sectiunea 2): citite integral CLAUDE.md,
  docs/, registrele si structura prototipului. Agentul `avocatul-diavolului` a atacat intregul plan.
  Rezultatul in `docs/analiza-initiala.md`: rezumatul de o pagina, 10 probleme gasite la citire (A1-A10)
  si 26 de la agent (B1-B26, din care 6 critice), si lista ordonata a 11 decizii din Faza 0
  (cele 8 din docs/09 plus 3 propuse: finantarea, destinatarul raportului de audit si revizorul
  independent, platforma de consimtamant). Nu s-a scris cod, nu s-a deschis niciun cont, nu s-a
  reparat nimic in documente.
- 2026-11-24, a doua rulare a aceleiasi sarcini programate: a gasit analiza deja publicata, a pastrat-o
  si a adaugat doar partea 4 (D1-D7, constatari care lipseau, plus o decizie propusa: advertorialul de
  la institutii publice).

- 2026-11-24, sesiune de constructie (la cererea lui Marius: „construieste site-ul, deciziile dupa"):
  site functional pe Next.js 16 + Payload 3 + PostgreSQL, cu continutul demonstrativ importat
  (119 articole, 8 regiuni, 42 de judete). Paginile prototipului randate pe server, rute reale,
  panou redactional `/admin`, provenienta imuabila in baza de date, harti, RSS, robots, ads.txt,
  teste (8 unitare, 38 in browser, inclusiv accesibilitate si zero terti inainte de consimtamant),
  integrare continua in GitHub. Detalii si ce lipseste: `docs/site.md`. Nimic public, niciun cont deschis.
  Reparat pe drum: registrul de proprietate nu era YAML valid (2 linii); contrastul textelor mici din reclame.

## Urmatorul pas

1. Marius raspunde la deciziile din `docs/analiza-initiala.md`, partea 3, in ordine. Prima: ce firma
   este editorul (0.1).
2. Marius spune care propuneri din partea 2 se aplica; o sesiune separata le scrie in documente
   (docs/09 Faza 0 primeste deciziile noi aprobate).
3. Abia apoi: gazduirea si lansarea (Faza 1). Site-ul e gata de pus pe server cand exista firma, domeniul si conturile.

## Blocaje

-
