// Auswahl-Kataloge: Materialien, Oberflächen, Formen, Profile, Muster.

export const MATERIALS = {
  gold: { label: 'Gelbgold', note: '750', group: 'Gold', color: 0xf3bf5f, metal: 1, density: 15.5 },
  gold585: { label: 'Gelbgold', note: '585', group: 'Gold', color: 0xf0cc80, metal: 1, density: 13.1 },
  gold999: { label: 'Feingold', note: '999', group: 'Gold', color: 0xf7b23c, metal: 1, density: 19.3 },
  rose: { label: 'Roségold', note: '750', group: 'Gold', color: 0xe9a68c, metal: 1, density: 15.0 },
  red: { label: 'Rotgold', note: '750', group: 'Gold', color: 0xdf8a6c, metal: 1, density: 15.1 },
  white: { label: 'Weißgold', note: '750', group: 'Gold', color: 0xe6e0d2, metal: 1, density: 15.8 },
  silver: { label: 'Silber', note: '925', group: 'Silber & Platin', color: 0xf7f5ef, metal: 1, density: 10.4 },
  silverOx: { label: 'Silber', note: 'geschwärzt', group: 'Silber & Platin', color: 0x55565c, metal: 1, density: 10.4, rough: 0.32 },
  platinum: { label: 'Platin', note: '950', group: 'Silber & Platin', color: 0xd3d1cc, metal: 1, density: 20.1 },
  palladium: { label: 'Palladium', note: '950', group: 'Silber & Platin', color: 0xc9c7c4, metal: 1, density: 11.8 },
  titanium: { label: 'Titan', note: '', group: 'Weitere Metalle', color: 0x8f8c88, metal: 1, density: 4.5, rough: 0.22 },
  steel: { label: 'Edelstahl', note: '', group: 'Weitere Metalle', color: 0xb9bcc0, metal: 1, density: 7.9 },
  tungsten: { label: 'Wolfram', note: '', group: 'Weitere Metalle', color: 0x6d6f73, metal: 1, density: 15.6 },
  bronze: { label: 'Bronze', note: '', group: 'Weitere Metalle', color: 0xc8904f, metal: 1, density: 8.8 },
  brass: { label: 'Messing', note: '', group: 'Weitere Metalle', color: 0xe3c46a, metal: 1, density: 8.5 },
  copper: { label: 'Kupfer', note: '', group: 'Weitere Metalle', color: 0xf0a07c, metal: 1, density: 8.96 },
  iron: { label: 'Eisen', note: 'geschwärzt', group: 'Weitere Metalle', color: 0x47474a, metal: 1, density: 7.87, rough: 0.42 },
  ceramicBlack: { label: 'Keramik', note: 'schwarz', group: 'Nichtmetalle', color: 0x151517, metal: 0, density: 6.0, env: 1.2 },
  ceramicWhite: { label: 'Keramik', note: 'weiß', group: 'Nichtmetalle', color: 0xf1efea, metal: 0, density: 6.0 },
  resin: { label: 'Kunstharz', note: 'klar', group: 'Nichtmetalle', color: 0xcfe0ff, metal: 0, density: 1.15, opacity: 0.55, env: 1.4 },
  wax: { label: 'Modellwachs', note: 'Druck', group: 'Nichtmetalle', color: 0x4c63c9, metal: 0, density: 1.0, rough: 0.5 },
};
export const MATERIAL_GROUPS = ['Gold', 'Silber & Platin', 'Weitere Metalle', 'Nichtmetalle'];

export const FINISHES = {
  polished: { label: 'Poliert', rough: 0.06 },
  satin: { label: 'Seidenmatt', rough: 0.3 },
  matte: { label: 'Matt', rough: 0.55 },
};

