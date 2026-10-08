@echo off
cd /d "%~dp0"
title FORJA
start "" http://localhost:4000
node server.js
