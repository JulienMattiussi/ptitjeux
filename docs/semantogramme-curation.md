# Sémantogramme : curation et génération des niveaux

Les 4 niveaux quotidiens sont tous issus d'une curation écrite à la main,
dans `generators/semantogramme-curation/` (voir son README) : un thème par
jour et par niveau, du 2026-09-01 au 2027-09-30 (1580 thèmes, tous
différents).

| Niveau | Grille | Cases thème | Mots curés par thème |
|--------|--------|-------------|----------------------|
| L1     | 4 × 4  | 7 .. 10     | 10                   |
| L2     | 5 × 5  | 11 .. 15    | 15                   |
| L3     | 6 × 6  | 14 .. 18    | 18                   |
| L4     | 7 × 7  | 15 .. 19    | 19                   |

## Données

- `schedule.json` : le calendrier (date, thème, catégorie). Deux thèmes d'une
  même catégorie ne se suivent jamais (vérifié). L'écart d'au moins 7 jours
  entre deux thèmes d'un même domaine de sens (`domains.json`) était visé à la
  rédaction, mais n'est ni vérifié ni respecté partout.
- `words/<AAAA-MM>.json` : les mots de chaque thème.
- `allowed.json` : les décisions prises à la main (mots admis hors
  dictionnaire, couples gardés ou refusés).

Les règles automatiques des listes (taille, dictionnaire, famille, mot qui
trahit le thème, répétition à moins de 3 jours…) sont dans
`generators/semantogramme-curation.ts` et vérifiées sur tout le corpus par
`tests/unit/semantogramme.curation.test.ts`. Le jugement (lien évident,
nom propre connu) reste une relecture humaine.

## Génération

`generators/semantogramme.ts` planifie toute l'année d'un coup, jour après
jour (`planYear`) : les mots hors thème d'un jour dépendent des jours
précédents. Pour chaque niveau :

1. on tire le nombre de cases thème dans la plage du niveau, puis autant de
   mots curés du thème ;
2. on complète avec des mots hors thème piochés parmi les mots des autres
   thèmes, en excluant :
   - les mots et thèmes des deux jours précédents et des deux suivants, et
     les mots hors thème déjà posés ces jours-là (règles 2 et 3) ;
   - les mots des thèmes du même domaine de sens, ou des thèmes liés (dont
     la liste contient le thème courant, ou l'inverse) : un mot hors thème
     ne doit pas pouvoir passer pour un mot du thème ;
   - les mots de la même famille qu'un mot déjà placé, ou qui trahissent le
     thème (règle 4) ;
3. on mélange jusqu'à ce que chaque ligne et chaque colonne ait au moins une
   case thème et une case hors thème.

Le tirage est déterministe (graine `semantogramme:<date>:<niveau>`).
`parMoves` vaut exactement le nombre de cases thème. Le champ `domains` du
niveau est ce que révèle l'aide en jeu : les domaines de sens du thème
(`domains.json`) qui ne le trahissent pas (fleur / fleurs, musique / musique
populaire), à défaut sa catégorie (`helpDomains`). Un domaine s'affiche tel
quel en jeu : son nom doit rester un indice lisible.

## Corriger un mot

Les grilles publiées ont été relues et jouées : **on ne régénère plus
l'année**. Une génération rejouée changerait les mots hors thème de tous les
jours suivants.

Une correction est locale :

1. remplacer le mot dans `words/<mois>.json` ;
2. remplacer le même mot, à la même case, dans le JSON du niveau
   (`app/games/semantogramme/challenges/<AAAA-MM>/<date>-<niveau>.json`). Un
   mot du thème est remplacé par un mot du thème, un mot hors thème par un mot
   hors thème : `solution`, `rowClues`, `colClues` et `parMoves` ne bougent
   pas ;
3. `make test` : le test d'intégrité revérifie les règles 2, 3 et 4 sur le
   niveau et ses jours voisins, le test de curation revérifie la liste ;
4. `make verify-levels`.
