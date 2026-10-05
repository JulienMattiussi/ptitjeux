# Curation Sémantogramme

1580 thèmes (395 jours × 4 niveaux, du 2026-09-01 au 2027-09-30).

- `schedule.json` : calendrier, un thème par jour et par niveau, avec sa catégorie.
- `domains.json` : domaines de sens (tous niveaux confondus), qui servent à écarter des mots trop proches du thème et à l'aide.
- `words/<AAAA-MM>.json` : mots du thème, clé `niveau|thème` ; 10 / 15 / 18 / 19 mots selon le niveau.
- `allowed.json` : décisions prises à la main, que les contrôles respectent.
  - `words` : mots en minuscules absents du dictionnaire mais admis (wifi, selfie, doudou…). Tout autre mot en minuscules hors dictionnaire est refusé.
  - `pairs` : couples `thème|mot` signalés à tort comme trahissant le thème (thé|menthe, vis|tournevis).
  - `banned` : couples `thème|mot` refusés (dérivés directs : chien|chiot, musique|musicien).

Les règles automatiques vivent dans `generators/semantogramme-curation.ts` (source unique) et le test `tests/unit/semantogramme.curation.test.ts` vérifie tout le corpus à chaque `make test`. Elles ne couvrent pas le jugement (nom propre obscur, lien trop indirect), qui reste une relecture humaine.

Ces fichiers ont servi à produire les grilles publiées, qui sont figées : ne jamais régénérer l'année. Un mot se corrige localement, dans la curation et dans le JSON du niveau (voir « Corriger un mot » dans `docs/semantogramme-curation.md`).
