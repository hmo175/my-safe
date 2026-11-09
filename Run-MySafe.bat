@echo off
title My Safe Launcher
cd /d "%~dp0"
echo Starting My Safe...
node .\node_modules\electron\cli.js .
pause
