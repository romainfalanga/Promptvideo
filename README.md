# Promptvideo Studio

Atelier de création de **comptes vidéo pilotés par Seedance 2.5**.

On y construit un artiste, sa direction artistique, son casting, ses lieux et ses
formats récurrents ; on en sort, au bout de la chaîne, **un document à
copier-coller** contenant tout ce qu'il faut pour produire les vidéos, plus la
**liste ordonnée des références** à joindre.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build de production dans dist/
npm run smoke    # tests des moteurs (génération, interprétation, prompts, audit, export)
npm run sample   # imprime un prompt compilé complet dans le terminal
```

Aucun serveur, aucune clé d'API, aucune donnée qui sort du navigateur : tout est
stocké en `localStorage` et exportable en JSON.

---

## Les trois points d'entrée

### Artistes — un socle fourni, appliqué tel quel

Quand un artiste fournit sa direction artistique complète, il n'y a rien à tirer au
sort : le compte s'ouvre déjà écrit, en un clic depuis l'accueil.

**Vland** est le premier préréglage : clip nocturne, texture VHS / mini-DV, jeune
rappeur contemporain. Il apporte 13 traits de texture cumulés, 22 environnements en
rotation, 17 micro-actions de figuration, une garde-robe, une politique de regard par
personnage, des transitions motivées, des règles de continuité, 3 personnages
récurrents, 6 lieux, 3 formats de 15 s et un épisode pilote exemplaire.

Ses références d'identité sont marquées **photo fournie** : elles ne doivent jamais
être régénérées, c'est ce qui fixe le visage d'une vidéo à l'autre.

## Les deux modes

### Mode Studio — l'outil propose des comptes complets

Le moteur assemble un compte entier à partir d'une bibliothèque de **neuf univers**
écrits pour tenir ensemble (une palette va avec une lumière, qui va avec une texture,
qui va avec une grammaire caméra). Chaque proposition contient un artiste, une
direction artistique, un casting, des lieux, un format récurrent et un épisode pilote.

La génération est **déterministe** : une même graine redonne exactement le même
compte, ce qui permet de rejouer, comparer et affiner une idée.

### Mode Sur-Mesure — l'utilisateur décrit, l'outil déploie

Le texte libre de l'utilisateur est **conservé mot pour mot** comme colonne
vertébrale du compte (notes, mission de l'artiste, pitch visuel, logline du pilote).
L'interpréteur :

- classe les univers par affinité de vocabulaire pour en tirer une direction artistique ;
- déduit plateforme, format et durée quand ils sont mentionnés ;
- détecte le ton ;
- repère les noms propres et **demande** s'ils sont un personnage, un lieu, ou rien —
  il ne devine pas, parce qu'un nom propre est aussi souvent l'un que l'autre.

---

## La chaîne de production

| Étape | Onglet | Ce qui s'y passe |
|---|---|---|
| 1 | Amorce | Mode Studio ou Mode Sur-Mesure |
| 2 | Artiste · Direction · Casting · Lieux · Formats | Élaboration des documents, fiche par fiche |
| 3 | Références | Manifeste dérivé automatiquement, avec le prompt de fabrication de chaque référence |
| 4 | Épisodes · Réglages | Écriture plan par plan, compilation du prompt en direct |
| 5 | Audit · Export | Contrôle qualité, puis le document final |

---

## Ce que l'outil sait de Seedance 2.5

Le compilateur et l'audit sont calés sur les contraintes réelles du modèle
(`src/data/seedance.ts`) :

- **Durée** 4 à 30 s ; ratios 9:16, 16:9, 1:1, 4:3, 3:4, 21:9, 9:21.
- **Références** : 30 images, 10 vidéos, 10 audio, 50 au total. Au-delà de
  **8 sujets principaux**, les traits distinctifs se diluent — l'audit le signale.
- **Numérotation par ordre d'envoi** : le premier fichier joint est `@Image1`.
  Un épisode qui n'utilise qu'une partie du manifeste **recalcule ses propres
  numéros**, et sa liste de fichiers est livrée avec son prompt.
- **Ordre du prompt** : sujet + action d'abord (les 20-30 premiers mots pèsent le
  plus), puis la scène, puis le style, puis la caméra et l'audio.
- **Chaque référence dit ce qu'elle apporte ET ce qu'il faut y ignorer**, sans quoi
  le modèle reprend le fond, la pose ou la lumière de l'image de référence.
- **Syntaxe audio** : `( musique )`, `< effet sonore >`, `{ dialogue }`, `【 texte incrusté 】`.
- **Multi-plans** : étapes timecodées `[0:00–0:05] PLAN LARGE — …`.

### Les blocs détaillés de direction artistique

Une rubrique par phrase ne suffit pas à tenir une identité visuelle. La direction
artistique porte donc des **réservoirs** dans lesquels l'écriture pioche, tous injectés
automatiquement dans les prompts :

| Bloc | Ce qu'il empêche |
|---|---|
| Traits de texture (cumulables) | Un seul mot-clé « VHS » ne produit pas un rendu analogique |
| Moments privilégiés / écartés | Le modèle place la scène en plein jour |
| Sources de lumière autorisées | Un éclairage de studio invisible dans le réel |
| Mouvements de caméra | Une caméra différente à chaque vidéo |
| Stratégies de composition | Le sujet toujours centré |
| Ce qui bouge | L'effet « photo animée » |
| Vie de fond + règles de figuration | Des figurants plantés qui fixent l'objectif |
| Garde-robe + règles | Le cliché vestimentaire |
| Registre émotionnel | Une image jolie mais sans intention |
| Transitions motivées | Des coupes arbitraires |
| Réservoir d'environnements | Deux fois le même décor |
| Règles de continuité | Le personnage qui change entre deux épisodes |

Chaque plan porte en plus sa **vie de fond**, son **élément en mouvement** et sa
**sortie motivée** ; chaque épisode porte ses **paroles**, son **idée visuelle** et sa
**continuité** avec le précédent.

### Cohérence entre les vidéos

Trois mécanismes, parce que c'est là que les comptes IA s'effondrent d'habitude :

1. **L'ancre d'identité** — un descripteur canonique compact par personnage
   (âge, morphologie, visage, cheveux, peau, yeux, signe distinctif, costume),
   réinjecté dans **chaque** prompt où il apparaît. L'audit refuse une ancre de
   moins de 12 mots.
2. **La politique de regard** — un champ par personnage. Sans consigne explicite, le
   modèle fait poser le sujet face objectif ; c'est le premier réflexe à désamorcer sur
   un compte qui veut avoir l'air pris sur le vif.
3. **Le manifeste de références** — pour chaque personnage une planche visage et une
   planche costume, pour chaque lieu une plaque de décor vide, plus une planche de
   style pour tout le compte. Un personnage marqué *collectif* reçoit une planche de
   groupe au lieu de trois fiches d'identité. Chaque slot est livré avec le prompt qui
   permet de fabriquer l'image — sauf les photos fournies par l'artiste, signalées
   comme telles pour ne jamais être régénérées.

---

## Les cinq exports

- **Le Compte** — le document complet : artiste, direction artistique, casting, lieux,
  accessoires, formats, réglages, manifeste, prompts et mode d'emploi.
- **Pack Seedance** — la version courte : liste ordonnée des fichiers, puis un prompt
  par épisode. Rien d'autre.
- **Manifeste de références** — les références seules, avec leur prompt de fabrication.
- **Brief à déléguer** — à coller dans un assistant conversationnel pour faire écrire
  de nouveaux épisodes dans la même direction artistique, en ciblant les manques
  relevés par l'audit.
- **JSON** — sauvegarde complète, réimportable depuis l'accueil.

---

## Audit qualité

Un score sur 100 réparti en huit sections, avec trois niveaux de gravité
(`bloquant`, `important`, `confort`). Chaque point relevé indique la cause **et** le
geste qui le corrige, et renvoie vers l'onglet concerné.

Il contrôle notamment : ancres d'identité trop courtes, personnages sans référence,
dépassement des limites du modèle, durée hors bornes, plans sans action décrite,
absence de consigne audio, budget de mots du prompt (qui grandit avec le nombre de
plans : la cible de 60-100 mots vaut pour une action continue).

---

## Architecture

```
src/
  data/
    seedance.ts        contraintes et grammaire du modèle
    library.ts         types et réservoirs transverses
    universes.*.ts     les univers (palettes, castings, lieux, formats)
    universes.vland.ts le socle de direction artistique de Vland
    presets.ts         les préréglages d'artiste, déjà écrits
  lib/
    migrate.ts         complète les projets enregistrés avant un ajout de champ
  engine/
    generate.ts        mode Studio — génération déterministe
    interpret.ts       mode Sur-Mesure — texte libre → projet
    references.ts      dérivation et numérotation du manifeste
    prompt.ts          compilateur de prompts Seedance
    audit.ts           contrôle qualité
    exporter.ts        les cinq exports
  views/               accueil, deux modes, atelier et ses dix onglets
  components/ui.tsx    bibliothèque de composants
  store.ts             état global + persistance localStorage
```

Stack : Vite, React 18, TypeScript strict, Tailwind. Aucune dépendance de runtime
au-delà de React.
