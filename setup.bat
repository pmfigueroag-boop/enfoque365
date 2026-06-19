@echo off
echo ==========================================
echo   ENFOQUE 365 - Setup Completo
echo ==========================================
echo.

echo [1/4] Verificando Docker...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Docker no esta corriendo. Inicie Docker Desktop primero.
    pause
    exit /b 1
)
echo OK: PostgreSQL corriendo.
echo.

echo [2/4] Activando backend...
cd backend
call venv\Scripts\activate
alembic upgrade head
echo OK: Base de datos actualizada.
echo.

echo [3/4] Instalando frontend (requiere internet estable)...
cd ..\frontend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo ADVERTENCIA: npm install fallo. Posible problema de red.
    echo Reintente manualmente: cd frontend ^&^& npm install --legacy-peer-deps
    echo.
)
cd ..
echo.

echo [4/4] Listo! Ejecute los siguientes comandos en terminales separadas:
echo.
echo   Terminal 1 (Backend):
echo     cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --port 8001
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend ^&^& npm run dev
echo.
echo   Abrir en navegador: http://localhost:3000
echo ==========================================
pause
