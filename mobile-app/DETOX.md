# Detox Tests

This app now includes Detox end-to-end tests for:

- login flow
- booking flow
- worker accepting a job

Files:

- `e2e/login.e2e.js`
- `e2e/booking.e2e.js`
- `e2e/worker-assignment.e2e.js`

## Before running

1. Install dependencies:

```bash
cd mobile-app
npm install
```

2. Ensure native folders exist. The Detox config uses Expo prebuild in the build commands for first-time native generation.

## Run

iOS:

```bash
npm run detox:test:ios
```

Android:

```bash
npm run detox:test:android
```

## Notes

- The tests use stable `testID` hooks added to the screens.
- The mobile API layer includes deterministic offline fallbacks for OTP and booking so Detox can simulate user flows even when the Django backend is not running.
- You may need to adjust the iOS scheme or Android emulator name in `.detoxrc.js` to match your machine after Expo prebuild generates native projects.
