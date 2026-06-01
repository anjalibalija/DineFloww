@echo off
echo Committing and pushing the deploy fix to GitHub...
cd /d "%~dp0.."
git add package.json
git commit -m "Add root package.json for Render deploy"
git push origin main
echo Done! Please go to Render and deploy.
pause