export const FORMS = {
  band: { label: 'Band', hint: 'Die Schiene ist rundum gleich breit und stark' },
  taper: { label: 'Verlauf', hint: 'Oben breiter und stärker, unten schmal' },
  signet: { label: 'Siegel', hint: 'Kopf mit flacher Platte' },
  bombe: { label: 'Kuppel', hint: 'Gewölbter, voluminöser Kopf' },
};
export const FACES = { oval: 'Oval', cushion: 'Kissen', square: 'Eckig', navette: 'Navette' };

export const PATHS = {
  straight: { label: 'Gerade' },
  wave: { label: 'Welle' },
  zigzag: { label: 'Zickzack' },
  vee: { label: 'V-Spitze' },
};
export const CLOSURES = {
  closed: { label: 'Geschlossen' },
  open: { label: 'Offen', hint: 'Spange mit Öffnung – oben bei schlichten Ringen, unten bei Ringen mit Kopf' },
  spiral: { label: 'Spirale', hint: 'Mehrere Windungen; mit wenig mehr als einer Windung entsteht ein Bypass-Ring' },
};
export const ENDS = { round: 'Rund', flat: 'Gerade', ball: 'Kugel', point: 'Spitz' };
export const OUTLINES = { round: 'Rund', poly: 'Vieleck' };
export const CONTOURS = { none: 'Gerade', scallop: 'Bogenkante', crown: 'Krone' };

export const PROFILES = {
  d: { label: 'Halbrund', hint: 'D-Profil: innen flach, außen gewölbt', crown: 'Wölbung', edge: true },
  comfort: { label: 'Bombiert', hint: 'Comfort Fit: innen und außen gewölbt', crown: 'Wölbung' },
  lens: { label: 'Linse', hint: 'Beidseitig gewölbt, läuft zu feinen Kanten aus', crown: 'Innenwölbung' },
  flat: { label: 'Flach', hint: 'Rechteckiger Querschnitt', crown: 'Wölbung', edge: true },
  cushion: { label: 'Kissen', hint: 'Weiches Vierkant – zwischen rund und eckig', crown: 'Kantigkeit' },
  round: { label: 'Rund', hint: 'Runddraht; mit ungleicher Breite und Stärke ein Oval' },
  knife: { label: 'Messerkante', hint: 'Läuft außen zu einem Grat zusammen', crown: 'Steilheit', edge: true },
  bevel: { label: 'Fase', hint: 'Flach mit abgeschrägten Kanten', crown: 'Breite der Fase', edge: true },
  slant: { label: 'Pult', hint: 'Einseitig ansteigend – wirkt im Stapel wie eine Stufe', crown: 'Gefälle', edge: true },
  concave: { label: 'Hohlkehle', hint: 'Außen nach innen gewölbt', crown: 'Tiefe der Kehle', edge: true },
  channel: { label: 'Randprofil', hint: 'Erhöhte Ränder, vertiefte Mitte', crown: 'Tiefe', edge: true },
  step: { label: 'Stufe', hint: 'Erhöhte Mittelbahn mit niedrigen Schultern', crown: 'Breite der Stufe', edge: true },
  bead: { label: 'Mittelwulst', hint: 'Flaches Band mit halbrundem Wulst in der Mitte', crown: 'Breite des Wulstes', edge: true },
  double: { label: 'Doppelwulst', hint: 'Zwei Wülste nebeneinander – wie zwei verbundene Reife', crown: 'Tiefe der Kehle' },
  rimmed: { label: 'Randwülste', hint: 'Großer Wulst in der Mitte, kleine Wülste an beiden Rändern', crown: 'Breite der Randwülste' },
  triple: { label: 'Dreiwulst', hint: 'Drei Wülste – wie ein Bündel aus drei Drähten', crown: 'Tiefe der Kehlen' },
};

