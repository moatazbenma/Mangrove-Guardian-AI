# Docker Setup for Mangrove Guardian AI

## Prerequisites

- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- Docker Compose included with Docker Desktop

## Quick Start

### 1. Copy Environment File
```bash
cp .env.example .env.docker.local
```

### 2. Edit Environment Variables
Update `.env.docker.local` with your actual values:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SECRET_KEY` (generate a strong one)

### 3. Start All Services
```bash
docker-compose up -d
```

### 4. Run Database Migrations
```bash
docker-compose exec backend python manage.py migrate
```

### 5. Create Superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

### 6. Access Services

| Service | URL | Port |
|---------|-----|------|
| **Django Admin** | http://localhost:8000/admin | 8000 |
| **API** | http://localhost:8000/api | 8000 |
| **React Frontend** | http://localhost:5173 | 5173 |
| **PostgreSQL** | localhost:5432 | 5432 |
| **Redis** | localhost:6379 | 6379 |

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 React Frontend (5173)                   │
│              (Development with Vite)                    │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│               Django Backend (8000)                     │
│          (Gunicorn + DRF + Rate Limiting)              │
└──────────────────────────┬──────────────────────────────┘
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼────┐    ┌─────▼────┐    ┌─────▼────┐
    │PostgreSQL│    │  Redis   │    │ Celery   │
    │    DB    │    │ Cache +  │    │ Worker   │
    │ (5432)   │    │ Broker   │    │          │
    │          │    │ (6379)   │    └──────────┘
    └──────────┘    └──────────┘
```

---

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery
```

### Access Container Shell
```bash
# Backend shell
docker-compose exec backend bash

# Database shell
docker-compose exec db psql -U postgres -d Mangrove
```

### Run Management Commands
```bash
# Django migrations
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Create cache table
docker-compose exec backend python manage.py createcachetable
```

### Stop Services
```bash
# Stop without removing
docker-compose stop

# Stop and remove (data persists in volumes)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

### Rebuild Containers
```bash
# Rebuild after code changes
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

---

## Database Persistence

Data is persisted in Docker volumes:
- `postgres_data` - PostgreSQL database
- `redis_data` - Redis cache
- `static_volume` - Django static files
- `media_volume` - User uploaded media

Volumes survive `docker-compose down` but are deleted with `docker-compose down -v`

---

## Development Workflow

### Hot Reload
Both backend and frontend support hot reload:
- **Frontend**: Changes detected automatically (Vite)
- **Backend**: Changes detected automatically (Django dev tools)

### Adding Dependencies

**Python (Backend)**:
```bash
# Add to requirements.txt, then rebuild
docker-compose build backend
docker-compose up -d backend
```

**Node (Frontend)**:
```bash
# Add to package.json, then rebuild
docker-compose build frontend
docker-compose up -d frontend
```

---

## Production Considerations

Before deploying to production:

1. **Set DEBUG=False** in .env
2. **Use strong SECRET_KEY** - generate with:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

3. **Update ALLOWED_HOSTS** with your domain
4. **Use environment-specific .env files**
5. **Ensure CORS_ALLOWED_ORIGINS** matches frontend URL
6. **Configure email settings** for notifications
7. **Set up SSL/TLS** with nginx/traefik

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Database Connection Error
```bash
# Restart database service
docker-compose restart db
docker-compose exec db pg_isready
```

### Redis Connection Error
```bash
# Restart Redis
docker-compose restart redis
docker-compose exec redis redis-cli ping
```

### Static Files Not Loading
```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Migrations Not Running
```bash
# Check migration status
docker-compose exec backend python manage.py showmigrations

# Apply migrations manually
docker-compose exec backend python manage.py migrate --run-syncdb
```

### Celery Workers Not Processing Tasks
```bash
# Check Celery logs
docker-compose logs -f celery

# Restart Celery
docker-compose restart celery celery_beat
```

---

## Health Checks

Services have health checks configured:
```bash
# View container health
docker-compose ps

# Manual health check
docker-compose exec backend curl http://localhost:8000/health/
docker-compose exec redis redis-cli ping
docker-compose exec db pg_isready -U postgres
```

---

## Useful Docker Tips

### Clean Up Unused Resources
```bash
# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune

# Remove unused networks
docker network prune
```

### Copy Files to/from Containers
```bash
# From container to host
docker-compose cp backend:/app/manage.py ./

# From host to container
docker-compose cp ./file backend:/app/
```

### Execute Multiple Commands
```bash
docker-compose exec backend bash -c "cmd1 && cmd2 && cmd3"
```

---

## Getting Help

Check service logs for detailed error messages:
```bash
docker-compose logs [service_name]
```

---

**Questions?** Refer to Docker documentation: https://docs.docker.com/
