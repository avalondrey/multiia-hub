#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_aide_tab.py
=================
Corrige App.jsx pour Multi-IA Hub v21 :
  1. Supprime le bloc dupliqué dans AideTab (lignes ~7700–7882)
  2. Passe les props apiKeys + enabled à <AideTab>
  3. Nettoie le fichier temp aide_tab_new.jsx si présent

Lance depuis :  C:\Users\Administrateur\Desktop\MultiIA-Portable\portable\
  > python patch_aide_tab.py
"""

import os, shutil, sys

APP_JSX  = r"C:\Users\Administrateur\Desktop\MultiIA-Portable\portable\src\App.jsx"
TMP_FILE = r"C:\Users\Administrateur\Desktop\MultiIA-Portable\portable\aide_tab_new.jsx"
BACKUP   = APP_JSX + ".bak_patch"

# ── Chargement ────────────────────────────────────────────────────
if not os.path.exists(APP_JSX):
    sys.exit(f"[ERREUR] Fichier introuvable : {APP_JSX}")

shutil.copy2(APP_JSX, BACKUP)
print(f"[✓] Backup créé : {BACKUP}")

with open(APP_JSX, "r", encoding="utf-8") as f:
    src = f.read()

original_len = len(src)

# ══════════════════════════════════════════════════════════════════
# CORRECTIF 1 — supprimer le bloc dupliqué
# Le bloc va du 2e sous-nav sticky jusqu'à la fermeture de section
# On détecte : un 2e bloc hero banner qui a été injecté par erreur
# après la vraie section "home" déjà complète.
# La duplication commence au 2e "/* Statut API */" dans la section
# "tutos" ET au 2e grille QUICK_TABS dans la section "home".
# ══════════════════════════════════════════════════════════════════

# --- Marqueur de début du doublon dans section "home" ---
# Le doublon commence par une 2e grille ACCÈS RAPIDE dans home,
# juste après le vrai bloc "Démarrage rapide" déjà présent.
# On cherche le pattern exact qui délimite le 2e bloc.

DUP_START = '''          {/* ACCÈS RAPIDE — 12 ONGLETS CLÉS */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,
              fontFamily:"var(--font-mono)",marginBottom:10}}>ACCÈS RAPIDE — 12 ONGLETS CLÉS</div>'''

DUP_END_MARKER = '''        {/* ═══════════════ TUTOS ═══════════════ */}
        {activeSection === "tutos" && <>
          {/* Quick start banner */}'''

CORRECT_TUTOS_START = '''        {/* ═══════════════ TUTOS ═══════════════ */}
        {activeSection === "tutos" && <>'''

if DUP_START in src:
    idx_dup_start = src.find(DUP_START)
    # Trouver le marqueur de fin correct
    idx_dup_end = src.find(DUP_END_MARKER, idx_dup_start)
    if idx_dup_end != -1:
        # On coupe le doublon et on recolle proprement
        before = src[:idx_dup_start]
        # Vérifier qu'on est bien dans la section home (doit être précédé de "Démarrage rapide")
        if "Démarrage rapide" in before[-2000:]:
            after = src[idx_dup_end:]
            # Remplacer le début "tutos" bancal par la version propre
            after = after.replace(DUP_END_MARKER, CORRECT_TUTOS_START, 1)
            src = before.rstrip() + "\n\n" + after
            print(f"[✓] Doublon ACCÈS RAPIDE supprimé (home)")
        else:
            print(f"[!] Doublon détecté mais contexte inattendu — ignoré par sécurité")
    else:
        print(f"[!] Début doublon trouvé mais pas la fin — aucune modification")
else:
    print(f"[~] Pas de doublon ACCÈS RAPIDE détecté (déjà propre ou marqueur différent)")

# --- Doublon dans section "tutos" : 2e bloc statut API ---
# Après la grille de tutos, il y a un statut API + FAQ qui sont corrects.
# Le doublon injecte un 2e hero banner + QUICK_TABS dans tutos.
# Marqueur du doublon dans tutos :
DUP2_START = '''          {/* Hero banner */}
          <div style={{marginBottom:18,padding:"clamp(16px,3vw,26px)",
            background:"linear-gradient(135deg,#0D0A02'''

DUP2_END = '''          {/* FAQ */}
          <div style={{padding:"12px 16px",background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:10,marginBottom:12}}>'''

# Compter les occurrences
count_hero = src.count('{/* Hero banner */}')
if count_hero > 1:
    # Trouver la 2ème occurrence dans la section tutos
    idx1 = src.find('{/* Hero banner */}')
    idx2 = src.find('{/* Hero banner */}', idx1 + 1)
    if idx2 != -1:
        idx_end = src.find(DUP2_END, idx2)
        if idx_end != -1:
            src = src[:idx2] + src[idx_end:]
            print(f"[✓] Doublon Hero Banner dans section tutos supprimé")
        else:
            print(f"[!] 2e hero banner trouvé mais pas de fin claire")
    else:
        print(f"[~] Un seul hero banner — OK")
else:
    print(f"[~] Hero banner unique — pas de doublon")


# ══════════════════════════════════════════════════════════════════
# CORRECTIF 2 — passer apiKeys + enabled à <AideTab>
# ══════════════════════════════════════════════════════════════════

OLD_AIDE_CALL = '<AideTab navigateTab={navigateTab}/>'
NEW_AIDE_CALL = '<AideTab navigateTab={navigateTab} apiKeys={apiKeys} enabled={enabled}/>'

if OLD_AIDE_CALL in src:
    src = src.replace(OLD_AIDE_CALL, NEW_AIDE_CALL, 1)
    print(f"[✓] Props apiKeys + enabled ajoutées à <AideTab>")
elif NEW_AIDE_CALL in src:
    print(f"[~] Props apiKeys + enabled déjà présentes — rien à faire")
else:
    # Essayer une variante avec espaces différents
    import re
    pattern = r'<AideTab\s+navigateTab=\{navigateTab\}\s*/>'
    if re.search(pattern, src):
        src = re.sub(pattern, NEW_AIDE_CALL, src, count=1)
        print(f"[✓] Props ajoutées via regex")
    else:
        print(f"[!] Appel <AideTab> introuvable — vérifie manuellement la ligne ~12490")

# ══════════════════════════════════════════════════════════════════
# CORRECTIF 3 — supprimer le doublon STUDIO AUTO (commentaire dupliqué)
# ══════════════════════════════════════════════════════════════════

DUP_STUDIO = (
    "// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n"
    "// \U0001f3ac STUDIO AUTO \u2014 G\xe9n\xe9rateur de tutos vid\xe9o automatique\n"
    "// Surcouche optionnelle : Browser-Use + OBS + IA + Kdenlive\n"
    "// Si un outil est absent \u2192 l'\xe9tape est ignor\xe9e, le reste continue\n"
    "// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n"
)
count_studio_comments = src.count("// 🎬 STUDIO AUTO")
if count_studio_comments > 1:
    # Supprimer la 2e occurrence du bloc de commentaire (sans le code)
    idx1 = src.find("// 🎬 STUDIO AUTO")
    idx2 = src.find("// 🎬 STUDIO AUTO", idx1 + 1)
    # Le 2ème est le doublon : trouver la prochaine ligne non-commentaire après lui
    end_comment = src.find("\nfunction StudioTab", idx2)
    if end_comment == -1:
        end_comment = src.find("\nconst STUDIO_PIPELINE", idx2)
    if end_comment != -1:
        # Chercher le début du bloc (les ══ avant)
        block_start = src.rfind("\n\n// ══", 0, idx2)
        if block_start != -1:
            src = src[:block_start] + src[end_comment:]
            print(f"[✓] Doublon commentaire STUDIO AUTO supprimé")
    else:
        print(f"[~] Doublon STUDIO AUTO : fin non trouvée, ignoré")
else:
    print(f"[~] Commentaire STUDIO AUTO unique — OK")

# ══════════════════════════════════════════════════════════════════
# Écriture finale
# ══════════════════════════════════════════════════════════════════

with open(APP_JSX, "w", encoding="utf-8") as f:
    f.write(src)

new_len = len(src)
diff = original_len - new_len
print(f"\n[✓] App.jsx mis à jour ({original_len:,} → {new_len:,} chars, -{diff:,} supprimés)")

# Nettoyage fichier temp
if os.path.exists(TMP_FILE):
    os.remove(TMP_FILE)
    print(f"[✓] Fichier temp supprimé : {TMP_FILE}")

print("\n✅ Patch terminé. Lance 'npm run dev' pour vérifier.")
print(f"   Backup disponible : {BACKUP}")
