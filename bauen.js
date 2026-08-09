#!/usr/bin/env node
/* Stellt die gewaehlte Fassung zusammen und startet electron-builder.
 *
 *   node bauen.js fdp mac
 *   node bauen.js neutral win
 *   node bauen.js fdp --nur-vorbereiten     (nur app/ und icons/ fuellen)
 *
 * Es gibt bewusst nur eine Quelle je Fassung, in quelle/. Alles andere
 * wird daraus erzeugt, damit die beiden Fassungen nicht wieder
 * auseinanderlaufen. */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const FASSUNGEN = {
  fdp: { name: "Daumenkino FDP", variante: "fdp", appId: "de.moritzfingerle.daumenkino.fdp",
         kanal: "fdp", html: "quelle/fdp.html", icons: "quelle/icons-fdp" },
  neutral: { name: "Daumenkino", variante: "neutral", appId: "de.moritzfingerle.daumenkino",
             kanal: "latest", html: "quelle/neutral.html", icons: "quelle/icons-neutral" }
};

const arg = process.argv.slice(2);
const welche = arg[0];
const ziel = arg.find(a => ["mac", "win", "linux"].includes(a));
const nurVorbereiten = arg.includes("--nur-vorbereiten");

const f = FASSUNGEN[welche];
if (!f) {
  console.error("Aufruf: node bauen.js <fdp|neutral> <mac|win|linux>");
  process.exit(1);
}

const hier = __dirname;
const kopieren = (von, nach) => fs.cpSync(path.join(hier, von), path.join(hier, nach), { recursive: true });
const weg = p => fs.rmSync(path.join(hier, p), { recursive: true, force: true });

// 1 app/ aus der Quelle fuellen
weg("app");
fs.mkdirSync(path.join(hier, "app"), { recursive: true });
fs.copyFileSync(path.join(hier, f.html), path.join(hier, "app", "index.html"));
kopieren(f.icons, "app/icons");

// 2 Programmsymbole
weg("icons");
kopieren(f.icons, "icons");

// 3 Fassung festhalten, main.js liest das zur Laufzeit
fs.writeFileSync(path.join(hier, "fassung.json"), JSON.stringify({ name: f.name, variante: f.variante, kanal: f.kanal }, null, 2));

console.log("Fassung »" + f.variante + "« vorbereitet.");
if (nurVorbereiten || !ziel) {
  if (!ziel && !nurVorbereiten) console.log("Kein Ziel angegeben, es wurde nur vorbereitet.");
  process.exit(0);
}

// 4 electron-builder mit angepasster Kennung starten
// Getrennte Kanaele, damit sich die beiden Fassungen im selben Repository
// nicht gegenseitig die Aktualisierungsdatei ueberschreiben.
const durchreichen = arg.filter(a => a.startsWith("--publish") || a === "always" || a === "never");
const befehl = ["electron-builder", "--" + ziel,
  "-c.appId=" + f.appId, "-c.productName=" + f.name, "-c.publish.channel=" + f.kanal,
  ...durchreichen.filter(a => a !== welche && a !== ziel)];
console.log("  " + befehl.join(" "));
const r = spawnSync("npx", befehl, { stdio: "inherit", cwd: hier, shell: process.platform === "win32" });
process.exit(r.status === null ? 1 : r.status);
