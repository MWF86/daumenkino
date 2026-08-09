#!/bin/bash
# Richtet das Repository ein und schiebt es zu GitHub.
# Aufruf:  bash einrichten.sh
set -e

echo
echo "  Daumenkino auf GitHub einrichten"
echo "  --------------------------------"
echo

read -rp "  Dein GitHub-Benutzername [MWF86]: " KONTO
KONTO=${KONTO:-MWF86}

read -rp "  Name des Repositorys [daumenkino]: " REPO
REPO=${REPO:-daumenkino}

echo
echo "  Die Programmdateien sind rund 130 MB groß. GitHub erlaubt bis 2 GB"
echo "  je Datei, das passt. Anhänge an eine Veröffentlichung sind bei einem"
echo "  öffentlichen Repository für jeden herunterladbar."
echo
read -rp "  Repository öffentlich anlegen? [j/N]: " OEFFENTLICH

# 1 Kennungen eintragen
python3 - "$KONTO" "$REPO" <<'PY'
import json, sys, pathlib
konto, repo = sys.argv[1], sys.argv[2]
p = pathlib.Path("package.json"); d = json.loads(p.read_text(encoding="utf-8"))
d["repository"] = {"type": "git", "url": f"https://github.com/{konto}/{repo}.git"}
d["build"]["publish"] = [{"provider": "github", "owner": konto, "repo": repo}]
p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"  package.json zeigt jetzt auf {konto}/{repo}")
PY

# 2 Versionsverwaltung
if [ ! -d .git ]; then
  git init -q
  git branch -M main
fi
git add -A
git commit -q -m "Daumenkino 1.1.0: Poppins, Schriftwahl, Serienexport in einen Ordner, Aktualisierung" || echo "  nichts Neues zu sichern"

# 3 Repository anlegen, wenn die GitHub-Befehlszeile da ist
if command -v gh >/dev/null 2>&1; then
  SICHTBAR="--private"
  case "$OEFFENTLICH" in [jJyY]*) SICHTBAR="--public";; esac
  echo "  Lege $KONTO/$REPO an ..."
  gh repo create "$KONTO/$REPO" $SICHTBAR --source=. --remote=origin --push
  echo
  echo "  Fertig. Erste Veröffentlichung auslösen:"
  echo "      npm version patch && git push --follow-tags"
else
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$KONTO/$REPO.git"
  echo
  echo "  Die GitHub-Befehlszeile (gh) ist nicht installiert."
  echo "  Lege das Repository von Hand an unter https://github.com/new"
  echo "  Name: $REPO"
  echo
  echo "  Danach:"
  echo "      git push -u origin main"
  echo "      npm version patch && git push --follow-tags"
fi

echo
echo "  Ein Zugriffstoken brauchst du nicht: Der Ablauf in"
echo "  .github/workflows/veroeffentlichen.yml benutzt das Token, das"
echo "  GitHub jedem Lauf ohnehin mitgibt."
echo
