// Schmale Bruecke zwischen Programm und Anwendung. Nur diese vier Dinge
// sind vom Fenster aus erreichbar, sonst nichts.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("daumenkino", {
  istElectron: true,
  einzelSpeichern: (name, dataUrl) => ipcRenderer.invoke("einzel-speichern", name, dataUrl),
  ordnerWaehlen: () => ipcRenderer.invoke("ordner-waehlen"),
  inOrdner: (ordner, name, dataUrl) => ipcRenderer.invoke("in-ordner", ordner, name, dataUrl),
  ordnerOeffnen: (ordner) => ipcRenderer.invoke("ordner-oeffnen", ordner)
});
