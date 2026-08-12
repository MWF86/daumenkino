# Daumenkino

Werkzeug für Instagram-Karussells. Läuft im Browser oder als Programm für
macOS und Windows. Ohne Konto, ohne Cloud, ohne Internetverbindung. Es wird
nichts hochgeladen.

## Eine Fassung, eine Quelle

| | |
|---|---|
| Programmname | Daumenkino |
| Kennung | `de.moritzfingerle.daumenkino` |
| Aktualisierungskanal | `latest` |

Eigene Markenfarben stellt man in der Anwendung selbst ein oder bringt sie
über eine Vorlagendatei mit.

## Loslegen

```bash
npm install
npm start
```

## Bauen

```bash
npm run bau:mac
npm run bau:win
```

Ergebnis in `fertig/`. Ein macOS-Programm lässt sich nur auf einem Mac
erzeugen, Windows geht auch vom Mac aus.

## Veröffentlichen

```bash
npm version patch
git push --follow-tags
```

GitHub baut daraufhin die Programme für macOS und Windows und hängt sie an
eine Veröffentlichung. Die bereits ausgelieferten Programme prüfen vier
Sekunden nach dem Start, ob es etwas Neues gibt, laden es im Hintergrund und
fragen einmal, ob neu gestartet werden soll.

**Ohne diesen Schritt bleibt jede ausgelieferte Kopie für immer auf dem Stand
des Tages, an dem sie weitergegeben wurde.**

## Signaturen

Es wird nicht signiert. Beim ersten Start meldet macOS „nicht überprüft" und
Windows zeigt SmartScreen. Beides lässt sich einmalig wegklicken, Anleitung in
`BAUEN.txt`.

Ein Apple-Zertifikat kostet 99 USD im Jahr und beseitigt die Meldung auf dem
Mac. Für Windows lohnt es kaum: SmartScreen entscheidet nach Ruf, nicht nach
Zertifikat, und Ruf entsteht erst über Downloadzahlen.

## Aufbau

```
main.js       Fenster, Menü, Speichern-Dialoge, Aktualisierung
preload.js    die vier Funktionen, die das Fenster benutzen darf
bauen.js      stellt app/ und icons/ aus quelle/ zusammen, startet den Bau
quelle/       die Anwendung und der Symbolsatz
```

`app/`, `icons/` und `fassung.json` werden erzeugt und sind nicht versioniert.

## Die Anwendung ändern

Nicht in `quelle/` arbeiten. Die Originale liegen in `SoMe/App/Quelle/`.
Dort ändern, dann `python3 Quelle/verteilen.py`, das schreibt auch die
Kopien hier neu.

## Fremde Bestandteile

- [html2canvas](https://github.com/niklasvh/html2canvas) 1.4.1, MIT-Lizenz
- [Poppins](https://github.com/itfoundry/Poppins), SIL Open Font License 1.1
