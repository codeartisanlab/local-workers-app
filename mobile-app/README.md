# React Native Service Booking App

Expo-based mobile app with:

- OTP login
- home screen for nearby workers
- booking flow
- worker dashboard with accept and reject actions

## Run

```bash
cd mobile-app
npm install
cp .env.example .env
npm start
```

## Notes

- The app reads the backend base URL from `EXPO_PUBLIC_API_BASE_URL`.
- Default local value: `http://127.0.0.1:8000/api`
- For a physical device, set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP, for example `http://192.168.1.10:8000/api`.
- Nearby workers and worker job lists are mocked locally for now because the backend does not yet expose list APIs for those views.
- Job rejection is handled locally in the UI because the backend currently only supports job acceptance.
