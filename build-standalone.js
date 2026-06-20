/*
 * Baut aus www/index.html + style.css + app.js eine einzige,
 * in sich geschlossene Datei: krachalarm.html
 *
 * Aufruf:  node build-standalone.js   (oder: npm run standalone)
 */
const fs = require("fs");
const path = require("path");

const wwwDir = path.join(__dirname, "www");
const read = (f) => fs.readFileSync(path.join(wwwDir, f), "utf8");

let html = read("index.html");
const css = read("style.css");
const js = read("app.js");

// CSS einbetten
html = html.replace(
  /<link rel="stylesheet" href="style\.css" \/>/,
  `<style>\n${css}\n</style>`
);

// JavaScript einbetten
html = html.replace(
  /<script src="app\.js"><\/script>/,
  `<script>\n${js}\n</script>`
);

// Verweise, die als Einzeldatei nicht funktionieren, entfernen
html = html.replace(/\s*<link rel="manifest"[^>]*>/g, "");
html = html.replace(/\s*<link rel="icon"[^>]*>/g, "");
html = html.replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, "");
// Service-Worker-Registrierung deaktivieren (braucht separate Datei)
html = html.replace(
  /if \("serviceWorker" in navigator\) \{[\s\S]*?\n\}/,
  "/* Service Worker in der Standalone-Datei nicht verfuegbar */"
);

const out = path.join(__dirname, "krachalarm.html");
fs.writeFileSync(out, html);

const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`Erstellt: krachalarm.html (${kb} KB)`);