export const PATTERNS = {
  none: { label: 'Glatt' },
  grooves: { label: 'Rillen', count: 'Anzahl' },
  flutes: { label: 'Kanneluren', scale: true },
  ribs: { label: 'Rippen', scale: true },
  diagonal: { label: 'Schrägrillen', scale: true },
  waves: { label: 'Guilloche', scale: true },
  meander: { label: 'Mäander', scale: true, noZone: true },
  fret: { label: 'Stufenmäander', scale: true, noZone: true },
  steps: { label: 'Stufenband', scale: true, noZone: true },
  milgrain: { label: 'Perlrand', noZone: true },
  hammered: { label: 'Gehämmert', scale: true },
  bark: { label: 'Rinde', scale: true },
  dots: { label: 'Punzen', scale: true },
  pyramids: { label: 'Pyramiden', scale: true },
  scales: { label: 'Schuppen', scale: true },
  rope: { label: 'Kordel', scale: true },
  knurl: { label: 'Rändel', scale: true },
  beads: { label: 'Kugeln', scale: true, noDepth: true, noZone: true },
};
export const ZONES = { all: 'Ganze Fläche', center: 'Nur Mitte', edges: 'Nur Ränder' };

export const INLAYS = {
  none: { label: 'Einfarbig' },
  center: { label: 'Mittelstreifen' },
  edges: { label: 'Ränder' },
  half: { label: 'Längs geteilt' },
  inside: { label: 'Innen' },
  head: { label: 'Kopf', needsHead: true },
};

// ---------------------------------------------------------------- Steine
// Handelsübliche kalibrierte Maße in mm (Länge × Breite). Toleranz der
// Hersteller etwa ±0,1 mm – dafür gibt es das einstellbare Spiel im Sitz.
export const STONE_SHAPES = {
  round: { label: 'Rund', sizes: [1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12] },
  oval: { label: 'Oval', sizes: [[5, 3], [6, 4], [7, 5], [8, 6], [10, 8], [12, 10], [14, 10], [16, 12], [18, 13]] },
  octagon: { label: 'Achteck', sizes: [[5, 3], [6, 4], [7, 5], [8, 6], [10, 8], [12, 10], [14, 10]] },
  square: { label: 'Carré', sizes: [2, 3, 4, 5, 6, 8] },
  cushion: { label: 'Kissen', sizes: [4, 5, 6, 8, 10] },
  baguette: { label: 'Baguette', sizes: [[3, 1.5], [4, 2], [5, 2.5], [6, 3], [8, 4]] },
  pear: { label: 'Tropfen', sizes: [[5, 3], [6, 4], [7, 5], [8, 5], [9, 6], [10, 7], [12, 8], [14, 9]] },
  marquise: { label: 'Navette', sizes: [[4, 2], [5, 2.5], [6, 3], [8, 4], [10, 5], [12, 6]] },
};
export const STONE_CUTS = {
  point: { label: 'Facettiert, spitz', hint: 'Klassischer Schliff mit Spitze (Chaton). Der Sitz ist ein Kegel, der Stein liegt mit der Rundiste auf' },
  flat: { label: 'Facettiert, flach', hint: 'Strass mit flacher Rückseite (Flatback). Der Sitz ist eine flache Tasche' },
  cab: { label: 'Cabochon', hint: 'Glatt gewölbt, flache Rückseite. Der Sitz ist eine flache Tasche' },
};
export const STONE_LAYOUTS = {
  none: { label: 'Ohne' },
  solo: { label: 'Solitär' },
  trio: { label: 'Trio' },
  row: { label: 'Reihe' },
  around: { label: 'Rundum' },
};
export const SETTINGS = {
  flush: { label: 'Eingelassen', hint: 'Der Sitz ist in den Ring versenkt. Reicht die Materialstärke nicht, hebt sich die Stelle automatisch etwas an' },
  bezel: { label: 'Zarge', hint: 'Ein aufgesetzter Rand mit senkrechter Wand umschließt den Stein' },
  cone: { label: 'Kelch', hint: 'Die Fassung wächst in weichem Schwung aus der Schiene – bei großen Steinen prägt sie die ganze Ringform' },
};
