#!/bin/bash

# Mangrove Guardian AI - Docker Quick Start Script
# This script sets up and starts all Docker containers

set -e

echo "🌳 Mangrove Guardian AI - Docker Setup"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env.docker.local exists
if [ ! -f ".env.docker.local" ]; then
    echo "📋 Creating .env.docker.local from template..."
    cp .env.example .env.docker.local
    echo "⚠️  Please update .env.docker.local with your credentials:"
    echo "   - CLOUDINARY_CLOUD_NAME"
    echo "   - CLOUDINARY_API_KEY"
    echo "   - CLOUDINARY_API_SECRET"
    echo ""
fi

# Build images
echo "🔨 Building Docker images..."
docker-compose build

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Create superuser
echo ""
echo "👤 Creating superuser (if needed)..."
docker-compose exec -T backend python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("✅ Superuser created: admin / admin123")
else:
    print("ℹ️  Superuser already exists")
END

# Collect static files
echo ""
echo "📦 Collecting static files..."
docker-compose exec -T backend python manage.py collectstatic --noinput

echo ""
echo "======================================"
echo "✨ Setup Complete!"
echo "======================================"
echo ""
echo "🌐 Services Running:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   Admin:     http://localhost:8000/admin"
echo "   API:       http://localhost:8000/api"
echo ""
echo "📊 Database:"
echo "   Host:      localhost:5432"
echo "   User:      postgres"
echo "   Password:  postgres"
echo "   Database:  Mangrove"
echo ""
echo "💾 Redis:"
echo "   Host:      localhost:6379"
echo ""
echo "👤 Superuser Credentials:"
echo "   Username:  admin"
echo "   Password:  admin123"
echo ""
echo "📚 For more information, see DOCKER.md"
echo ""
echo "View logs:  docker-compose logs -f"
echo "Stop:       docker-compose stop"
echo "Down:       docker-compose down"
