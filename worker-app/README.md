# Service Booking — Worker App

A React Native / Expo app for **workers** to receive, accept, and manage incoming job requests.

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
| Login | OTP-based sign-in (worker account) |
| My Jobs | View incoming and active job requests, accept or reject them |
| Customer Chat | Chat with a customer for an accepted booking |
