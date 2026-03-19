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

# ── Config locale (relay_config.json dans le même dossier) ──────
import os, pathlib
_CONFIG_PATH = pathlib.Path(__file__).parent / "relay_config.json"
_CFG = {"obs_host":"localhost","obs_port":4455,"obs_password":""}
if _CONFIG_PATH.exists():
    try:
        with open(_CONFIG_PATH) as _f:
            _CFG.update(json.load(_f))
    except Exception:
        pass


# Logiciels autorisés (sécurité — évite d'exécuter n'importe quoi)
ALLOWED_PREFIXES = [
    "cli-anything-libreoffice",
    "cli-anything-gimp",
    "cli-anything-blender",
    "cli-anything-audacity",
    "cli-anything-inkscape",
    "cli-anything-kdenlive",
    "cli-anything-shotcut",
    "cli-anything-obs-studio",   # cli-anything-obs-studio PAS cli-anything-obs
    "cli-anything-drawio",
    "cli-anything-comfyui",
    "cli-anything-mermaid",
    "cli-anything-zoom",
]

class RelayHandler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        """CORS preflight"""
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/ping":
            self._respond_json(200, {"ok": True, "version": "1.0", "relay": "cli-anything", "obs": self._check_cli("cli-anything-obs-studio"), "kdenlive": self._check_cli("cli-anything-kdenlive"), "browseruse": self._check_browseruse()})
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
        """Vérifie si un CLI CLI-Anything est installé — robuste sur Windows."""
        import shutil, subprocess, os, sys
        if shutil.which(cmd):
            return True
        # Fallback pip show
        try:
            r = subprocess.run(["pip", "show", cmd], capture_output=True, timeout=5)
            if r.returncode == 0:
                return True
        except Exception:
            pass
        # Fallback Scripts Windows
        scripts_dirs = [
            os.path.join(os.path.dirname(sys.executable), "Scripts"),
            os.path.join(os.path.expanduser("~"), "AppData", "Local", "Programs", "Python", "Python312", "Scripts"),
            os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "Python", "Python312", "Scripts"),
        ]
        for d in scripts_dirs:
            if os.path.exists(os.path.join(d, cmd + ".exe")):
                return True
        return False

    def _homepage(self):
        import shutil

        # Build tool rows
        rows = []
        for cmd, label, desc, folder in [
            ("cli-anything-libreoffice", "&#128196; LibreOffice", "PDF, Writer, Calc",  "libreoffice"),
            ("cli-anything-gimp",        "&#127912; GIMP",        "Images, retouche",   "gimp"),
            ("cli-anything-blender",     "&#127909; Blender",     "3D, rendu",          "blender"),
            ("cli-anything-obs-studio",  "&#128308; OBS Studio",  "Enregistrement",     "obs-studio"),
            ("cli-anything-kdenlive",    "&#127902; Kdenlive",    "Montage video",      "kdenlive"),
            ("cli-anything-drawio",      "&#128506; Draw.io",     "Diagrammes",         "drawio"),
            ("cli-anything-inkscape",    "&#9999; Inkscape",      "Vectoriel SVG",      "inkscape"),
            ("cli-anything-audacity",    "&#128266; Audacity",    "Audio",              "audacity"),
            ("cli-anything-comfyui",     "&#11041; ComfyUI",      "Images IA locale",   "comfyui"),
            ("cli-anything-mermaid",     "&#128202; Mermaid",     "Diagrammes texte",   "mermaid"),
            ("cli-anything-shotcut",     "&#127910; Shotcut",     "Montage video alt.", "shotcut"),
        ]:
            found  = shutil.which(cmd) is not None
            color  = "#4ADE80" if found else "#F87171"
            status = "OK" if found else "non installe"
            badge  = ("background:#4ADE8020;color:#4ADE80;border:1px solid #4ADE8040"
                      if found else
                      "background:#F8717120;color:#F87171;border:1px solid #F8717140")
            cd_cmd  = "cd C:/Users/Administrateur/CLI-Anything/" + folder + "/agent-harness"
            pip_cmd = "pip install -e ."
            rows.append(
                "<tr>"
                "<td style='padding:10px 12px;font-size:13px'>" + label + "</td>"
                "<td style='padding:10px 12px;color:#888;font-size:11px'>" + desc + "</td>"
                "<td style='padding:10px 12px'>"
                  "<span style='font-size:9px;padding:2px 8px;border-radius:4px;" + badge + "'>" + status + "</span>"
                "</td>"
                "<td style='padding:10px 12px'>"
                  "<div style='display:flex;flex-direction:column;gap:4px'>"
                    "<div style='display:flex;align-items:center;gap:6px'>"
                      "<code style='font-size:10px;background:#1a1a1e;padding:3px 8px;border-radius:4px;color:#D4A853;flex:1'>" + cd_cmd + "</code>"
                      "<button onclick=\"navigator.clipboard.writeText('" + cd_cmd + "');this.textContent='Copie!';setTimeout(()=>this.textContent='Copier',1200)\" "
                        "style='font-size:9px;padding:3px 8px;background:#D4A85320;border:1px solid #D4A85340;border-radius:4px;color:#D4A853;cursor:pointer;white-space:nowrap'>Copier</button>"
                    "</div>"
                    "<div style='display:flex;align-items:center;gap:6px'>"
                      "<code style='font-size:10px;background:#1a1a1e;padding:3px 8px;border-radius:4px;color:#4ADE80;flex:1'>" + pip_cmd + "</code>"
                      "<button onclick=\"navigator.clipboard.writeText('" + pip_cmd + "');this.textContent='Copie!';setTimeout(()=>this.textContent='Copier',1200)\" "
                        "style='font-size:9px;padding:3px 8px;background:#4ADE8020;border:1px solid #4ADE8040;border-radius:4px;color:#4ADE80;cursor:pointer;white-space:nowrap'>Copier</button>"
                    "</div>"
                  "</div>"
                "</td>"
                "</tr>"
            )
        tools_rows = "".join(rows)

        parts = [
            "<!DOCTYPE html><html lang='fr'><head>",
            "<meta charset='UTF-8'>",
            "<meta name='viewport' content='width=device-width,initial-scale=1'>",
            "<title>CLI-Anything Relay</title>",
            "<style>",
            "*{margin:0;padding:0;box-sizing:border-box}",
            "body{background:#09090B;color:#F0EEE8;font-family:-apple-system,'Segoe UI',sans-serif;padding:32px 20px}",
            ".wrap{max-width:980px;margin:0 auto}",
            ".hdr{display:flex;align-items:center;gap:12px;margin-bottom:24px}",
            ".dot{width:13px;height:13px;border-radius:50%;background:#4ADE80;box-shadow:0 0 8px #4ADE80;animation:p 2s infinite}",
            "@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}",
            "h1{font-size:20px;font-weight:800;color:#D4A853}",
            ".sub{font-size:12px;color:#555;margin-top:2px}",
            ".ok{background:#4ADE8010;border:1px solid #4ADE8030;border-radius:8px;padding:11px 15px;color:#4ADE80;font-size:13px;margin-bottom:18px}",
            ".card{background:#18181c;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:18px;margin-bottom:14px}",
            ".ctitle{font-size:10px;font-weight:700;color:#555;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;font-family:monospace}",
            "table{width:100%;border-collapse:collapse}",
            "tr{border-bottom:1px solid rgba(255,255,255,.05)}",
            "tr:last-child{border:none}",
            "th{padding:6px 12px;text-align:left;font-size:10px;color:#555;font-weight:600}",
            ".info{background:#60A5FA0A;border:1px solid rgba(96,165,250,.2);border-radius:8px;padding:14px;font-size:12px;color:#888;line-height:2}",
            "strong{color:#F0EEE8}",
            "code{background:#1a1a1e;padding:2px 7px;border-radius:4px;font-family:monospace;color:#D4A853;font-size:11px}",
            "button:hover{opacity:.8}",
            "</style></head><body><div class='wrap'>",
            "<div class='hdr'><div class='dot'></div><div>",
            "<h1>CLI-Anything Relay</h1>",
            "<div class='sub'>Multi-IA Hub &bull; http://localhost:5678 &bull; Recharge pour voir les nouveaux installs</div>",
            "</div></div>",
            "<div class='ok'>&#10003; Relay actif &mdash; Multi-IA Hub peut piloter tes logiciels locaux</div>",
            "<div class='card'>",
            "<div class='ctitle'>&#128187; Logiciels CLI-Anything</div>",
            "<table><thead><tr>",
            "<th>Logiciel</th><th>Usage</th><th>Statut</th><th>Commandes PowerShell (1 clic = copier)</th>",
            "</tr></thead><tbody>",
            tools_rows,
            "</tbody></table></div>",
            "<div class='info'>",
            "<strong>&#9889; Procedure d'installation (2 etapes)</strong><br>",
            "1. Copie la commande <code>cd ...</code> &rarr; colle dans PowerShell &rarr; Entree<br>",
            "2. Copie la commande <code>pip install -e .</code> &rarr; colle dans PowerShell &rarr; Entree<br>",
            "3. Recharge cette page &rarr; le logiciel passe en vert<br><br>",
            "<strong>Pas encore clone le repo ?</strong> Une seule fois :<br>",
            "<code>git clone https://github.com/HKUDS/CLI-Anything.git C:/Users/Administrateur/CLI-Anything</code>",
            "</div></div></body></html>",
        ]
        return "".join(parts)

    def do_POST(self):
        if self.path == "/obs/record/start":
            self._obs_record("start")
        elif self.path == "/obs/record/stop":
            self._obs_record("stop")
        elif self.path == "/navigate":
            self._browseruse_navigate()
        elif self.path == "/execute":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                command = data.get("command", "").strip()
                software = data.get("software", "")

                # Sécurité : vérifie que la commande commence par un CLI autorisé
                allowed = any(command.startswith(p) for p in ALLOWED_PREFIXES)
                if not allowed:
                    self._respond_json(400, {"error": f"Commande non autorisée. Préfixes valides : {ALLOWED_PREFIXES}"})
                    return

                print(f"[CLI-Relay] Exécution : {command}")

                result = subprocess.run(
                    shlex.split(command),
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                output = result.stdout or result.stderr or "Commande exécutée (pas de sortie)"
                ok = result.returncode == 0
                self._respond_json(200 if ok else 500, {
                    "ok": ok,
                    "output": output,
                    "returncode": result.returncode,
                    "command": command,
                })
                print(f"[CLI-Relay] returncode={result.returncode}")

            except subprocess.TimeoutExpired:
                self._respond_json(408, {"error": "Timeout — commande trop longue (>60s)"})
            except FileNotFoundError as e:
                self._respond_json(404, {
                    "error": f"CLI non trouvé : {e}",
                    "help": "Lance : cd CLI-Anything/<logiciel>/agent-harness && pip install -e ."
                })
            except Exception as e:
                self._respond_json(500, {"error": str(e)})
        else:
            self._respond_json(404, {"error": "Route inconnue. Accède à http://localhost:5678 pour voir le statut."})

    def _obs_record(self, action):
        """Démarre ou arrête l'enregistrement OBS via WebSocket."""
        try:
            import obsws_python as obs
            kwargs = {"host": _CFG["obs_host"], "port": _CFG["obs_port"], "timeout": 5}
            if _CFG.get("obs_password"):
                kwargs["password"] = _CFG["obs_password"]
            cl = obs.ReqClient(**kwargs)
            if action == "start":
                cl.start_record()
                self._respond_json(200, {"ok": True, "action": "start", "msg": "OBS enregistrement démarré"})
            else:
                cl.stop_record()
                self._respond_json(200, {"ok": True, "action": "stop", "msg": "OBS enregistrement arrêté"})
            cl.disconnect()
        except ImportError:
            self._respond_json(503, {"ok": False, "error": "obsws-python non installé", "fix": "pip install obsws-python"})
        except Exception as e:
            self._respond_json(503, {"ok": False, "error": str(e), "fix": "Vérifie que OBS est ouvert et WebSocket activé : Outils → WebSocket Server → port 4455"})

    def _check_browseruse(self):
        """Vérifie si browser-use est installé."""
        import shutil, importlib.util
        # Vérifie via pip (importlib) ou via uvx
        try:
            if importlib.util.find_spec("browser_use") is not None:
                return True
        except Exception:
            pass
        # Vérifie si browser-use est dispo via uvx
        if shutil.which("browser-use") or shutil.which("uvx"):
            import subprocess
            try:
                result = subprocess.run(
                    ["python", "-c", "import browser_use"],
                    capture_output=True, timeout=5
                )
                if result.returncode == 0:
                    return True
            except Exception:
                pass
        return False

    def _browseruse_navigate(self):
        """Lance Browser-Use pour naviguer — utilise browser_use.llm.ChatOllama (dataclass)."""
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
            url = data.get("url", "")
            script = data.get("script", "")
            if not url:
                self._respond_json(400, {"ok": False, "error": "URL manquante"})
                return

            import threading
            def run_browseruse():
                try:
                    import asyncio
                    # IMPORTANT: importer depuis browser_use.llm, PAS langchain_ollama
                    from browser_use import Agent
                    from browser_use.llm import ChatOllama
                    # Force l'host Ollama explicitement
                    import subprocess as _sp
                    _models = _sp.run(["ollama","list"], capture_output=True, text=True).stdout
                    model_name = "llama3.2"
                    if "qwen2.5:7b" in _models: model_name = "qwen2.5:7b"
                    elif "mistral" in _models: model_name = "mistral"
                    elif "llama3" in _models: model_name = "llama3"
                    print(f"[Browser-Use] Modèle : {model_name}")
                    llm = ChatOllama(model=model_name, host="http://localhost:11434")

                    task = (
                        f"Tu dois naviguer vers cette URL EXACTE : {url}\n"
                        f"NE cherche pas d'autres sites. Ouvre exactement : {url}\n"
                        f"Ensuite démontre les fonctionnalités : {script[:200]}"
                    )

                    # Connexion à Brave existant (clés déjà configurées)
                    # Lance Brave avec : brave.exe --remote-debugging-port=9222
                    from browser_use.browser.profile import BrowserProfile
                    from browser_use.browser.session import BrowserSession
                    try:
                        profile = BrowserProfile(cdp_url="http://localhost:9222")
                        session = BrowserSession(browser_profile=profile)
                        agent = Agent(task=task, llm=llm, browser_session=session)
                        print("[Browser-Use] Connecté à Brave existant via CDP")
                    except Exception:
                        # Fallback : nouvelle instance
                        agent = Agent(task=task, llm=llm)
                        print("[Browser-Use] Nouvelle instance (Brave CDP non disponible)")
                    async def go():
                        agent = Agent(task=task, llm=llm)
                        await agent.run()
                    asyncio.run(go())
                except Exception as e:
                    print(f"[Browser-Use] Erreur : {e}")

            threading.Thread(target=run_browseruse, daemon=True).start()
            self._respond_json(200, {"ok": True, "msg": "Browser-Use lancé via Ollama"})
        except Exception as e:
            self._respond_json(500, {"ok": False, "error": str(e)})

    def _respond_json(self, status, data):
        self._respond(status, data)

    def _respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        try:
            self.send_response(status)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", len(body))
            self.end_headers()
            self.wfile.write(body)
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            # Brave/Chrome Shields coupe la connexion — normal, on ignore
            pass

    def _respond_html(self, status, html):
        body = html.encode('utf-8')
        try:
            self.send_response(status)
            self._cors()
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", len(body))
            self.end_headers()
            self.wfile.write(body)
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

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
