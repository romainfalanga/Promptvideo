/**
 * Socle de direction artistique — VLAND.
 *
 * Contrairement aux univers generiques, celui-ci n'est pas un reservoir a
 * combiner : c'est un socle ecrit, a appliquer tel quel a tous les episodes.
 * Le scenario change d'une video a l'autre, l'identite visuelle ne bouge pas.
 */

import type { Universe } from './library'

export const VLAND_UNIVERSE: Universe = {
  id: 'vland',
  name: 'Vland — clip nocturne',
  emoji: '🎬',
  pitch:
    "Des images volees a un vrai clip nocturne de jeune rappeur, tournees a la camera analogique imparfaite, ou chaque scene possede sa propre petite histoire.",
  keywords: [
    'rap', 'rappeur', 'clip', 'musique', 'vhs', 'nuit', 'urbain', 'street', 'streetwear',
    'rooftop', 'parking', 'voiture', 'ville', 'neon', 'lampadaire', 'mini-dv', 'camescope',
    'jeunesse', 'melancolie', 'nocturne', 'beat', 'paroles', 'clip musical', 'analogique',
  ],
  genres: [
    'clip musical nocturne',
    'documentaire de rue analogique',
    'chronique urbaine nocturne',
  ],

  /* --- Palette : sombre, desaturee, delavee par la texture ---------- */
  palettes: [
    {
      name: 'Nuit lampadaire',
      colors: ['#0a0b0e', '#1b2230', '#38475c', '#c98a4b', '#e9e6e0'],
      note: 'Bleu nuit dominant, orange des lampadaires comme seule chaleur, blanc des phares en accent. Legerement delave.',
    },
    {
      name: 'Argent et bitume',
      colors: ['#0c0c0d', '#26282b', '#5a5f66', '#9aa3ab', '#d8d6d2'],
      note: 'Camaieu de gris et d’argent, presque monochrome. Une seule touche de rouge ponctuel autorisee par plan.',
    },
    {
      name: 'Blue hour',
      colors: ['#0b1420', '#1d3550', '#3f6584', '#b06a3c', '#e6dcc8'],
      note: 'Ciel encore bleu-orange, silhouettes urbaines deja sombres. Le contraste ciel/ville fait l’image.',
    },
    {
      name: 'Brun sous-expose',
      colors: ['#0d0a08', '#2a1f17', '#5b4433', '#8f7a63', '#ded6c9'],
      note: 'Tons bruns et sous-exposition assumee, hautes lumieres legerement brulees.',
    },
  ],

  /* --- Lumiere : uniquement des sources pratiques -------------------- */
  lightings: [
    'uniquement des sources pratiques : lampadaires, phares, vitrines, enseignes ; aucun projecteur de tournage',
    'contre-jour de phares qui decoupe la silhouette, halos larges autour des sources',
    'lumiere orange de lampadaire au-dessus du sujet, chute rapide vers le noir autour',
    'lueur froide d’un parking souterrain, tubes au plafond, zones entieres sous-exposees',
    'reste de ciel bleu-orange derriere le sujet, ville deja dans l’ombre',
  ],
  lightSources: [
    'lampadaires',
    'phares de voitures',
    'vitrines',
    'enseignes lumineuses',
    'eclairages de parking',
    'fenetres d’appartements au loin',
    'neons subtils, jamais multicolores',
    'lumieres de bars et de restaurants',
  ],

  /* --- Texture : c’est elle qui signe le compte ---------------------- */
  textures: [
    'grain analogique visible, texture VHS / mini-DV, legere perte de definition, image legerement douce',
    'camescope numerique des annees 2000, bruit video organique, compression ancienne perceptible',
    'mini-DV avec halation autour des sources et aberration chromatique en bord de cadre',
  ],
  textureTraits: [
    'grain analogique visible et organique, jamais un filtre ajoute',
    'texture VHS / mini-DV subtile',
    'legere perte de definition, image legerement douce',
    'bruit video organique',
    'petites imperfections d’exposition',
    'legere aberration chromatique en bord de cadre',
    'blooming autour des sources lumineuses',
    'halation subtile',
    'motion blur naturel pendant les mouvements',
    'noirs profonds',
    'zones volontairement sous-exposees, parfois difficiles a distinguer',
    'hautes lumieres parfois legerement brulees',
    'tres legere sensation de compression video ancienne',
  ],

  /* --- Moments ------------------------------------------------------ */
  preferredTimes: [
    'nuit (cadre principal)',
    'coucher de soleil et blue hour : ciel encore lumineux, environnement deja sombre',
  ],
  avoidedTimes: [
    'plein soleil de midi, sauf si le scenario l’exige absolument',
    'lumiere du jour plate et couverte',
  ],

  lensKits: [
    ['24 mm', '35 mm'],
    ['35 mm', '50 mm'],
    ['18 mm grand angle', '35 mm', '85 mm portrait'],
  ],

  /* --- Camera -------------------------------------------------------- */
  cameraGrammars: [
    'camera dynamique et physique : elle est portee par quelqu’un qui etait vraiment la, jamais un mouvement flottant impossible',
    'la camera suit le sujet plutot qu’elle ne le cadre : elle le rattrape, le perd un instant, le retrouve',
    'aucun plan statique tenu longtemps ; si la camera s’arrete, le monde continue de bouger',
  ],
  cameraMoves: [
    'travelling lateral qui accompagne la marche',
    'camera portee, legerement instable',
    'camera qui recule devant le sujet',
    'camera qui depasse quelqu’un par derriere',
    'obstruction de premier plan',
    'rotation lente autour du sujet',
    'suivi de dos a hauteur d’epaule',
    'panoramique motive par un regard',
    'plan large tenu pendant que la ville vit',
  ],
  grades: [
    'sombre et desature, noirs profonds jamais releves, couleurs legerement delavees par la texture',
    'contraste marque, hautes lumieres qui bavent legerement, aucune correction des zones sombres',
  ],

  /* --- Composition ---------------------------------------------------- */
  compositionRules: [
    'le rappeur decale sur le cote du cadre, la ville occupe le reste',
    'le rappeur au fond du cadre, petit, l’environnement domine',
    'le rappeur en silhouette a contre-jour',
    'le rappeur filme de dos pendant qu’il avance',
    'le rappeur derriere une vitre, avec les reflets de la rue par-dessus',
    'le rappeur vu dans un reflet : vitrine, retroviseur, flaque, ascenseur',
    'le rappeur partiellement cache par un element de premier plan',
    'des passants traversent devant l’objectif et masquent brievement le sujet',
  ],

  /* --- Ce qui bouge ---------------------------------------------------- */
  livingElements: [
    'le vent dans les vetements',
    'une meche de cheveux',
    'des voitures qui passent au loin',
    'des passants qui traversent le fond du cadre',
    'la lumiere d’une enseigne qui change',
    'de la fumee de cigarette ou de la vapeur de bouche d’aeration',
    'des reflets qui glissent sur une carrosserie',
    'de la pluie fine dans le halo d’un lampadaire',
    'l’ecran d’un telephone qui s’allume',
  ],

  /* --- Figuration ------------------------------------------------------ */
  backgroundLife: [
    'quelqu’un regarde son telephone',
    'quelqu’un repond a un message',
    'deux personnes discutent',
    'quelqu’un rigole',
    'quelqu’un boit quelque chose',
    'quelqu’un marche sans se presser',
    'quelqu’un ajuste sa veste',
    'quelqu’un regarde autour de lui',
    'quelqu’un parle a son ami',
    'quelqu’un fume',
    'quelqu’un entre dans une voiture',
    'quelqu’un sort d’un batiment',
    'quelqu’un danse legerement sur la musique',
    'quelqu’un filme quelque chose avec son telephone',
    'quelqu’un traverse le cadre',
    'quelqu’un s’assoit',
    'quelqu’un se retourne',
  ],
  crowdRules: [
    'personne ne regarde jamais l’objectif',
    'aucun figurant immobile : chacun a une action naturelle en cours',
    'l’arriere-plan a sa propre vie, independante du rappeur',
    'jamais de foule artificielle ni de figures qui posent',
  ],

  /* --- Garde-robe -------------------------------------------------------- */
  wardrobe: [
    'vestes oversize',
    'hoodies',
    'pantalons larges',
    'jeans',
    'sneakers',
    'vestes en cuir',
    'bombers',
    'survetements premium',
    'casquettes',
    'lunettes',
    'bijoux discrets',
    'sacs de createur',
    'pieces vintage',
  ],
  wardrobeRules: [
    'streetwear haut de gamme mais credible, reellement porte par des jeunes aujourd’hui',
    'aucun costume extravagant',
    'aucun cliche vestimentaire de clip rap',
    'bijoux discrets : jamais de demonstration de richesse',
  ],

  /* --- Emotion ----------------------------------------------------------- */
  emotionalRegister: [
    'confiance',
    'melancolie',
    'nuit',
    'jeunesse',
    'desir',
    'ambition',
    'solitude',
    'mouvement',
  ],

  /* --- Transitions -------------------------------------------------------- */
  transitionTriggers: [
    'un corps qui passe devant l’objectif',
    'un balayage de phares',
    'une porte qui s’ouvre ou se referme',
    'une voiture qui traverse le cadre',
    'un changement de direction du rappeur',
    'un element du decor qui masque l’image',
    'un regard vers le hors-champ',
    'un cut cale sur le beat',
  ],

  /* --- Environnements ------------------------------------------------------ */
  environmentPool: [
    'rooftop',
    'parking souterrain',
    'parking exterieur',
    'rue nocturne',
    'station-service',
    'station de metro',
    'quai',
    'hotel',
    'appartement',
    'escalier urbain',
    'terrain de sport',
    'zone industrielle',
    'station balneaire',
    'plage au coucher du soleil',
    'route de nuit',
    'tunnel',
    'ascenseur',
    'petite rue eclairee',
    'devanture de magasin',
    'terrasse privee',
    'pont',
    'point de vue sur la ville',
  ],

  /* --- Continuite ----------------------------------------------------------- */
  continuityRules: [
    'meme visage, meme structure faciale, meme coiffure, meme silhouette : le rappeur ne devient jamais un autre',
    'meme tenue lorsque la scene est censee etre immediatement enchainee a la precedente',
    'meme femme si le personnage revient',
    'memes amis si le scenario les reutilise',
    'meme ambiance, meme texture VHS, meme colorimetrie d’un episode a l’autre',
  ],

  soundSignatures: [
    'ambiance urbaine nocturne captee sur place : circulation lointaine, pas, voix etouffees ; le morceau se pose par-dessus au montage',
    'son direct imparfait, micro de camescope qui sature legerement sur les aigus',
    'nuit calme, une voiture qui passe, une porte, des voix a un etage',
  ],

  mottos: [
    'Quelqu’un etait reellement la avec une camera cette nuit-la.',
    'Jamais une image propre : l’imperfection est la signature.',
    'Le monde est parfois plus important que le personnage.',
  ],

  doList: [
    'garder du grain, du bruit video et des zones sous-exposees',
    'donner une action naturelle a chaque personne presente dans le cadre',
    'faire bouger quelque chose dans chaque plan, meme le plus calme',
    'motiver chaque transition par un element de l’image',
    'chercher un lieu visuellement fort ou legerement insolite',
    'laisser la camera perdre le sujet un instant',
  ],
  dontList: [
    'image ultra-propre, rendu 4K publicitaire',
    'HDR excessif, peau plastique, couleurs sursaturees',
    'esthetique cyberpunk, neons multicolores partout',
    'clip rap cliche : voitures de luxe a chaque scene, billets de banque, filles qui posent',
    'pluie artificielle systematique, rooftop systematique',
    'personnages qui regardent constamment la camera',
    'figurants immobiles, foule artificielle',
    'CGI visible, mouvements de camera impossibles',
    'transitions artificielles ou effets de montage courts formats',
    'decors generiques, storytelling trop litteral',
  ],
  negatives: [
    'image ultra-propre, nette et stabilisee, rendu publicitaire 4K',
    'HDR excessif, peau lissee plastique, couleurs sursaturees',
    'neons multicolores, esthetique cyberpunk',
    'figurants immobiles qui fixent la camera',
    'voiture de luxe, liasse de billets, pose ostentatoire',
    'mouvement de camera flottant impossible, CGI visible',
    'pluie artificielle non motivee',
  ],

  archetypes: [
    'jeune rappeur contemporain',
    'artiste filme par un ami a la camera',
    'figure nocturne d’un quartier',
  ],
  missions: [
    'raconter une nuit en fragments de quinze secondes, comme des rushes voles a un clip plus long',
    'faire exister un univers de clip ou chaque scene possede sa propre petite histoire',
    'transformer les paroles en images sans jamais les illustrer betement',
  ],
  audiences: [
    'public rap et amateurs d’esthetique analogique, 16-30 ans',
    'auditeurs qui suivent un artiste entre deux sorties',
  ],
  voices: [
    'aucune narration : seules les paroles du morceau portent le texte',
    'le morceau par-dessus, son direct en dessous',
  ],
  promises: [
    'un fragment de clip inedit a chaque publication, jamais deux fois le meme lieu',
    'une idee visuelle inattendue par scene',
    'la meme texture et le meme personnage d’un bout a l’autre',
  ],
  signatures: ['La suite arrive.', 'Meme nuit, autre rue.', 'Encore une prise.'],
  values: ['authenticite', 'melancolie', 'obsession du detail'],
  taboos: [
    'jamais de mise en scene de richesse ostentatoire',
    'jamais de figurante reduite a un decor',
    'jamais de storytelling litteral',
  ],

  nameA: ['Vland', 'Nuit', 'Rush', 'Bande', 'Prise'],
  nameB: ['Blanche', 'Volee', 'Deux', 'Continue', 'Tardive'],

  /* --- Casting ---------------------------------------------------------------- */
  characters: [
    {
      name: 'Vland',
      role: 'le rappeur, personnage principal',
      tagline: 'Il vit dans le monde du clip, il ne pose pas pour une publicite.',
      age: 'jeune adulte — a confirmer depuis les photos de reference',
      build: 'a completer depuis les photos de reference : silhouette, carrure, proportions',
      face: 'a completer depuis les photos de reference : structure faciale exacte, traits, teint',
      hair: 'a completer depuis les photos de reference : coupe, longueur, implantation',
      skin: 'a completer depuis les photos de reference',
      eyes: 'a completer depuis les photos de reference',
      distinctive: 'a completer : le detail qui le rend impossible a confondre (bijou, tatouage, coupe)',
      costume:
        'streetwear haut de gamme credible : veste oversize ou bomber, pantalon large ou jean, sneakers, casquette ou lunettes selon la scene',
      accessories: 'bijoux discrets, parfois un sac de createur, parfois un telephone',
      colorCode: 'tons sombres et neutres qui se detachent par la matiere, pas par la couleur',
      posture: 'detendue, jamais figee ; il occupe l’espace sans le surjouer',
      energy: 'confiance calme traversee de melancolie',
      voice: 'ne parle pas a la camera ; seules les paroles du morceau portent',
      arc: 'la meme nuit se poursuit d’un episode a l’autre',
    },
    {
      name: 'Le crew',
      role: 'les amis qui reviennent',
      tagline: 'Trois presences familieres, jamais des figurants.',
      age: 'meme generation que Vland',
      build: 'silhouettes variees, aucune uniformite',
      face: 'a completer : trois visages distincts et memorisables',
      hair: 'a completer pour chacun',
      skin: 'a completer pour chacun',
      eyes: 'a completer pour chacun',
      distinctive: 'chacun porte une piece reconnaissable d’un episode a l’autre',
      costume: 'streetwear credible, hoodies, survetements premium, vestes en cuir',
      accessories: 'telephones, cigarettes, canettes, sacs',
      colorCode: 'plus clairs ou plus textures que Vland, pour ne pas se confondre avec lui',
      posture: 'toujours en action : ils discutent, marchent, rigolent',
      energy: 'vivante, autonome, indifferente a la camera',
      voice: 'des voix etouffees dans le fond, jamais un dialogue mis en avant',
      arc: 'ils reapparaissent aux memes endroits, comme un groupe qui a ses habitudes',
    },
    {
      name: 'Elle',
      role: 'la presence recurrente',
      tagline: 'Elle revient, et c’est toujours la meme.',
      age: 'meme generation',
      build: 'a completer',
      face: 'a completer : elle doit etre identique a chaque reapparition',
      hair: 'a completer',
      skin: 'a completer',
      eyes: 'a completer',
      distinctive: 'a completer : un detail constant qui permet de la reconnaitre de dos',
      costume: 'pieces vintage et streetwear, jamais une tenue de clip',
      accessories: 'discrets',
      colorCode: 'une seule note plus chaude que le reste du cadre',
      posture: 'naturelle, souvent de profil ou de dos',
      energy: 'distance, presence calme',
      voice: 'aucune parole entendue',
      arc: 'sa presence espacee cree la continuite entre des nuits differentes',
    },
  ],

  /* --- Lieux ------------------------------------------------------------------- */
  places: [
    {
      name: 'Le rooftop',
      kind: 'toit avec vue sur la ville',
      tagline: 'La ville entiere en dessous, personne au-dessus.',
      description:
        'Un toit d’immeuble accessible, garde-corps bas, la ville etalee en contrebas avec ses milliers de fenetres allumees',
      architecture: 'dalle beton, edicule technique, antennes, garde-corps metallique',
      materials: 'beton, acier, gravier de toiture, verre au loin',
      light: 'lueur orange montant de la rue, fenetres lointaines, aucun eclairage sur le toit lui-meme',
      weather: 'vent lateral qui prend dans les vetements',
      timeOfDay: 'nuit, ou fin de blue hour',
      soundscape: 'vent dans le micro, ville lointaine, une sirene tres loin',
      details: 'canettes posees, une chaise depareillee, cables qui courent au sol',
      forbidden: 'jamais de pose contemplative face camera au bord du vide',
    },
    {
      name: 'Le parking -2',
      kind: 'parking souterrain',
      tagline: 'Des tubes au plafond, des piliers, et beaucoup de noir.',
      description:
        'Un niveau de parking souterrain presque vide, marquages effaces, quelques voitures garees, rampe en pente au fond',
      architecture: 'piliers beton numerotes, plafond bas, rampe, grillages',
      materials: 'beton brut, peinture de marquage ecaillee, tole, verre',
      light: 'tubes fluorescents au plafond dont plusieurs manquent, phares qui balaient',
      weather: 'aucune, air confine',
      timeOfDay: 'nuit',
      soundscape: 'echo tres long, moteur lointain, portiere',
      details: 'flaque d’huile, plot renverse, extincteur, cage d’escalier eclairee en vert',
      forbidden: 'jamais de voiture de luxe mise en avant',
    },
    {
      name: 'La station-service',
      kind: 'station-service de nuit',
      tagline: 'La lumiere la plus blanche de toute la nuit.',
      description: 'Une station-service isolee en bord de route, auvent au neon blanc, pompes desertes',
      architecture: 'auvent sur poteaux, batiment bas vitre, pompes alignees',
      materials: 'beton, tole laquee, plexiglas, bitume mouille',
      light: 'neons blancs crus sous l’auvent, tout autour vire au noir immediatement',
      weather: 'bitume encore humide qui renvoie la lumiere',
      timeOfDay: 'nuit profonde',
      soundscape: 'bourdonnement des tubes, pompe, voiture qui passe sur la route',
      details: 'gobelet abandonne, affichette sur la vitrine, insectes autour des lampes',
      forbidden: 'jamais de plan publicitaire sur une marque reelle',
    },
    {
      name: 'La route de nuit',
      kind: 'axe routier peripherique',
      tagline: 'Des phares qui arrivent, des phares qui s’en vont.',
      description:
        'Une route a deux voies en peripherie, lampadaires reguliers, glissieres, zones commerciales eteintes au loin',
      architecture: 'chaussee, glissiere metallique, poteaux d’eclairage, panneaux',
      materials: 'bitume, metal, peinture routiere, herbe seche du bas-cote',
      light: 'lampadaires oranges espaces, phares qui balaient le sujet par intermittence',
      weather: 'nuit claire, vent des vehicules qui passent',
      timeOfDay: 'nuit',
      soundscape: 'passages de vehicules, vent, grillons',
      details: 'reflecteurs, sac plastique pris dans la glissiere, panneau constelle',
      forbidden: 'jamais de cascade ni de vitesse spectaculaire',
    },
    {
      name: 'Le quai au coucher du soleil',
      kind: 'front de mer ou quai fluvial',
      tagline: 'Le seul moment ou le ciel a encore de la couleur.',
      description:
        'Un quai en beton au bord de l’eau, bittes d’amarrage, silhouettes de grues ou d’immeubles a contre-jour',
      architecture: 'quai beton, garde-corps, escalier vers l’eau, mobilier urbain use',
      materials: 'beton, acier rouille, eau, sel',
      light: 'ciel bleu-orange, environnement deja sombre, silhouettes decoupees',
      weather: 'vent de mer, ciel degage en fin de journee',
      timeOfDay: 'blue hour',
      soundscape: 'eau contre le beton, mouettes, ville derriere',
      details: 'cordages, flaque, velo appuye, banc',
      forbidden: 'jamais de carte postale : l’image reste dure et desaturee',
    },
    {
      name: 'L’escalier de la tour',
      kind: 'cage d’escalier ou escalier exterieur',
      tagline: 'Un couloir vertical eclaire par intermittence.',
      description:
        'Un escalier d’immeuble, volees droites, minuterie faible, paliers identiques qui se repetent',
      architecture: 'marches beton, rampe metallique, murs peints, portes numerotees',
      materials: 'beton, metal peint, peinture ecaillee, verre depoli',
      light: 'minuterie jaune faible, un etage sur deux dans le noir',
      weather: 'aucune',
      timeOfDay: 'nuit',
      soundscape: 'echo des pas, minuterie qui bourdonne, porte lointaine',
      details: 'tags effaces, boite aux lettres, velo cadenasse',
      forbidden: 'jamais montrer les deux extremites de l’escalier dans le meme plan',
    },
  ],

  props: [
    {
      name: 'Le camescope',
      description:
        'un camescope mini-DV des annees 2000, tenu par un membre du crew, ecran rabattable ouvert',
      role: 'justifie la texture de l’image dans la fiction elle-meme',
    },
    {
      name: 'Le telephone',
      description: 'un telephone dont l’ecran eclaire le visage par en dessous',
      role: 'source de lumiere ponctuelle et element de vie de fond',
    },
    {
      name: 'La veste',
      description: 'une veste oversize precise, portee sur plusieurs episodes consecutifs',
      role: 'marqueur de continuite entre deux scenes enchainees',
    },
  ],

  /* --- Formats ------------------------------------------------------------------ */
  formats: [
    {
      name: 'Fragment de clip',
      pitch:
        'Quinze secondes qui semblent extraites d’un clip plus long : une idee visuelle, un lieu, une petite histoire.',
      duration: 15,
      beats: [
        'Entree dans la scene par un element qui masque l’image (corps, voiture, porte)',
        'Le lieu se revele, la vie de fond s’installe, le rappeur est decale dans le cadre',
        'Un geste ou un deplacement qui porte l’idee visuelle de la scene',
        'Sortie motivee : un passage devant l’objectif, un balayage de phares, un changement de direction',
      ],
      hook: 'Ouvrir sur une obstruction de premier plan qui se degage',
      payoff: 'La derniere image donne envie de voir le plan suivant du clip',
      cta: '',
      recurring: [
        'la meme texture VHS d’un episode a l’autre',
        'entree et sortie toujours motivees par un element de l’image',
      ],
    },
    {
      name: 'Traversee',
      pitch: 'Le rappeur traverse un lieu de bout en bout, la camera le suit sans jamais le cadrer proprement.',
      duration: 15,
      beats: [
        'La camera est deja en mouvement quand le plan commence',
        'Il entre dans le cadre par un cote et prend la tete',
        'Le lieu defile, des passants coupent la vue par instants',
        'Il sort du champ, la camera continue une seconde sur le lieu vide',
      ],
      hook: 'Le mouvement est deja lance a la premiere image',
      payoff: 'La seconde de vide apres sa sortie',
      cta: '',
      recurring: ['un seul plan continu', 'la camera perd le sujet au moins une fois'],
    },
    {
      name: 'Respiration',
      pitch: 'Un plan sans le rappeur : la ville, la nuit, la vie des autres.',
      duration: 15,
      beats: [
        'Un lieu urbain nocturne, personne d’identifiable',
        'Trois micro-actions se croisent dans le cadre',
        'Une lumiere change ou un vehicule traverse',
        'Le calme revient, le lieu reste',
      ],
      hook: 'Aucun visage connu pendant les premieres secondes',
      payoff: 'On comprend que le rappeur est peut-etre passe par la',
      cta: '',
      recurring: ['aucun personnage principal', 'la ville comme sujet'],
    },
  ],
}
