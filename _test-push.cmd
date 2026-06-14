@echo off
cd /d c:\Users\Zoob\Desktop\Zhorror
set GITHUB_OWNER=Z-oobastik-s
set GITHUB_REPO=Zhorror
set GITHUB_BRANCH=main
for /f "usebackq tokens=* delims=" %%A in ("github-token.txt") do set "GITHUB_TOKEN=%%A"
c:\Users\Zoob\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe push-api.mjs
