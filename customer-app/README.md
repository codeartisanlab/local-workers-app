# Service Booking — Customer App

A React Native / Expo app for **customers** to browse services, find nearby workers, and manage bookings.

## Setup

```bash
npm install
```

## Running

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Configuration

Copy `.env.example` to `.env` and set the API base URL:

```
EXPO_PUBLIC_API_BASE_URL=http://<your-server>:8000/api
```

## Screens

| Screen | Description |
|---|---|
| Login | OTP-based sign-in (customer account) |
| Home | Browse available service categories |
| Workers | View nearby workers for a service |
| Booking | Worker details and portfolio |
| Book Service | Select a time slot and confirm booking |
| Booking Chat | Chat with your assigned worker |
| My Profile | Customer profile and settings |
| Order History | Past and active bookings |
| Track Booking | Live status of the current booking |
