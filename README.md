# Local Workers App

Local Workers App contains:

- a Django REST Framework backend for OTP auth, bookings, worker discovery, and demo data
- an Expo React Native mobile app for customer and worker flows

## Documentation

- [How to Run](docs/how-to-run.md) — full local development setup guide
- [Deployment Guide](docs/deployment.md) — local and production server deployment

## Tech stack

- Backend: Django 4.2, Django REST Framework, Simple JWT, SQLite
- Mobile: Expo 54, React Native 0.81, TypeScript
- Optional local container setup: Docker Compose

## Project structure

- `bookings/`: backend app, APIs, models, tests, seed commands
- `service_booking_backend/`: Django project settings and URLs
- `mobile-app/`: Expo mobile client
- `docker-compose.yml`: backend container setup

## Backend setup

### Option 1: run with Python

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver 0.0.0.0:8000
```

Backend will be available at `http://127.0.0.1:8000`.

### Option 2: run with Docker

```bash
docker compose up --build
```

This starts the backend on `http://127.0.0.1:8000`, runs migrations, and seeds demo data automatically.

## Mobile app setup

```bash
cd mobile-app
npm install
cp .env.example .env
npm start
```

Default `.env` value:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

If you run the app on a physical phone, replace `127.0.0.1` with your computer's LAN IP, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000/api
```

## Demo accounts

- Customer: `9000000001`, OTP `123456`
- Worker: `9000000002`, OTP `654321`
- Admin: `9000000009`, OTP `999999`

OTPs are returned in the API response for local development.

## Main endpoints

- `POST /api/auth/request-otp/`
- `POST /api/auth/verify-otp/`
- `GET /api/services/`
- `GET /api/workers/nearby/`
- `GET /api/workers/<id>/`
- `GET /api/worker/jobs/`
- `POST /api/bookings/`
- `POST /api/bookings/accept/`
- `POST /api/bookings/reject/`

## Example flow

Request OTP:

```json
POST /api/auth/request-otp/
{
  "phone": "9000000001"
}
```

Verify OTP and get JWT:

```json
POST /api/auth/verify-otp/
{
  "phone": "9000000001",
  "otp": "123456",
  "role": "customer"
}
```

Create booking:

```json
POST /api/bookings/
Authorization: Bearer <access_token>
{
  "service_id": 1,
  "worker_id": 2,
  "location": "221B Baker Street",
  "time": "2026-03-30T10:00:00Z"
}
```

Worker accepts booking:

```json
POST /api/bookings/accept/
Authorization: Bearer <worker_access_token>
{
  "booking_id": 1
}
```

## Testing

```bash
pytest
```

## Notes for other developers

- `db.sqlite3`, `media/`, virtualenvs, and `mobile-app/node_modules/` are intentionally ignored.
- Docker entrypoint runs `migrate` and `seed_demo_data` on startup.
- The mobile app falls back to mocked flows if the backend is unavailable, but full integration requires the backend to be running.
