@echo off
cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n"

echo WARNING: This will overwrite the remote repository!
echo Press Ctrl+C to cancel, or
pause

echo Adding all files...
git add .

echo Creating commit...
git commit -m "Complete LeadLove Maps system with workflows and frontend"

echo Force pushing to GitHub (this will overwrite remote)...
git push --force origin main

echo Done!
pause