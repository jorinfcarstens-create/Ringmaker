# Ringmaker

Eine App fürs iPhone (und jeden modernen Browser), mit der man Schmuckringe gestaltet,
live in 3D betrachtet, sammelt, stapelt und für den 3D-Druck exportiert.

## Was die App kann

- **Werkbank** – Ring über Regler gestalten, die 3D-Ansicht folgt live und lässt sich mit dem Finger drehen und zoomen.
  - Grundformen: Bandring, Verlaufring, Siegelring (oval, Kissen, eckig), Kuppelring, Wellenring, V-Ring
  - Querschnitte: Halbrund, Bombiert (Comfort Fit), Flach, Rund, Messerkante, Fase, Hohlkehle
  - Oberflächen: Rillen, Kanneluren, Perlrand, Gehämmert, Kordel, Rändel, Facetten, Kugeln
  - Gravur/Prägung: außen (vertieft oder erhaben), innen, Initialen auf der Siegelplatte
  - Material: Gold-, Silber-, Platintöne, Titan, Stahl, Bronze, Kupfer, Eisen, Kunstharz – poliert, seidenmatt oder matt, mit einstellbarer Deckkraft (transparent)
  - Anzeige von Innendurchmesser, US-Größe, Volumen und Gewicht im gewählten Material
- **Galerie** – gespeicherte Ringe mit Vorschaubild; bearbeiten, duplizieren, löschen, exportieren, importieren.
- **Stapel** – mehrere Ringe zusammen auf einem Ringstab oder nebeneinander. V- und Wellenringe schmiegen sich ineinander.
- **Stilbuch** – 16 Ringformen historisch eingeordnet (Herkunft, Grund der Form, Stand, heutige Verwendung), jede als Vorlage zu öffnen.
- **Export** – STL für den 3D-Druck (Millimeter, geschlossener Körper, liegt flach auf dem Druckbett), Ring-Datei (`.ring.json`) zum Weitergeben und Sichern, PNG-Bild.

Alle Daten bleiben auf dem Gerät. Es gibt kein Konto, keinen Server und keine Übertragung.

## Aufs iPhone bringen

Die App ist eine reine Sammlung statischer Dateien – sie muss nur einmal irgendwo per HTTPS erreichbar sein.
Danach läuft sie auch ohne Internet.

1. Die Dateien dieses Ordners hosten, zum Beispiel:
   - **GitHub Pages**: Repository → Settings → Pages → „Deploy from a branch“, Branch auswählen, Ordner `/ (root)`.
     (Bei privaten Repositories braucht Pages einen bezahlten GitHub-Plan; ein öffentliches Repository genügt sonst.
     Die App enthält keine persönlichen Daten – Ringe liegen nur auf dem jeweiligen Gerät.)
   - oder **Netlify Drop** / **Cloudflare Pages**: den Ordner hochladen, fertig.
2. Die Adresse auf dem iPhone in **Safari** öffnen.
3. Teilen-Symbol → **„Zum Home-Bildschirm“**. Ringmaker erscheint als eigenes App-Symbol und startet im Vollbild.

Hinweis: Ringe am besten über das Home-Bildschirm-Symbol nutzen – dort bewahrt iOS die gespeicherten Daten dauerhaft auf.
Zur Sicherheit lässt sich die ganze Sammlung in der Galerie über „Sichern“ als Datei exportieren.

## Lokal ausprobieren

```
npm start        # startet einen Webserver auf http://localhost:8080
npm test         # prüft alle Formen auf geschlossene, druckbare Netze und die STL-Ausgabe
```

Es gibt keinen Build-Schritt und keine Abhängigkeiten außer der mitgelieferten three.js-Bibliothek (`js/vendor`).

## Aufbau

| Datei | Aufgabe |
| --- | --- |
| `js/ring.js` | Parametrische Geometrie: aus den Einstellungen wird ein geschlossenes Dreiecksnetz |
| `js/viewer.js` | 3D-Bühne (three.js), Materialien, Stapel-Anordnung, Vorschaubilder |
| `js/text.js` | Gravurtext als Höhenkarte |
| `js/catalog.js` | Listen der Formen, Profile, Muster, Materialien |
| `js/handbook.js` | Texte und Vorlagen des Stilbuchs |
| `js/store.js` | Lokales Speichern, Import, Export (STL, Ring-Datei) |
| `js/app.js` | Bedienoberfläche |
| `sw.js` | Offline-Betrieb (bei neuen Versionen `CACHE` hochzählen) |
| `tools/` | Entwicklungswerkzeuge für Bildschirmfotos und Icons (benötigen Playwright) |
