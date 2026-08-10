const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------- Fassung
// wird von bauen.js beim Zusammenstellen geschrieben
let FASSUNG = { name: "Daumenkino", variante: "neutral", kanal: "latest" };
try { FASSUNG = require("./fassung.json"); } catch (e) {}

let fenster;

function bauen() {
  fenster = new BrowserWindow({
    width: 1440, height: 900, minWidth: 380, minHeight: 560,
    backgroundColor: "#0e131a",
    title: FASSUNG.name,
    // Normale Titelleiste: mit der versteckten lagen die Ampel-Knoepfe
    // ueber dem Schriftzug der Anwendung.
    titleBarStyle: "default",
    icon: path.join(__dirname, "icons", process.platform === "win32" ? "icon.ico" : "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  fenster.loadFile(path.join(__dirname, "app", "index.html"));
  fenster.once("ready-to-show", () => fenster.show());
  fenster.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}

/* ---------------------------------------------------------------- Speichern
   Der Grund, warum es dieses Programm neben der Webfassung gibt: eine ganze
   Serie landet mit einer einzigen Rueckfrage in einem Ordner, statt als
   dreissig einzelne Downloads. */

function ausDataUrl(dataUrl) {
  return Buffer.from(String(dataUrl).replace(/^data:image\/\w+;base64,/, ""), "base64");
}

function sicherName(name) {
  return String(name).replace(/[/\\:*?"<>|]/g, "_").slice(0, 120) || "folie.png";
}

ipcMain.handle("einzel-speichern", async (_e, name, dataUrl) => {
  const pdf = /\.pdf$/i.test(name);
  const { canceled, filePath } = await dialog.showSaveDialog(fenster, {
    title: pdf ? "Druck-PDF speichern" : "Folie speichern",
    defaultPath: sicherName(name),
    filters: [pdf ? { name: "PDF", extensions: ["pdf"] } : { name: "PNG-Bild", extensions: ["png"] }]
  });
  if (canceled || !filePath) return false;
  await fs.promises.writeFile(filePath, ausDataUrl(dataUrl));
  return true;
});

ipcMain.handle("ordner-waehlen", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(fenster, {
    title: "Ordner für die Serie wählen",
    buttonLabel: "Hierhin speichern",
    properties: ["openDirectory", "createDirectory"]
  });
  return canceled || !filePaths.length ? null : filePaths[0];
});

ipcMain.handle("in-ordner", async (_e, ordner, name, dataUrl) => {
  if (!ordner) return false;
  await fs.promises.writeFile(path.join(ordner, sicherName(name)), ausDataUrl(dataUrl));
  return true;
});

ipcMain.handle("ordner-oeffnen", async (_e, ordner) => {
  if (ordner) shell.openPath(ordner);
  return true;
});

/* ---------------------------------------------------------------- Aktualisierung
   Ohne diesen Teil rottet jede ausgelieferte Kopie vor sich hin: ein Fehler,
   den ich spaeter behebe, erreicht niemanden mehr. Der Feed steht in
   package.json unter build.publish. Fehlt er, passiert hier einfach nichts. */

let updater = null;

function updaterHolen() {
  if (updater) return updater;
  if (!app.isPackaged) return null;
  if (!fs.existsSync(path.join(process.resourcesPath, "app-update.yml"))) return null;
  try { updater = require("electron-updater").autoUpdater; } catch (e) { return null; }
  if (FASSUNG.kanal) updater.channel = FASSUNG.kanal;
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.on("update-downloaded", info => {
    dialog.showMessageBox(fenster, {
      type: "info",
      title: FASSUNG.name,
      message: "Eine neue Fassung ist bereit",
      detail: "Fassung " + info.version + " wurde geladen. Beim nächsten Start ist sie aktiv.",
      buttons: ["Jetzt neu starten", "Später"],
      defaultId: 0, cancelId: 1
    }).then(r => { if (r.response === 0) updater.quitAndInstall(); });
  });
  updater.on("error", () => {});
  return updater;
}

function aufAktualisierungPruefen(vonHand) {
  const u = updaterHolen();
  if (!u) {
    if (vonHand) dialog.showMessageBox(fenster, {
      type: "info", title: FASSUNG.name,
      message: "Keine Aktualisierungsquelle eingerichtet",
      detail: "Diese Fassung holt sich keine Neuerungen selbst. Das lässt sich in package.json unter build.publish einrichten.",
      buttons: ["Schließen"]
    });
    return;
  }
  u.checkForUpdates().then(r => {
    if (vonHand && !r) dialog.showMessageBox(fenster, {
      type: "info", title: FASSUNG.name, message: "Alles aktuell.", buttons: ["Schließen"]
    });
  }).catch(err => {
    if (vonHand) dialog.showMessageBox(fenster, {
      type: "warning", title: FASSUNG.name,
      message: "Die Prüfung hat nicht geklappt",
      detail: String(err && err.message || err), buttons: ["Schließen"]
    });
  });
}

/* ---------------------------------------------------------------- Menü */

const menue = Menu.buildFromTemplate([
  ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
  { label: "Datei", submenu: [
      { label: "Neues Fenster", accelerator: "CmdOrCtrl+N", click: bauen },
      { type: "separator" },
      process.platform === "darwin" ? { role: "close", label: "Schließen" } : { role: "quit", label: "Beenden" }
  ]},
  { label: "Bearbeiten", submenu: [
      { role: "undo", label: "Widerrufen" }, { role: "redo", label: "Wiederholen" }, { type: "separator" },
      { role: "cut", label: "Ausschneiden" }, { role: "copy", label: "Kopieren" },
      { role: "paste", label: "Einsetzen" }, { role: "selectAll", label: "Alles auswählen" }
  ]},
  { label: "Ansicht", submenu: [
      { role: "resetZoom", label: "Normale Größe" }, { role: "zoomIn", label: "Größer" },
      { role: "zoomOut", label: "Kleiner" }, { type: "separator" },
      { role: "togglefullscreen", label: "Vollbild" }
  ]},
  { label: "Hilfe", submenu: [
      { label: "Nach Aktualisierung suchen", click: () => aufAktualisierungPruefen(true) },
      { type: "separator" },
      { label: "Über " + FASSUNG.name, click: () => dialog.showMessageBox(fenster, {
          type: "info", title: FASSUNG.name, message: FASSUNG.name + " " + app.getVersion(),
          detail: "Karussells für Instagram bauen.\n\nEs wird nichts hochgeladen. Alle Daten bleiben auf diesem Gerät.\n\n" +
                  "Enthält html2canvas (MIT) und die Schrift Poppins (SIL Open Font License 1.1).",
          buttons: ["Schließen"] }) }
  ]}
]);

app.whenReady().then(() => {
  Menu.setApplicationMenu(menue);
  bauen();
  setTimeout(() => aufAktualisierungPruefen(false), 4000);
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) bauen(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
