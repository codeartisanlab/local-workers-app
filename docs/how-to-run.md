# How to Run — Local Development

This guide walks you through running the full Local Workers App stack locally:
the Django backend and the Expo React Native mobile app(s).

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.11+ | Required for the backend |
| Node.js | 18+ | Required for mobile apps |
| npm | 9+ | Bundled with Node.js |
| Expo Go | latest | Install on your iOS/Android device for quick testing |
| Docker + Docker Compose | any recent | Optional — alternative to the Python setup |

---

## 1. Backend

### Option A — Python (recommended for development)

```bash
# 1. Clone the repo (if you haven't already)
git clone https://github.com/codeartisanlab/local-workers-app.git
cd local-workers-app

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations
python manage.py migrate

# 5. Seed demo data (creates services, workers, and demo accounts)
python manage.py seed_demo_data

# 6. Start the dev server
python manage.py runserver 0.0.0.0:8000
```

The API will be available at **http://127.0.0.1:8000**.

### Option B — Docker Compose

```bash
docker compose up --build
```

This builds the container, runs migrations, seeds demo data, and starts the
backend on **http://127.0.0.1:8000** — all in one step.

To stop:

```bash
docker compose down
```

---

## 2. Mobile Apps

There are three Expo apps in this repo. All three follow the same setup steps.

| Directory | Who uses it |
|-----------|-------------|
| `mobile-app/` | Unified app (customers **and** workers in one codebase) |
| `customer-app/` | Customer-only app |
| `worker-app/` | Worker-only app |

### Setup

```bash
# Go into the app directory (use any of the three)
cd mobile-app          # or customer-app / worker-app

# Install dependencies
npm install

# Copy the example environment file
cp .env.example .env
```

### Configure the API URL

Open `.env` and set the backend URL:

**Simulator / emulator (backend on the same machine):**

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

**Physical device (replace with your machine's LAN IP):**

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000/api
```

Find your LAN IP with `ip addr` (Linux/macOS) or `ipconfig` (Windows).

### Start the Expo dev server

```bash
npm start
```

Expo will print a QR code. Scan it with the **Expo Go** app on your phone, or
press `i` for an iOS simulator or `a` for an Android emulator.

### Other run commands

```bash
npm run android   # open in Android emulator
npm run ios       # open in iOS simulator (macOS only)
npm run web       # open in browser
```

---

## 3. Demo Accounts

These accounts are created by `seed_demo_data` and work out of the box:

| Role | Phone | OTP |
|------|-------|-----|
| Customer | `9000000001` | `123456` |
| Worker | `9000000002` | `654321` |
| Admin | `9000000009` | `999999` |

> **Note:** OTP values are returned in the API response body during local
> development — no SMS provider is needed.

---

## 4. Running Tests

### Backend

```bash
# Activate virtual environment first
source .venv/bin/activate

pytest
```

Coverage report is printed automatically (configured in `pytest.ini`).

Run only a specific test file:

```bash
pytest bookings/test_api_pytest.py -x -q
```

### Mobile E2E Tests (Detox)

E2E tests live in `mobile-app/e2e/` and require a running simulator.

```bash
cd mobile-app
npm run detox:test:ios       # iOS simulator
npm run detox:test:android   # Android emulator
```

---

## 5. Useful Management Commands

```bash
# Re-seed demo data (safe to run multiple times)
python manage.py seed_demo_data

# Simulate load (for performance testing)
python manage.py simulate_load
```

---

## 6. Directory Reference

```
local-workers-app/
├── bookings/                   # Django app (models, views, APIs, tests)
├── service_booking_backend/    # Django project settings and URL config
├── mobile-app/                 # Unified Expo mobile app
├── customer-app/               # Customer-only Expo mobile app
├── worker-app/                 # Worker-only Expo mobile app
├── docker/                     # Docker entrypoint script
├── Dockerfile                  # Backend container definition
├── docker-compose.yml          # Multi-container orchestration
├── requirements.txt            # Python backend dependencies
└── manage.py                   # Django management entry point
```
