# Krach Alarm

Eine App, die mit dem Mikrofon die Umgebungslautstärke misst und bei einem
einstellbaren Grenzwert einen Alarmton abspielt. Die aktuelle Lautstärke wird
als Zahl + Bezeichnung angezeigt – farblich von **grün** (leise) über **rot**
(laut) bis **lila** (130 dB).

Die App ist eine Web-App. Du hast drei Wege, sie aufs Android-Handy zu bringen:

- **Weg A – PWA (empfohlen, kein echter Build):** Dateien hosten (z. B. mit
  Netlify Drop oder GitHub Pages), die `https`-Adresse am Handy öffnen und
  „Zum Startbildschirm hinzufügen“. Installiert sich wie eine echte App,
  Mikrofon funktioniert, läuft danach offline. Keine APK, keine Build-Tools.
- **Weg B – echte APK:** mit Capacitor in eine installierbare `.apk` bauen.
- **Weg C – einzelne Standalone-Datei:** eine einzige `krachalarm.html`, die
  alles enthält. Aufs Handy kopieren und öffnen. Kein Build, keine APK.
  (Achtung: Mikrofon je nach Browser eingeschränkt – siehe unten.)

---

## Funktionen

- Live-Messung der Lautstärke in (geschätzten) dB, 0–130
- Farbskala grün → rot → lila, passend zur Lautstärke
- Bezeichnungen je Stufe (Blätterrascheln … Düsenjet)
- Grenzwert in 10-dB-Stufen einstellbar
- Alarmton wählbar: Piepton, Zweiton-Alarm, Sirene oder **eigener Sound**
- Kalibrierung, um die dB-Werte genauer zu machen
- Bildschirm bleibt während der Messung an (abschaltbar)

> **Hinweis zum Bildschirm:** In einer Web-App/PWA kann das Mikrofon **nicht**
> bei ausgeschaltetem Bildschirm messen – Android/der Browser frieren die
> Audio-Verarbeitung im Hintergrund ein. Ohne das Häkchen „Bildschirm anlassen“
> pausiert die Messung beim Schlafen und läuft beim Aufwecken weiter. Messen
> bei dunklem Bildschirm ginge nur mit einer nativen APK (Foreground-Service).

---

## Wichtig: Genauigkeit der dB-Werte

Ein Handy-Mikrofon ist kein geeichtes Messgerät. Die Werte sind eine
**Schätzung**. Über den Regler **„Kalibrierung“** (unter „Einstellungen →
Kalibrierung“) kannst du die Anzeige anpassen: Stell dein Handy neben eine
geeichte Schallpegel-App (oder ein Messgerät) und schiebe den Offset, bis die
Werte ungefähr übereinstimmen.

---

## Weg A: Als PWA aufs Handy (empfohlen)

Das Mikrofon im Browser funktioniert nur über `https` (oder `localhost`).
Deshalb wird der Inhalt des Ordners `www` einmal kostenlos gehostet – dann am
Handy öffnen und installieren. Kein Build, keine APK.

**Variante 1 – Netlify Drop (am schnellsten):**

1. https://app.netlify.com/drop öffnen.
2. Den **Ordner `www`** dort ins Fenster ziehen.
3. Du bekommst eine `https`-Adresse. Diese am Handy öffnen.
4. Mikrofon erlauben → Browser-Menü → **„Zum Startbildschirm hinzufügen“**.

**Variante 2 – GitHub Pages:**

1. Kostenloses GitHub-Repo anlegen, Inhalt von `www` hochladen.
2. In den Repo-Einstellungen **Pages** aktivieren (Branch `main`, Ordner `/`).
3. Die `https`-Adresse am Handy öffnen und „Zum Startbildschirm hinzufügen“.

Nach dem Hinzufügen verhält sich die App wie eine installierte App (eigenes
Icon, Vollbild) und läuft dank Service Worker auch offline.

**Nur lokal testen (am PC, optional):**

```bash
npm run serve          # oder:  npx serve www
```

Adresse am PC im Browser öffnen. (Im WLAN am Handy blockieren manche Browser
ohne `https` das Mikrofon – dann eine der Hosting-Varianten nehmen.)

---

## Weg C: Einzelne Standalone-Datei

Wenn du lieber **eine einzige Datei** statt eines Ordners möchtest:

```bash
npm run standalone     # erzeugt krachalarm.html im Projektordner
```

