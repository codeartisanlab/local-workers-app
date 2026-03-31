# Demo Accounts

Run the demo seed command before testing:

```bash
PYTHONNOUSERSITE=1 python3 manage.py seed_demo_data
```

## Customer

- Phone: `9000000001`
- Role: `customer`
- Login: request OTP, then enter the OTP shown by the current development auth flow

## Vendors

- Primary vendor
  - Phone: `9000000002`
  - Role: `worker`
  - Skills: `Cleaning, Deep Sanitization`
  - Location: `Downtown`
- Secondary vendor
  - Phone: `9000000003`
  - Role: `worker`
  - Skills: `Electrical, Appliance Repair`
  - Location: `MG Road`
- Backup vendor
  - Phone: `9000000004`
  - Role: `worker`
  - Skills: `Plumbing`
  - Location: `Richmond Town`

## Admin

- Phone: `9000000009`
- Role: `customer`
- Flags: `is_staff`, `is_superuser`

## Demo flow

1. Log in as the customer with `9000000001`.
2. Open a nearby vendor and review portfolio images plus customer reviews.
3. Create a booking and continue into booking chat.
4. Log in as vendor `9000000002`.
5. Open Worker Dashboard, accept the job, and continue the conversation from chat.

## Seeded content

- Services: Cleaning, Plumbing, Electrical
- Worker portfolio images for each vendor
- Worker reviews for each vendor
- One accepted sample booking between customer `9000000001` and vendor `9000000002`
- Two seeded booking chat messages for that accepted booking
