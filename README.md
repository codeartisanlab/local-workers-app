# Local Workers App

Local Workers App contains:

- a Django REST Framework backend for OTP auth, bookings, worker discovery, payments, and demo data
- two separate Expo React Native mobile experiences sharing one codebase:
  - **Customer App** — browse services, book workers, pay, track, review
  - **Worker App** — receive jobs, accept/decline, chat, track earnings

## Quick start

| What | Command |
|---|---|
| Start backend | `python manage.py runserver` |
| Start mobile app | `cd mobile-app && npm install && npm start` |
| Run tests | `python -m pytest bookings/test_api_pytest.py -x -q` |

## 📱 Separate Customer & Worker Apps

Although both apps are served from the **same Expo bundle**, the navigation is fully split by role after login:

```
Login Screen
    │
    ├── role = "customer" ──► CustomerNavigator (warm cream theme)
    │       Home · Search · ServiceCategory · ServiceDetail
    │       Workers · Booking · BookingSlots · BookingSummary
    │       Payment · PaymentSuccess · BookingTracking
    │       ReviewBooking · OrderHistory · ManageAddresses
    │       CustomerProfile · CustomerGuide
    │
    └── role = "worker"  ──► WorkerNavigator (dark teal theme)
            WorkerDashboard · WorkerChat
            WorkerEarnings · WorkerOnboarding · WorkerGuide
```

### Customer App entry point
Select **"Customer"** on the login screen, then sign in with phone + OTP.

### Worker App entry point
Select **"Worker"** on the login screen, then sign in with phone + OTP.

## 📖 User Guides

Step-by-step manuals are included in the `docs/` folder and also available inside each app via the **"How to Use"** menu item:

| Guide | In-app location | Markdown |
|---|---|---|
| Customer Guide | Profile tab → "How to Use" | [`docs/CUSTOMER_GUIDE.md`](docs/CUSTOMER_GUIDE.md) |
| Worker Guide | Guide tab (📖 in bottom bar) | [`docs/WORKER_GUIDE.md`](docs/WORKER_GUIDE.md) |

## Tech stack

- Backend: Django 4.2, Django REST Framework, Simple JWT, SQLite
- Mobile: Expo 54, React Native 0.81, TypeScript
- Optional local container setup: Docker Compose

## Project structure

```
├── bookings/               Django app (APIs, models, tests)
├── service_booking_backend/ Django project settings & URLs
├── mobile-app/
│   └── src/
│       ├── navigation/
│       │   ├── AppNavigator.tsx        Top-level role router
│       │   ├── CustomerNavigator.tsx   All customer screens
│       │   └── WorkerNavigator.tsx     All worker screens
│       ├── screens/                    Individual screens
│       ├── components/
│       │   ├── FloatingTabBar.tsx      Customer bottom tab
│       │   └── WorkerTabBar.tsx        Worker bottom tab
│       └── services/api.ts             API client
├── docs/
│   ├── CUSTOMER_GUIDE.md
│   └── WORKER_GUIDE.md
└── docker-compose.yml
```

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

| Role | Phone | OTP |
|---|---|---|
| Customer | `9000000001` | `123456` |
| Worker | `9000000002` | `654321` |
| Admin | `9000000009` | `999999` |

OTPs are returned in the API response for local development.

## Main endpoints

- `POST /api/auth/request-otp/`
- `POST /api/auth/verify-otp/`
- `GET /api/services/`
- `GET /api/categories/`
- `GET /api/categories/<id>/services/`
- `GET /api/workers/nearby/`
- `GET /api/workers/<id>/`
- `GET /api/workers/<id>/slots/?date=YYYY-MM-DD`
- `GET /api/worker/jobs/`
- `GET /api/worker/earnings/`
- `POST /api/bookings/`
- `POST /api/bookings/<id>/cancel/`
- `POST /api/bookings/<id>/reschedule/`
- `POST /api/bookings/<id>/review/`
- `POST /api/bookings/accept/`
- `POST /api/bookings/reject/`
- `POST /api/payments/create-order/`
- `POST /api/payments/verify/`
- `POST /api/coupons/apply/`
- `GET /api/search/?q=`
- `GET /api/health/`

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
