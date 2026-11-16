// Stilbuch: Ringformen, historisch eingeordnet. Jeder Eintrag bringt eine
// Vorlage mit, die sich in der Werkbank öffnen lässt.
//
// Die Texte sind ein vereinfachender Überblick. Jahreszahlen bezeichnen
// Schwerpunkte, keine scharfen Grenzen.

export const ERAS = [
  { id: 'antike', label: 'Antike', span: 'bis ca. 500 n. Chr.' },
  { id: 'mittelalter', label: 'Mittelalter & Renaissance', span: 'ca. 500 – 1650' },
  { id: 'neuzeit', label: 'Bürgerliches Zeitalter', span: 'ca. 1650 – 1900' },
  { id: 'moderne', label: 'Moderne', span: 'ab 1900' },
];

export const STYLES = [
  {
    id: 'eisenreif', era: 'antike', title: 'Der schlichte Reif', when: 'Rom, ab ca. 3. Jh. v. Chr.',
    stand: 'Freie Bürger (Eisen) · Senatoren und Ritter (Gold)',
    lead: 'Ein glatter Reif ohne Stein: die Urform des Rings – und in Rom ein Ausweis des Standes.',
    preset: { form: 'band', profile: 'd', crown: 0.55, width: 4, thickness: 1.7, material: 'iron', finish: 'satin' },
    sections: [
      ['Herkunft', 'Reife aus Draht oder gegossenem Metall gibt es seit der Bronzezeit. Rechtlich aufgeladen wird der schlichte Ring in Rom: Der eiserne Ring (anulus ferreus) stand dem freien Bürger zu. Den Goldring durften zunächst nur Senatoren und hohe Amtsträger tragen, später auch der Ritterstand – ein Vorrecht, das als „ius anuli aurei“ eigens verliehen werden konnte.'],
      ['Warum diese Form', 'Der Reif ist die einfachste Art, Metall dauerhaft am Körper zu tragen: ein Stab, zum Kreis gebogen und verschlossen. Die leicht gewölbte Außenseite entsteht fast von selbst beim Schmieden und Feilen und schont Nachbarfinger wie Kleidung.'],
      ['Stand und Bedeutung', 'Plinius der Ältere berichtet, dass selbst der Verlobungsring (anulus pronubus) zu seiner Zeit noch aus Eisen und ohne Stein war. Das Material sagte also mehr als die Form: Eisen für Bürgertugend und Bindung, Gold für Rang. In der Kaiserzeit wurde das Goldrecht schrittweise ausgeweitet, bis es praktisch allen Freien offenstand.'],
      ['Heute', 'Der schlichte Reif ist bis heute die Grundlage fast jedes Rings – als Ehering, als Stapelring, als bewusst unaufgeregtes Schmuckstück. Geschwärztes Eisen oder Stahl greifen die römische Nüchternheit wieder auf.'],
    ],
  },
  {
    id: 'siegelring', era: 'antike', title: 'Der Siegelring', when: 'Ägypten und Vorderer Orient, ab ca. 2. Jt. v. Chr.',
    stand: 'Herrscher, Beamte, Adel, Klerus – später Kaufleute',
    lead: 'Ein Ring als Unterschrift: Die Platte trägt das Zeichen, das in Wachs oder Ton gedrückt wird.',
    preset: { form: 'signet', profile: 'd', width: 4.5, thickness: 1.8, faceAcross: 14, faceAlong: 11.5, headHeight: 3.6, faceShape: 'oval', textTable: 'A', font: 'serif', textDepth: 0.35, material: 'gold' },
    sections: [
      ['Herkunft', 'Gesiegelt wurde zuerst mit Rollsiegeln und Stempeln in Mesopotamien. In Ägypten wanderte das Siegel an den Finger: zunächst als drehbarer Skarabäus am Drahtbügel, im Neuen Reich als massiver Metallring mit gravierter Platte. Griechen und Römer setzten geschnittene Steine (Gemmen) ein und siegelten damit Briefe, Verträge und Vorratsgefäße.'],
      ['Warum diese Form', 'Die Form folgt dem Werkzeug. Die Platte muss eben und groß genug für ein lesbares Zeichen sein, der Kopf massiv, damit er dem Druck standhält. Die Schultern laufen breit in die Schiene aus, damit der Ring beim Siegeln nicht kippt. Das Motiv ist vertieft und spiegelverkehrt graviert, damit der Abdruck erhaben und richtig herum erscheint.'],
      ['Stand und Bedeutung', 'Wer siegelte, konnte rechtsgültig handeln – der Siegelring war deshalb ein Zeichen von Amt und Vollmacht. Im Mittelalter führten ihn Adel und hoher Klerus; der Fischerring des Papstes wird bis heute nach dessen Tod unbrauchbar gemacht. Ab dem späten Mittelalter siegelten auch Kaufleute und Handwerker, oft mit einer Hausmarke statt eines Wappens.'],
      ['Heute', 'Als Rechtsinstrument hat der Siegelring ausgedient, als Zeichen der Zugehörigkeit lebt er weiter: Familienwappen, Initialen, Abschlussringe von Schulen und Universitäten. Getragen wird er klassisch am kleinen Finger oder am Ringfinger.'],
    ],
  },
  {
    id: 'kordel', era: 'antike', title: 'Der gedrehte Reif', when: 'Bronzezeit bis Wikingerzeit (ca. 800 – 1050)',
    stand: 'Krieger und Gefolgsleute · Ringe als Lohn und Vermögen',
    lead: 'Verdrillte Stäbe oder Drähte: eine der ältesten Zierformen – und im Norden bares Geld.',
    preset: { form: 'band', profile: 'round', width: 3.2, thickness: 3, pattern: 'rope', patternDepth: 0.45, patternScale: 1, material: 'silver', finish: 'polished' },
    sections: [
      ['Herkunft', 'Schon bronzezeitliche Schmiede tordierten Metallstäbe zu Hals- und Armringen. In der Wikingerzeit entstanden Fingerringe aus zwei oder mehr miteinander verdrehten Gold- oder Silberstäben, deren Enden auf der Rückseite verknotet oder verschmiedet wurden.'],
      ['Warum diese Form', 'Das Verdrillen ist eine Technik ohne Guss und ohne Stein: Es macht einen Stab steifer, verbirgt kleine Unregelmäßigkeiten und lässt das Licht in vielen kleinen Reflexen wandern. Die Zier entsteht aus der Herstellung selbst.'],
      ['Stand und Bedeutung', 'Ringe aus Edelmetall waren Wertspeicher. Gefolgsherren belohnten Treue mit Ringen – die altenglische Dichtung nennt den König deshalb „Ringgeber“. Bei Bedarf wurde ein Ring zerhackt und nach Gewicht als Zahlungsmittel verwendet (Hacksilber). Wer schwere gedrehte Ringe trug, zeigte Vermögen und Bindung an einen Herrn.'],
      ['Heute', 'Der Kordelring ist ein Klassiker bei Stapelringen und als Rahmen neben glatten Bändern. In Silber wirkt er rustikal, in Gold erinnert er an antike Filigranarbeit.'],
    ],
  },
  {
    id: 'perlreif', era: 'antike', title: 'Der Kugel- und Perlreif', when: 'Etrusker, 7.–6. Jh. v. Chr.; Früh­mittelalter',
    stand: 'Oberschicht – Granulation war aufwendige Spezialistenarbeit',
    lead: 'Kugel an Kugel: aus der antiken Granulation und dem Perldraht hervorgegangen.',
    preset: { form: 'band', profile: 'round', width: 2.4, thickness: 2.4, pattern: 'beads', patternScale: 1, material: 'gold', finish: 'polished' },
    sections: [
      ['Herkunft', 'Die Etrusker brachten die Granulation zur Meisterschaft: winzige Goldkügelchen, ohne sichtbares Lot auf eine Fläche gesetzt. Verwandt ist der Perldraht – ein Draht, in den mit einem Formeisen Kugel an Kugel eingedrückt wird. Er rahmt römischen, byzantinischen und frühmittelalterlichen Schmuck.'],
      ['Warum diese Form', 'Kugeln fangen das Licht punktförmig und lassen Gold reicher wirken, als es der Materialeinsatz erwarten lässt. Als Reihe geben sie einem Ring Rhythmus, ohne ein Motiv zu brauchen.'],
      ['Stand und Bedeutung', 'Granulierter Schmuck war Luxusgut und findet sich in den Gräbern der etruskischen und später der fränkischen und angelsächsischen Führungsschicht. Die Technik ging in Europa zeitweise verloren und wurde im 19. Jahrhundert von Goldschmieden wie Castellani wiederentdeckt.'],
      ['Heute', 'Der Kugelring ist ein beliebter Stapelring: Er bringt Struktur zwischen glatte Bänder. Im 3D-Druck verlangt er feine Auflösung – Harzdruck ist hier die bessere Wahl.'],
    ],
  },
  {
    id: 'steigbuegel', era: 'mittelalter', title: 'Der Steigbügelring', when: 'ca. 1150 – 1400',
    stand: 'Bischöfe, Adel, wohlhabende Bürger',
    lead: 'Die Schiene steigt wie ein gotischer Bogen zu einer Spitze auf – benannt nach der Form des Steigbügels.',
    preset: { form: 'taper', profile: 'knife', crown: 0.75, width: 2.6, thickness: 1.5, taperWidth: 5.5, taperThickness: 5, material: 'gold', finish: 'polished' },
    sections: [
      ['Herkunft', 'Der Steigbügelring verbreitete sich im 12. Jahrhundert von England und Frankreich aus über Europa und blieb rund 250 Jahre in Mode. Typisch ist die unten schmale Schiene, die sich nach oben verdickt und in einer Spitze endet, in der ein kleiner, ungeschliffen polierter Stein sitzt – meist ein Saphir.'],
      ['Warum diese Form', 'Schiene und Fassung sind aus einem Stück geschmiedet; der Stein braucht keine angesetzte Fassung. Die Silhouette entspricht dem Spitzbogen der gotischen Baukunst – dieselbe Zeit, dasselbe Formgefühl.'],
      ['Stand und Bedeutung', 'Viele erhaltene Stücke stammen aus Bischofsgräbern; der Saphir galt als Stein des Himmels und der Keuschheit. Getragen wurde die Form aber ebenso von Adligen und reichen Bürgern. Kleiderordnungen versuchten immer wieder, Edelsteine den oberen Ständen vorzubehalten.'],
      ['Heute', 'Die Vorlage hier zeigt die Form ohne Stein – als verlaufenden Ring mit Grat. So wird sie heute oft als schlichter, architektonischer Solitär-Ersatz getragen.'],
    ],
  },
  {
    id: 'posy', era: 'mittelalter', title: 'Der Spruchring (Posy-Ring)', when: 'ca. 1400 – 1700',
    stand: 'Landadel und Bürgertum · Liebes- und Trauring',
    lead: 'Außen schlicht, innen ein Vers: Die Botschaft kennt nur, wer den Ring trägt.',
    preset: { form: 'band', profile: 'd', crown: 0.7, width: 4.5, thickness: 1.7, textInner: 'AMOR VINCIT OMNIA', textSize: 0.5, textDepth: 0.25, font: 'serif', material: 'gold', opacity: 1 },
    sections: [
      ['Herkunft', 'Ringe mit Inschrift gab es schon in Rom. Zur eigenen Gattung wird der Spruchring im späten Mittelalter in England und Frankreich: „Posy“ kommt von „poésie“. Frühe Stücke tragen den Vers außen in gotischen Buchstaben, oft auf Französisch oder Latein; ab dem 16. Jahrhundert wandert er nach innen.'],
      ['Warum diese Form', 'Das glatte, halbrunde Band ist der ruhige Träger für die Schrift. Die Gravur innen schützt den Text vor Abrieb und macht ihn privat – die Haut berührt die Worte. Goldschmiede hielten Büchlein mit gängigen Versen bereit, aus denen die Kundschaft wählen konnte.'],
      ['Stand und Bedeutung', 'Der Spruchring war kein Standeszeichen nach außen, sondern ein Geschenk zwischen zwei Menschen: zur Verlobung, zur Hochzeit, als Freundschafts- oder Erinnerungsgabe. Verbreitet war er vor allem beim Landadel und im wohlhabenden Bürgertum; Shakespeare erwähnt ihn mehrfach.'],
      ['Heute', 'Die Innengravur des Eherings – Name und Datum – ist der direkte Nachfahre. Tipp: In der Werkbank die Deckkraft senken, dann wird die Innengravur von außen sichtbar.'],
    ],
  },
  {
    id: 'gimmel', era: 'mittelalter', title: 'Zwillings- und Ansteckring', when: 'Gimmelring 16.–17. Jh. · Vorsteckring ab 18. Jh.',
    stand: 'Adel und Bürgertum · Verlobung und Ehe',
    lead: 'Mehrere schmale Reife, die zusammengehören – der Ursprung des Stapelns.',
    preset: { form: 'band', profile: 'd', crown: 0.9, width: 2, thickness: 1.5, material: 'rose', finish: 'polished' },
    sections: [
      ['Herkunft', 'Der Gimmelring (von lat. gemellus, Zwilling) besteht aus zwei oder drei Reifen, die sich zu einem Ring zusammenfügen. Er war im 16. und 17. Jahrhundert besonders in Deutschland und England als Verlobungs- und Trauring beliebt. Im 18. Jahrhundert kam der Vorsteckring auf: ein schmaler Reif, der einen kostbareren Ring am Finger sichert.'],
      ['Warum diese Form', 'Zwei Reife, die nur zusammen ein Ganzes ergeben, sind ein Bild für die Ehe. Beim Gimmelring trugen die Verlobten teils je einen Reif und fügten sie zur Hochzeit zusammen. Der Vorsteckring hat einen praktischen Grund: Er sitzt enger und hält den lockeren, wertvollen Ring an seinem Platz.'],
      ['Stand und Bedeutung', 'Königin Charlotte erhielt 1761 zur Hochzeit mit Georg III. einen Diamant-Vorsteckring; im 19. Jahrhundert gehörte der „keeper ring“ zur bürgerlichen Brautausstattung. Mehrere Ringe an einem Finger zeigten: verlobt, verheiratet, Mutter.'],
      ['Heute', 'Stapelringe sind die freie Fortsetzung: schmale Reife in verschiedenen Profilen, Metallen und Oberflächen, nach Belieben kombiniert. Probiere es im Bereich „Stapel“ aus.'],
    ],
  },
  {
    id: 'trauring', era: 'neuzeit', title: 'Der Trauring im D-Profil', when: 'Standardform seit dem 19. Jh.',
    stand: 'Alle Stände – der demokratischste Ring',
    lead: 'Innen flach, außen gewölbt: der Ring, den die meisten Menschen meinen, wenn sie „Ehering“ sagen.',
    preset: { form: 'band', profile: 'd', crown: 0.85, width: 4, thickness: 1.7, textInner: '12 · 6 · 2021', textSize: 0.5, material: 'gold', finish: 'polished' },
    sections: [
      ['Herkunft', 'Der kirchliche Trauring setzte sich im Mittelalter durch. Seine heutige Standardform – ein glattes Goldband mit halbrundem Querschnitt – verfestigte sich im 19. Jahrhundert, als Walzwerke Profildraht gleichmäßig und günstig liefern konnten.'],
      ['Warum diese Form', 'Das D-Profil ist das wirtschaftlichste: flach am Finger, gewölbt nach außen, ohne Kanten, an denen etwas hängen bleibt. Es lässt sich leicht weiten, engen und aufpolieren – wichtig für einen Ring, der ein Leben lang getragen wird. Dass man ihn am vierten Finger trägt, begründete schon die Antike mit einer Ader, die von dort direkt zum Herzen führe.'],
      ['Stand und Bedeutung', 'Material und Gewicht zeigten den Wohlstand, die Form blieb für alle gleich. In Preußen wurde der Ring 1813 politisch: Wer seinen goldenen Trauring für die Befreiungskriege spendete, erhielt einen eisernen mit der Aufschrift „Gold gab ich für Eisen“ – der Eisenring wurde zum Ehrenzeichen. Dass beide Partner einen Ring tragen, ist im deutschsprachigen Raum alt; in den USA wurde es erst im 20. Jahrhundert üblich.'],
      ['Heute', 'Unverändert die meistgewählte Trauringform. Varianten entstehen über Breite, Legierung und Oberfläche – poliert, seidenmatt oder gehämmert.'],
    ],
  },
  {
    id: 'kissen', era: 'neuzeit', title: 'Der Kissen-Siegelring', when: '19. – frühes 20. Jh.',
    stand: 'Bürgertum · Herrenschmuck',
    lead: 'Die Platte als weiches Rechteck: der Siegelring des Bürgers, als das Siegeln schon aus der Mode kam.',
    preset: { form: 'signet', profile: 'd', width: 5, thickness: 1.9, faceAcross: 13, faceAlong: 12.5, headHeight: 3.8, faceShape: 'cushion', textTable: 'JC', font: 'script', textDepth: 0.3, material: 'gold', finish: 'polished' },
    sections: [
      ['Herkunft', 'Im 19. Jahrhundert machten gummierte Briefumschläge das Wachssiegel überflüssig. Der Siegelring verschwand nicht, er wechselte die Aufgabe: Aus dem Werkzeug wurde ein Schmuckstück für Herren. Neben dem Oval kamen die Kissenform, die runde und die achteckige Platte in Mode.'],
      ['Warum diese Form', 'Die Kissenform – ein Rechteck mit gerundeten Ecken und leicht gebauchten Seiten – bietet mehr Fläche für verschlungene Monogramme als das Oval. Weil nicht mehr gesiegelt wurde, konnte die Gravur nun auch richtig herum und nur flach ausgeführt werden.'],
      ['Stand und Bedeutung', 'Wer kein ererbtes Wappen hatte, ließ seine Initialen stechen. Der Ring zeigte nicht Geburt, sondern Erfolg und Seriosität: Er gehörte zum Kaufmann, Arzt oder Anwalt wie die Taschenuhr. Ein Wappenring blieb dem Adel vorbehalten – zumindest dem Anspruch nach.'],
      ['Heute', 'Der Kissen-Siegelring wird heute von allen Geschlechtern getragen, oft ganz ohne Gravur als ruhige, skulpturale Fläche.'],
    ],
  },
  {
    id: 'vring', era: 'neuzeit', title: 'Der V-Ring', when: 'Viktorianisch, ab ca. 1880',
    stand: 'Bürgertum · Glücksbringer und Beisteckring',
    lead: 'Eine Schiene, die vorn zur Spitze zusammenläuft – nach dem Gabelbein des Geflügels auch Wishbone genannt.',
    preset: { form: 'vee', profile: 'd', crown: 0.9, width: 2, thickness: 1.6, veeDepth: 3.2, veeSpread: 0.45, material: 'gold', finish: 'polished' },
    sections: [
      ['Herkunft', 'Im späten 19. Jahrhundert liebte man Schmuck mit Glückssymbolen: Hufeisen, Kleeblatt – und das Gabelbein, an dem zwei Menschen ziehen und sich etwas wünschen. Daraus entstand der Ring mit V-förmig geknickter Schiene.'],
      ['Warum diese Form', 'Die Spitze streckt den Finger optisch. Vor allem aber schmiegt sich das V an einen Ring mit Stein: Es umfährt die Fassung, statt an sie zu stoßen. So wurde der V-Ring zum idealen Begleiter des Verlobungsrings.'],
      ['Stand und Bedeutung', 'Ein erschwingliches, sentimentales Geschenk des Bürgertums – zur Verlobung, zur Geburt eines Kindes, als Jahrestagsring. Mehrere V-Ringe übereinander zählten die Anlässe.'],
      ['Heute', 'Als „Chevron“ ist der V-Ring ein Grundbaustein beim Stapeln. Zwei gegenläufige V-Ringe rahmen einen geraden Ring; mehrere gleichgerichtete ergeben ein Fischgrätmuster. Im Stapel der App schmiegen sie sich passgenau ineinander.'],
    ],
  },
  {
    id: 'hammer', era: 'moderne', title: 'Der gehämmerte Ring', when: 'Arts and Crafts, ca. 1880 – 1915',
    stand: 'Reformorientiertes Bürgertum · Silber statt Gold',
    lead: 'Die Spuren des Hammers bleiben stehen – als Bekenntnis zum Handwerk.',
    preset: { form: 'band', profile: 'flat', crown: 0.5, edge: 0.4, width: 6, thickness: 1.8, pattern: 'hammered', patternDepth: 0.22, patternScale: 1, material: 'silver', finish: 'polished' },
    sections: [
      ['Herkunft', 'Jeder geschmiedete Ring trägt zunächst Hammerspuren; jahrtausendelang wurden sie weggefeilt und poliert. Die Arts-and-Crafts-Bewegung in England kehrte das um. Gegen die glatte Massenware der Fabriken setzten Werkstätten wie C. R. Ashbees Guild of Handicraft (gegründet 1888) die sichtbare Handarbeit.'],
      ['Warum diese Form', 'Die Hammerschlagfläche zeigt, wie das Stück entstanden ist. Jede Mulde reflektiert anders, die Oberfläche wirkt lebendig – und sie verzeiht Tragespuren, weil neue Kratzer im Muster verschwinden.'],
      ['Stand und Bedeutung', 'Die Bewegung wollte Schmuck nach Gestaltung statt nach Materialwert beurteilt sehen: Silber, Email und Mondstein statt Gold und Diamant. Getragen wurde er von einem gebildeten, reformfreudigen Bürgertum, das sich damit vom Prunk der Gründerzeit absetzte.'],
      ['Heute', 'Gehämmerte Oberflächen sind bei Trauringen und Herrenringen fest etabliert – für alle, denen Hochglanz zu glatt ist.'],
    ],
  },
  {
    id: 'milgrain', era: 'moderne', title: 'Der Ring mit Perlrand', when: 'Belle Époque und Art déco, ca. 1900 – 1935',
    stand: 'Großbürgertum und Adel · Platinschmuck',
    lead: 'Eine feine Reihe winziger Körner säumt die Kanten – „Millegriffes“, tausend Körner.',
    preset: { form: 'band', profile: 'flat', crown: 0.3, edge: 0.15, width: 5, thickness: 1.7, pattern: 'milgrain', patternDepth: 0.22, material: 'platinum', finish: 'polished' },
    sections: [
      ['Herkunft', 'Perlränder kennt schon die Antike. Zum Markenzeichen wurden sie um 1900, als Platin dank heißerer Brenner verarbeitbar wurde. Das zähe Metall erlaubte hauchfeine Kanten, die Juweliere wie Cartier mit einem Rändelrädchen zu Körnerreihen prägten.'],
      ['Warum diese Form', 'Der Perlrand bricht harte Metallkanten in viele kleine Lichtpunkte und lässt Fassungen leichter wirken – wie eine Spitzenborte. Auf einem flachen Band rahmt er die Fläche wie ein Bilderrahmen.'],
      ['Stand und Bedeutung', 'Platinschmuck der Belle Époque war der Schmuck der Oberschicht: weiß in weiß, zu Spitze und Seide getragen. Im Art déco wurde das Körnchenband geometrischer und fand über Serienfertigung auch den Weg zum Mittelstand.'],
      ['Heute', 'Perlränder stehen für „Vintage“ und sind bei Trauringen im Stil der 1920er-Jahre gefragt. Für den 3D-Druck braucht das feine Detail Harzdruck mit hoher Auflösung.'],
    ],
  },
  {
    id: 'messerkante', era: 'moderne', title: 'Die Messerkante', when: 'verbreitet seit dem frühen 20. Jh.',
    stand: 'Ohne Standesbindung · Verlobungs- und Bandringe',
    lead: 'Zwei schräge Flächen treffen sich in einem Grat: Der Ring wirkt schmaler, als er ist.',
    preset: { form: 'band', profile: 'knife', crown: 0.8, width: 3.2, thickness: 2, material: 'white', finish: 'polished' },
    sections: [
      ['Herkunft', 'Schienen mit dachförmigem Querschnitt gibt es vereinzelt seit dem Mittelalter. Populär wurde die Messerkante mit den Solitärringen des späten 19. und frühen 20. Jahrhunderts und der Vorliebe des Art déco für klare Kanten und Flächen.'],
      ['Warum diese Form', 'Von oben sieht man nur den Grat – die Schiene erscheint als feine Linie und lenkt den Blick auf einen Stein oder auf die Hand. Zugleich bleibt genug Material für Stabilität. Die zwei geneigten Flächen spiegeln das Licht in zwei Richtungen; der Ring blitzt bei jeder Bewegung.'],
      ['Stand und Bedeutung', 'Die Messerkante ist eine Form des Industriezeitalters: präzise, wiederholbar, ohne Symbolik. Sie gehört keiner Schicht, sondern einer Haltung – weniger Ornament, mehr Linie.'],
      ['Heute', 'Beliebt als Verlobungsringschiene und als kantiger Gegenpol im Stapel. Achtung: Ein sehr scharfer Grat nutzt sich ab und kann drücken; eine minimale Rundung ist üblich.'],
    ],
  },
  {
    id: 'bombe', era: 'moderne', title: 'Der Kuppelring (Bombé)', when: 'Retro-Zeit, ca. 1935 – 1950',
    stand: 'Gesellschaftsschmuck · Cocktailring',
    lead: 'Eine hohe, gewölbte Kuppel aus Gold: Volumen statt Stein.',
    preset: { form: 'bombe', profile: 'd', width: 4, thickness: 1.7, faceAcross: 17, faceAlong: 13, headHeight: 5.2, faceShape: 'oval', material: 'gold', finish: 'polished' },
    sections: [
      ['Herkunft', 'Gewölbte, hohl gearbeitete Goldringe trug schon die römische Kaiserzeit. Zur Mode wurde die Kuppel wieder in den späten 1930er- und 1940er-Jahren. Platin war im Krieg der Rüstung vorbehalten, große Steine waren knapp – also arbeiteten die Juweliere mit Gelb- und Roségold und mit plastischer Form.'],
      ['Warum diese Form', 'Die Kuppel ist meist hohl getrieben oder gegossen: viel Erscheinung bei vertretbarem Gewicht. Die geschlossene, gespannte Fläche wirkt wie ein Stück Skulptur und spiegelt den ganzen Raum.'],
      ['Stand und Bedeutung', 'Der Cocktailring war Schmuck zum Ausgehen – selbstbewusst, sichtbar, von Frauen oft selbst gekauft. Hollywood machte die üppigen Goldformen zum Inbegriff von Glamour.'],
      ['Heute', 'Als „Dome Ring“ wieder sehr präsent. Für den Druck beachten: Die Vorlage ist massiv; in Metall würde man sie aushöhlen, um Gewicht zu sparen.'],
    ],
  },
  {
    id: 'modern', era: 'moderne', title: 'Das flache Band der Moderne', when: 'Bauhaus bis Skandinavisches Design, ab ca. 1925',
    stand: 'Gestalter, Architekten – heute Allgemeingut',
    lead: 'Rechteckiger Querschnitt, klare Kanten, höchstens eine Rille: Form folgt Funktion.',
    preset: { form: 'band', profile: 'flat', crown: 0, edge: 0.2, width: 6, thickness: 1.7, pattern: 'grooves', patternCount: 2, patternDepth: 0.25, material: 'titanium', finish: 'satin' },
    sections: [
      ['Herkunft', 'Die Moderne der 1920er-Jahre verlangte vom Schmuck dasselbe wie vom Stuhl und vom Haus: Ehrlichkeit des Materials, keine angeklebte Dekoration. Nach 1945 prägten skandinavische Silberschmiede den schlichten Bandring; Stahl und später Titan kamen als Werkstoffe hinzu.'],
      ['Warum diese Form', 'Das flache Band ist der direkteste Weg vom Blechstreifen zum Ring. Seine Fläche zeigt Material und Oberfläche unverstellt; eine gedrehte Rille oder ein Wechsel von matt und poliert genügt als Gliederung. Gefertigt wird es oft auf der Drehbank – Maschinenarbeit, die sich nicht versteckt.'],
      ['Stand und Bedeutung', 'Anfangs ein Erkennungszeichen von Gestaltern und Intellektuellen, die sich vom bürgerlichen Juwelierschmuck absetzen wollten. Mit Stahl und Titan wurde das flache Band erschwinglich und zum verbreiteten Partner- und Herrenring.'],
      ['Heute', 'Die meistverkaufte Alternative zum halbrunden Trauring. Seidenmatt gebürstet, mit einer oder zwei Rillen, in Platin, Titan oder Gold.'],
    ],
  },
  {
    id: 'welle', era: 'moderne', title: 'Der Wellenring', when: 'Jugendstil-Linie um 1900 · Stapelring der Gegenwart',
    stand: 'Ohne Standesbindung',
    lead: 'Die Schiene schwingt seitlich aus – eine bewegte Linie statt eines starren Kreises.',
    preset: { form: 'wave', profile: 'd', crown: 0.9, width: 2, thickness: 1.6, waveAmp: 1.1, waveCount: 3, material: 'rose', finish: 'polished' },
    sections: [
      ['Herkunft', 'Um 1900 machte der Jugendstil die geschwungene, pflanzenhafte Linie zum Programm. Als eigene Ringform setzte sich die Welle in der zweiten Hälfte des 20. Jahrhunderts durch, als Gießverfahren frei geformte Schienen einfach machten.'],
      ['Warum diese Form', 'Die Welle bringt Bewegung an die Hand, ohne Stein und ohne Muster. Praktisch füllt sie Lücken: Ein Wellenring legt sich um Fassungen und Nachbarringe und lässt zwischen geraden Bändern kleine Lichtfenster frei.'],
      ['Stand und Bedeutung', 'Der Wellenring gehört in eine Zeit, in der Schmuck nicht mehr Rang anzeigt, sondern Geschmack. Er wird als Vorsteckring, als Memoire-Variante oder einfach als Linie getragen.'],
      ['Heute', 'Im Stapel besonders wirkungsvoll: zwei Wellenringe, einer davon gedreht, ergeben ein Flechtband. Probiere es mit verschiedenen Metallfarben.'],
    ],
  },
];

export const PRINT_NOTES = [
  ['Harzdruck (SLA/DLP)', 'Die beste Wahl für Ringe: feine Details wie Gravuren, Perlränder und Hammerschlag kommen sauber heraus. Den Ring leicht geneigt auf Stützen drucken, damit die Sichtflächen frei bleiben.'],
  ['Filamentdruck (FDM)', 'Für Passform- und Größenproben gut geeignet. Flach liegend drucken (so exportiert die App), Schichthöhe 0,1 mm oder feiner. Feine Gravuren unter 0,4 mm gehen meist verloren.'],
  ['Passform', 'Gedruckte Ringe fallen oft etwas enger aus. Eine halbe Größe mehr einstellen oder nach dem Druck innen leicht schleifen.'],
  ['Vom Druck zum Metall', 'Druckdienstleister gießen direkt aus STL-Dateien: Der Ring wird in Wachs oder gießbarem Harz gedruckt und im Wachsausschmelzverfahren in Silber, Gold oder Bronze gegossen. Wandstärken unter 0,8 mm vermeiden.'],
];
