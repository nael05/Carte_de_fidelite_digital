@echo off
echo Lancement de Loyalty Cards SaaS (Carte de Fidelite Digital)

echo ---------------------------------
echo Installation des dependances (backend)...
cd backend
call npm install
start "Loyalty SaaS - Backend" cmd /k "npm run dev"
cd ..

echo ---------------------------------
echo Installation des dependances (frontend)...
cd frontend
call npm install
start "Loyalty SaaS - Frontend" cmd /k "npm run dev"
cd ..

echo ---------------------------------
echo Le backend tourne sur le port 5000 (ou selon .env).
echo Le frontend s'ouvrira dans votre navigateur.
pause
