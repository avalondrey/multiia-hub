@echo off
title MultiIA v7
node --version >nul 2>&1 || (echo Node.js manquant : nodejs.org & pause & exit)
cd /d "%~dp0"
node server.cjs
pause >nul
