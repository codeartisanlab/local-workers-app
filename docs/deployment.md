# Deployment Guide

This document covers deploying the Local Workers App backend to a local server
and to a production server.

The mobile apps are distributed via Expo / app stores and do not require a
server-side deployment step beyond pointing them at the correct API URL.

---

## Table of Contents

1. [Local Server Deployment](#1-local-server-deployment)
2. [Production Server Deployment](#2-production-server-deployment)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Mobile App — Pointing to the Server](#4-mobile-app--pointing-to-the-server)

---

## 1. Local Server Deployment

Use this setup when you want to run the backend on a dedicated machine on your
LAN (e.g., a developer laptop acting as a shared dev server, a Raspberry Pi,
or a home lab VM).

### 1.1 Using Docker Compose (recommended)

**Requirements:** Docker Engine 24+ and Docker Compose v2.

```bash
# 1. Clone the repository
git clone https://github.com/codeartisanlab/local-workers-app.git
cd local-workers-app

# 2. (Optional) Set the allowed host for your LAN IP
export DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1,0.0.0.0,192.168.1.10"

# 3. Start the stack
docker compose up --build -d
```

The `-d` flag runs the containers in the background.

**Check that it is running:**

```bash
docker compose ps
docker compose logs -f backend
```

**Stop / restart:**

```bash
docker compose down          # stop and remove containers
docker compose restart       # restart without rebuilding
```

**Persistent data:**

The SQLite database is stored in a named volume (`backend-media`) and also
bind-mounted from the project directory, so data survives container restarts.

### 1.2 Using Python directly

```bash
# 1. Clone and set up
git clone https://github.com/codeartisanlab/local-workers-app.git
cd local-workers-app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure environment
export DJANGO_DEBUG=1
export DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1,0.0.0.0,192.168.1.10"

# 3. Migrate and seed
python manage.py migrate
python manage.py seed_demo_data

# 4. Run the server (bind to all interfaces so LAN devices can reach it)
python manage.py runserver 0.0.0.0:8000
```

> Using Django's built-in dev server for a local shared server is fine.
> Do **not** use it in production — see Section 2.

---

## 2. Production Server Deployment

### 2.1 Server Requirements

| Component | Minimum |
|-----------|---------|
| OS | Ubuntu 22.04 LTS (or any Linux distro) |
| CPU | 1 vCPU |
| RAM | 512 MB |
| Disk | 2 GB |
| Open port | 80 / 443 |

### 2.2 Pre-deployment Checklist

Before deploying to production, update `service_booking_backend/settings.py`
or set the following environment variables:

| Variable | Production value |
|----------|-----------------|
| `DJANGO_DEBUG` | `0` |
| `DJANGO_SECRET_KEY` | A long random string (see below) |
| `DJANGO_ALLOWED_HOSTS` | Your domain, e.g. `api.example.com` |

Generate a secret key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

> **Important:** Add `DJANGO_SECRET_KEY` support to `settings.py` before
> deploying. The current hardcoded key is for development only.

### 2.3 Deploying with Docker Compose + Nginx

This is the recommended production setup. It runs the Django app with
Gunicorn inside Docker and puts Nginx in front as a reverse proxy.

**Step 1 — Install Docker and Nginx on the server**

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx
sudo systemctl enable --now docker nginx
```

**Step 2 — Clone the repository**

```bash
git clone https://github.com/codeartisanlab/local-workers-app.git
cd local-workers-app
```

**Step 3 — Set environment variables**

Create a `.env` file in the project root (never commit this file):

```env
DJANGO_DEBUG=0
DJANGO_SECRET_KEY=<your-generated-secret-key>
DJANGO_ALLOWED_HOSTS=api.example.com
```

**Step 4 — Install Gunicorn**

Add `gunicorn` to `requirements.txt`, then rebuild the image:

```
gunicorn==21.2.0
```

Update `docker/entrypoint.sh` to use Gunicorn instead of the dev server:

```sh
#!/bin/sh
set -e

python manage.py migrate
python manage.py collectstatic --noinput
exec gunicorn service_booking_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120
```

**Step 5 — Build and start the container**

```bash
docker compose up --build -d
```

**Step 6 — Configure Nginx**

Create `/etc/nginx/sites-available/local-workers`:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location /static/ {
        alias /path/to/local-workers-app/staticfiles/;
    }

    location /media/ {
        alias /path/to/local-workers-app/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/local-workers \
           /etc/nginx/sites-enabled/local-workers
sudo nginx -t && sudo systemctl reload nginx
```

**Step 7 — Enable HTTPS with Certbot (recommended)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

Certbot will automatically update the Nginx config and set up auto-renewal.

### 2.4 Deploying without Docker (Gunicorn + systemd)

Use this approach if Docker is not available on the server.

```bash
# 1. Set up Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt gunicorn

# 2. Set environment variables (add to /etc/environment or a .env loader)
export DJANGO_DEBUG=0
export DJANGO_SECRET_KEY=<your-generated-secret-key>
export DJANGO_ALLOWED_HOSTS=api.example.com

# 3. Prepare the app
python manage.py migrate
python manage.py collectstatic --noinput

# 4. Test Gunicorn manually
gunicorn service_booking_backend.wsgi:application --bind 0.0.0.0:8000
```

**Create a systemd service** at `/etc/systemd/system/local-workers.service`:

```ini
[Unit]
Description=Local Workers App — Gunicorn
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/local-workers-app
EnvironmentFile=/opt/local-workers-app/.env
ExecStart=/opt/local-workers-app/.venv/bin/gunicorn \
    service_booking_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now local-workers
sudo systemctl status local-workers
```

Then follow Step 6 and 7 from Section 2.3 to configure Nginx and HTTPS.

### 2.5 Database — Switching to PostgreSQL (recommended for production)

SQLite is fine for development and low-traffic deployments. For production
workloads, switch to PostgreSQL.

Install the driver:

```bash
pip install psycopg2-binary
```

Update `settings.py`:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "localworkers"),
        "USER": os.environ.get("DB_USER", "localworkers"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}
```

Add the corresponding variables to your `.env` file and run migrations:

```bash
python manage.py migrate
```

### 2.6 Static Files

Run `collectstatic` before starting the server in production:

```bash
python manage.py collectstatic --noinput
```

Add `STATIC_ROOT` to `settings.py` if not already present:

```python
STATIC_ROOT = BASE_DIR / "staticfiles"
```

### 2.7 Updating the Server

```bash
# Pull the latest code
git pull origin main

# Activate the virtual environment (if not using Docker)
source .venv/bin/activate

# Install any new dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart the service
# Docker:
docker compose up --build -d
# systemd:
sudo systemctl restart local-workers
```

---

## 3. Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_DEBUG` | `1` | Set to `0` in production |
| `DJANGO_SECRET_KEY` | hardcoded dev key | **Must** be changed in production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,0.0.0.0,testserver` | Comma-separated list of allowed hostnames |
| `DB_NAME` | — | PostgreSQL database name (if using Postgres) |
| `DB_USER` | — | PostgreSQL username |
| `DB_PASSWORD` | — | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |

> `DJANGO_SECRET_KEY` is not yet read from an environment variable in
> `settings.py`. Add the following line before going to production:
>
> ```python
> SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-change-me-for-local-development-only-1234567890")
> ```

---

## 4. Mobile App — Pointing to the Server

After deploying the backend, update the `.env` file in each mobile app to
point at the server's public URL or LAN IP.

**For a production server with HTTPS:**

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com/api
```

**For a local server on your LAN:**

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000/api
```

Then rebuild or restart the Expo dev server:

```bash
npm start -- --clear
```

For a production mobile build (EAS Build), set the variable in your EAS
environment or `eas.json` rather than in a local `.env` file.
