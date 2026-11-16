// Auswahl-Kataloge: Materialien, Oberflächen, Formen, Profile, Muster.

export const MATERIALS = {
  gold: { label: 'Gelbgold', note: '750', color: 0xf3bf5f, metal: 1, density: 15.5 },
  rose: { label: 'Roségold', note: '750', color: 0xe9a68c, metal: 1, density: 15.0 },
  white: { label: 'Weißgold', note: '750', color: 0xe6e0d2, metal: 1, density: 15.8 },
  silver: { label: 'Silber', note: '925', color: 0xf7f5ef, metal: 1, density: 10.4 },
  platinum: { label: 'Platin', note: '950', color: 0xd3d1cc, metal: 1, density: 20.1 },
  titanium: { label: 'Titan', note: '', color: 0x8f8c88, metal: 1, density: 4.5, rough: 0.22 },
  steel: { label: 'Edelstahl', note: '', color: 0xb9bcc0, metal: 1, density: 7.9 },
  bronze: { label: 'Bronze', note: '', color: 0xc8904f, metal: 1, density: 8.8 },
  copper: { label: 'Kupfer', note: '', color: 0xf0a07c, metal: 1, density: 8.96 },
  iron: { label: 'Eisen', note: 'geschwärzt', color: 0x47474a, metal: 1, density: 7.87, rough: 0.42 },
  resin: { label: 'Kunstharz', note: 'klar', color: 0xbfe3dc, metal: 0, density: 1.15, opacity: 0.55, env: 1.4 },
  wax: { label: 'Modellwachs', note: 'Druck', color: 0x3f7d68, metal: 0, density: 1.0, rough: 0.5 },
};

export const FINISHES = {
  polished: { label: 'Poliert', rough: 0.06 },
  satin: { label: 'Seidenmatt', rough: 0.3 },
  matte: { label: 'Matt', rough: 0.55 },
};

export const FORMS = {
  band: { label: 'Bandring', hint: 'Gleichmäßige Schiene rundum' },
  taper: { label: 'Verlaufring', hint: 'Oben breiter und stärker, unten schmal' },
  signet: { label: 'Siegelring', hint: 'Kopf mit flacher Platte' },
  bombe: { label: 'Kuppelring', hint: 'Gewölbter, voluminöser Kopf' },
  wave: { label: 'Wellenring', hint: 'Schiene schwingt seitlich' },
  vee: { label: 'V-Ring', hint: 'Spitze nach vorn, ideal zum Anstecken' },
};

export const PROFILES = {
  d: { label: 'Halbrund', hint: 'D-Profil: innen flach, außen gewölbt' },
  comfort: { label: 'Bombiert', hint: 'Comfort Fit: innen und außen gewölbt' },
  flat: { label: 'Flach', hint: 'Rechteckiger Querschnitt' },
  round: { label: 'Rund', hint: 'Runddraht' },
  knife: { label: 'Messerkante', hint: 'Läuft außen zu einem Grat zusammen' },
  bevel: { label: 'Fase', hint: 'Flach mit abgeschrägten Kanten' },
  concave: { label: 'Hohlkehle', hint: 'Außen nach innen gewölbt' },
};

export const PATTERNS = {
  none: { label: 'Glatt' },
  grooves: { label: 'Rillen', count: 'Anzahl' },
  flutes: { label: 'Kanneluren', scale: true },
  milgrain: { label: 'Perlrand' },
  hammered: { label: 'Gehämmert', scale: true },
  rope: { label: 'Kordel', scale: true },
  knurl: { label: 'Rändel', scale: true },
  facets: { label: 'Facetten', count: 'Flächen' },
  beads: { label: 'Kugeln', scale: true, noDepth: true },
};

export const FACES = { oval: 'Oval', cushion: 'Kissen', square: 'Eckig' };