Die Datei `krachalarm.html` enthält alles (HTML, CSS, JavaScript). Kopiere sie
aufs Handy (z. B. per Kabel oder Cloud) und öffne sie im Browser.

> **Wichtig – Mikrofon bei direkt geöffneten Dateien:** Manche Browser (vor
> allem **Chrome für Android**) erlauben das Mikrofon **nicht**, wenn eine Datei
> direkt über `file://` geöffnet wird. Startet die Messung nicht, nutze
> **Weg A** (Hosting/PWA) – das ist die zuverlässigste Variante ohne APK.

Eigener Sound: über den Knopf „Datei auswählen“ in der App laden (bleibt
gespeichert). Der feste `sounds/alarm.mp3`-Weg gilt nur für die Ordner-Variante.

---

## Weg B: Echte APK mit VS Code bauen (Capacitor)

### Einmalige Voraussetzungen

1. **Node.js** installieren: https://nodejs.org (LTS-Version)
2. **Android Studio** installieren: https://developer.android.com/studio
   - Beim ersten Start das **Android SDK** installieren lassen.
   - Damit `./gradlew` ein JDK findet, ist das in Android Studio enthaltene JDK
     am einfachsten (oder `JAVA_HOME` auf ein JDK 17 setzen).

### Projekt vorbereiten (im VS-Code-Terminal, im Projektordner)

```bash
npm install
npx cap add android
npx cap sync
```

Dadurch entsteht der Ordner `android/`.

### Mikrofon-Berechtigung eintragen

Öffne `android/app/src/main/AndroidManifest.xml` und füge **innerhalb von
`<manifest>` (vor `<application>`)** diese Zeile hinzu:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### APK bauen

Variante 1 – per Kommandozeile:

```bash
npx cap sync
cd android
./gradlew assembleDebug      # Windows:  gradlew.bat assembleDebug
```

Die fertige Datei liegt dann unter:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Variante 2 – in Android Studio (komfortabler):

```bash
npx cap open android
```

Dann in Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.

### APK aufs Handy

1. `app-debug.apk` aufs Handy kopieren (USB, E-Mail, Cloud …).
2. Am Handy antippen und installieren. Dafür muss
   **„Installation aus unbekannten Quellen“** für die App erlaubt werden
   (Android fragt automatisch).
3. App öffnen, Mikrofon erlauben, „Messung starten“.

> Nach Änderungen an Dateien in `www/` jeweils erneut `npx cap sync` ausführen
> und neu bauen.

---

## Eigener Alarm-Sound

- **Direkt in der App:** „Alarm-Sound“ → „Eigener Sound“ → Datei auswählen.
- **Fest eingebaut:** Datei als `www/sounds/alarm.mp3` ablegen und in der App
  „Eigener Sound“ wählen (ohne Upload).

Empfohlene Formate: **MP3** (am besten), WAV oder OGG. Der Sound wird in einer
Schleife abgespielt, solange der Pegel über dem Grenzwert liegt – Länge ist also
egal. Details siehe `www/sounds/README.txt`.

---

## Projektstruktur

```
krachalarm/
├─ www/                      # die eigentliche App
│  ├─ index.html
│  ├─ style.css
│  ├─ app.js                 # Messung, Farben, Alarm-Logik, Töne
│  ├─ manifest.webmanifest   # PWA
│  ├─ sw.js                  # Service Worker (Offline/Installation)
│  ├─ icon.svg               # App-Icon
│  └─ sounds/                # hier optional eigenen alarm.mp3 ablegen
├─ build-standalone.js       # baut die einzelne krachalarm.html (Weg C)
├─ krachalarm.html           # erzeugte Standalone-Datei (nach npm run standalone)
├─ package.json
├─ capacitor.config.json
└─ README.md
```

---

## dB-Stufen und Farben

| dB  | Stufe             | Farbe        |
| --: | ----------------- | ------------ |
|  20 | Blätterrascheln   | grün         |
|  30 | leises Flüstern   | grün         |
|  40 | leiser Regen      | grün         |
|  50 | leises Gespräch   | grün         |
|  60 | normales Gespräch | grün→gelb    |
|  70 | lautes Gespräch   | gelb         |
|  80 | Föhn              | gelb→orange  |
|  90 | Rasenmäher        | orange       |
| 100 | Kreissäge         | orange→rot   |
| 110 | Sirene nah        | rot          |
| 120 | Schmerzgrenze     | knallrot     |
| 130 | Düsenjet          | lila         |
