#!/usr/bin/env python3
"""
cli_relay.py — Relay local pour CLI-Anything + Multi-IA Hub
Place ce fichier dans ton dossier de projet et lance-le une seule fois.

Usage:
    python cli_relay.py

Le relay tourne sur http://localhost:5678
Multi-IA Hub l'appelle automatiquement depuis l'onglet Workflows.
"""

import json
import subprocess
import shlex
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 5678

# Logiciels autorisés (sécurité — évite d'exécuter n'importe quoi)
ALLOWED_PREFIXES = [
    "cli-anything-libreoffice",
    "cli-anything-gimp",
    "cli-anything-blender",
    "cli-anything-audacity",
    "cli-anything-inkscape",
    "cli-anything-kdenlive",
    "cli-anything-shotcut",
    "cli-anything-obs",
]

class RelayHandler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        """CORS preflight"""
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/ping":
            self._respond_json(200, {"ok": True, "version": "1.0", "relay": "cli-anything", "obs": self._check_cli("cli-anything-obs"), "kdenlive": self._check_cli("cli-anything-kdenlive")})
        elif self.path == "/" or self.path == "":
            self._respond_html(200, self._homepage())
        elif self.path == "/status":
            tools = {
                "relay": True,
                "libreoffice": self._check_cli("cli-anything-libreoffice"),
                "gimp":        self._check_cli("cli-anything-gimp"),
                "blender":     self._check_cli("cli-anything-blender"),
                "obs":         self._check_cli("cli-anything-obs"),
                "kdenlive":    self._check_cli("cli-anything-kdenlive"),
                "drawio":      self._check_cli("cli-anything-drawio"),
                "inkscape":    self._check_cli("cli-anything-inkscape"),
                "audacity":    self._check_cli("cli-anything-audacity"),
            }
            self._respond_json(200, {"ok": True, "tools": tools})
        else:
            self._respond_json(404, {"error": "Route inconnue. Accède à http://localhost:5678 pour voir le statut."})

    def _check_cli(self, cmd):
        """Vérifie si un CLI CLI-Anything est installé sur le système."""
        import shutil
        return shutil.which(cmd) is not None

    def _homepage(self):
        tools_rows = ""
        import shutil
        tools = [
            ("cli-anything-libreoffice", "📄 LibreOffice", "PDF, Writer, Calc"),
            ("cli-anything-gimp",        "🎨 GIMP",        "Images, batch"),
            ("cli-anything-blender",     "🎬 Blender",     "3D, rendu"),
            ("cli-anything-obs",         "🔴 OBS Studio",  "Enregistrement"),
            ("cli-anything-kdenlive",    "🎞 Kdenlive",    "Montage vidéo"),
            ("cli-anything-drawio",      "🗺 Draw.io",     "Diagrammes"),
            ("cli-anything-inkscape",    "✏️ Inkscape",    "Vectoriel SVG"),
            ("cli-anything-audacity",    "🔊 Audacity",    "Audio"),
        ]
        for cmd, label, desc in tools:
            found = shutil.which(cmd) is not None
            color = "#4ADE80" if found else "#666674"
            status = "✅ Installé" if found else "⚪ Non installé"
            tools_rows += f"""
            <tr>
              <td style="padding:8px 12px;font-size:14px">{label}</td>
              <td style="padding:8px 12px;color:#888;font-size:13px">{desc}</td>
              <td style="padding:8px 12px;color:{color};font-weight:700;font-size:13px">{status}</td>
            </tr>"""

        return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLI-Anything Relay — Multi-IA Hub</title>
  <style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ background:#09090B; color:#F0EEE8; font-family:-apple-system,'Segoe UI',sans-serif; padding:40px 20px; }}
    .container {{ max-width:700px; margin:0 auto; }}
    .header {{ display:flex; align-items:center; gap:14px; margin-bottom:32px; }}
    .dot {{ width:14px; height:14px; border-radius:50%; background:#4ADE80; box-shadow:0 0 8px #4ADE80; animation:pulse 2s infinite; }}
    @keyframes pulse {{ 0%,100%{{opacity:1}} 50%{{opacity:.5}} }}
    h1 {{ font-size:22px; font-weight:800; color:#D4A853; }}
    .subtitle {{ font-size:13px; color:#666; margin-top:2px; }}
    .card {{ background:#18181c; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:20px; margin-bottom:16px; }}
    .card-title {{ font-size:12px; font-weight:700; color:#666; letter-spacing:.1em; text-transform:uppercase; margin-bottom:12px; font-family:monospace; }}
    table {{ width:100%; border-collapse:collapse; }}
    tr {{ border-bottom:1px solid rgba(255,255,255,.05); }}
    tr:last-child {{ border:none; }}
    .status-ok {{ background:#4ADE8010; border:1px solid rgba(74,222,128,.3); border-radius:8px; padding:12px 16px; color:#4ADE80; font-size:13px; display:flex; align-items:center; gap:10px; }}
    .info {{ background:#60A5FA0A; border:1px solid rgba(96,165,250,.2); border-radius:8px; padding:12px 16px; font-size:12px; color:#888; line-height:1.7; }}
    code {{ background:#222; padding:2px 7px; border-radius:4px; font-family:monospace; color:#D4A853; font-size:11px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="dot"></div>
      <div>
        <h1>CLI-Anything Relay</h1>
        <div class="subtitle">Multi-IA Hub · http://localhost:5678 · Version 1.0</div>
      </div>
    </div>

    <div class="status-ok">
      ✅ Le relay fonctionne ! Multi-IA Hub peut maintenant communiquer avec tes logiciels locaux.
    </div>

    <br>

    <div class="card">
      <div class="card-title">🖥 Logiciels CLI détectés</div>
      <table>
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,.1)">
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#666">Logiciel</th>
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#666">Utilisation</th>
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#666">Statut</th>
          </tr>
        </thead>
        <tbody>{tools_rows}</tbody>
      </table>
    </div>

    <div class="info">
      <strong style="color:#F0EEE8">Comment installer un pilote CLI (100% gratuit) ?</strong><br>
      1. Installe le logiciel si besoin (ex: OBS) :<br>
      &nbsp;&nbsp;&nbsp;<code>winget install OBSProject.OBSStudio</code><br>
      2. Clone le repo CLI-Anything (une seule fois pour tous les logiciels) :<br>
      &nbsp;&nbsp;&nbsp;<code>git clone https://github.com/HKUDS/CLI-Anything.git</code><br>
      3. Installe le pilote du logiciel voulu :<br>
      &nbsp;&nbsp;&nbsp;<code>cd CLI-Anything/obs-studio/agent-harness &amp;&amp; pip install -e .</code><br>
      4. Recharge cette page — le logiciel apparaîtra en vert ✅<br><br>
      ⚡ Pas besoin de Claude Code ni de payer quoi que ce soit.<br>
      Consulte l'onglet <strong style="color:#D4A853">❓ Aide</strong> dans Multi-IA Hub pour le guide complet.<br>
      Consulte l'onglet <strong style="color:#D4A853">❓ Aide</strong> dans Multi-IA Hub pour le guide complet.
    </div>
  </div>
</body>
</html>"""

    def do_POST(self):
        if self.path == "/execute":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                command = data.get("command", "").strip()
                software = data.get("software", "")

                # Sécurité : vérifie que la commande commence par un CLI autorisé
                allowed = any(command.startswith(p) for p in ALLOWED_PREFIXES)
                if not allowed:
                    self._respond(400, {"error": f"Commande non autorisée. Préfixes valides : {ALLOWED_PREFIXES}"})
                    return

                print(f"[CLI-Relay] Exécution : {command}")

                # Exécute la commande
                result = subprocess.run(
                    shlex.split(command),
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                output = result.stdout or result.stderr or "Commande exécutée (pas de sortie)"
                ok = result.returncode == 0

                response = {
                    "ok": ok,
                    "output": output,
                    "returncode": result.returncode,
                    "command": command,
                }
                self._respond(200 if ok else 500, response)
                print(f"[CLI-Relay] ✅ OK returncode={result.returncode}")

            except subprocess.TimeoutExpired:
                self._respond(408, {"error": "Timeout — commande trop longue (>60s)"})
            except FileNotFoundError as e:
                self._respond(404, {
                    "error": f"CLI non trouvé : {e}",
                    "help": "Lance d'abord dans Claude Code : /cli-anything:cli-anything <logiciel>  puis pip install -e ."
                })
            except Exception as e:
                self._respond(500, {"error": str(e)})
        else:
            self._respond(404, {"error": "Route inconnue"})

    def _respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _respond_json(self, status, data):
        self._respond(status, data)

    def _respond_html(self, status, html):
        body = html.encode('utf-8')
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format, *args):
        pass  # Silence les logs HTTP natifs

if __name__ == "__main__":
    print(f"""
╔══════════════════════════════════════════════════════╗
║  CLI-Anything Relay — Multi-IA Hub                   ║
║  http://localhost:{PORT}                               ║
║                                                      ║
║  CLIs reconnus :                                     ║
║  • cli-anything-libreoffice  (PDF, Writer, Calc)     ║
║  • cli-anything-gimp         (images)                ║
║  • cli-anything-blender      (3D, rendu)             ║
║  • cli-anything-audacity     (audio)                 ║
║  • cli-anything-inkscape     (SVG)                   ║
║  • cli-anything-kdenlive     (vidéo)                 ║
║                                                      ║
║  Installe un CLI avec Claude Code :                  ║
║  /cli-anything:cli-anything ./libreoffice                         ║
║  cd libreoffice/agent-harness && pip install -e .    ║
║                                                      ║
║  Ctrl+C pour arrêter                                 ║
╚══════════════════════════════════════════════════════╝
""")
    server = HTTPServer(("localhost", PORT), RelayHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[CLI-Relay] Arrêté.")
