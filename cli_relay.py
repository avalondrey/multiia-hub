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
            self._respond(200, {"ok": True, "version": "1.0", "relay": "cli-anything"})
        else:
            self._respond(404, {"error": "Route inconnue"})

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
                    "help": "Lance d'abord : /cli-anything <logiciel> puis pip install -e ."
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
║  /cli-anything ./libreoffice                         ║
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
