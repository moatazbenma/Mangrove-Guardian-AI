@echo off
REM Mangrove Guardian AI - Docker Quick Start Script (Windows)
REM This script sets up and starts all Docker containers

setlocal enabledelayedexpansion

echo.
echo 🌳 Mangrove Guardian AI - Docker Setup
echo ======================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Check if .env.docker.local exists
if not exist ".env.docker.local" (
    echo 📋 Creating .env.docker.local from template...
    copy .env.example .env.docker.local
    echo ⚠️  Please update .env.docker.local with your credentials:
    echo    - CLOUDINARY_CLOUD_NAME
    echo    - CLOUDINARY_API_KEY
    echo    - CLOUDINARY_API_SECRET
    echo.
)

REM Build images
echo 🔨 Building Docker images...
docker-compose build

REM Start services
echo.
echo 🚀 Starting services...
docker-compose up -d

REM Wait for services to be healthy
echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak

REM Check service status
echo.
echo 📊 Service Status:
docker-compose ps

REM Run migrations
echo.
echo 🗄️  Running database migrations...
docker-compose exec -T backend python manage.py migrate

REM Collect static files
echo.
echo 📦 Collecting static files...
docker-compose exec -T backend python manage.py collectstatic --noinput

echo.
echo ======================================
echo ✨ Setup Complete!
echo ======================================
echo.
echo 🌐 Services Running:
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:8000
echo    Admin:     http://localhost:8000/admin
echo    API:       http://localhost:8000/api
echo.
echo 📊 Database:
echo    Host:      localhost:5432
echo    User:      postgres
echo    Password:  postgres
echo    Database:  Mangrove
echo.
echo 💾 Redis:
echo    Host:      localhost:6379
echo.
echo 📚 For more information, see DOCKER.md
echo.
echo Useful commands:
echo   View logs:  docker-compose logs -f
echo   Stop:       docker-compose stop
echo   Down:       docker-compose down
echo.
pause
