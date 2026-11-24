# Registrul de constatari Cadranul

Fiecare constatare are: identificator stabil, data, domeniul, ce ar trebui sa fie, ce este in
realitate, dovada concreta, severitatea, proprietarul, termenul si starea.

O constatare se inchide **numai** cand o verificare noua trece, cu dovada noua. Nu pe baza unei
afirmatii. Campurile se aliniaza cu registrul pluginului de audit de securitate, ca sa existe un
singur registru.

Severitati si termene: docs/08-audit.md, sectiunea 3.

---

## Deschise

| ID | Data | Domeniu | Ce ar trebui | Ce este | Dovada | Sev. | Proprietar | Termen | Stare |
|---|---|---|---|---|---|---|---|---|---|
| OWN-000 | 2026-11-24 | Proprietate | Entitatea editoare stabilita si inscrisa in registru | Nestabilita | `audit/registru-proprietate.yaml`, campul `editor_legal` | S1 | Proprietarul | Inainte de orice cont | deschisa |
| OWN-001 | 2026-11-24 | Proprietate | Depozitul de cod pe organizatia GitHub a firmei editoare | Depozit doar local (nu a fost urcat nicaieri) | `git remote -v` gol | S2 | Proprietarul | La stabilirea firmei: depozit privat pe organizatia firmei | deschisa |

## Inchise

| ID | Data inchiderii | Verificarea care a trecut | Dovada |
|---|---|---|---|

## Jurnalul ciclurilor de audit

| Data | Ce a rulat | Rezultat | Cine a confirmat |
|---|---|---|---|
