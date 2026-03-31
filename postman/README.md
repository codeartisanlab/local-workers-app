# Postman Collection

Import [Service Booking API.postman_collection.json](/Volumes/T7/projects/projects/localWorker/postman/Service%20Booking%20API.postman_collection.json) into Postman.

Recommended run order:

1. `Auth / Request OTP - Customer`
2. `Auth / Verify OTP - Customer`
3. `Auth / Request OTP - Worker`
4. `Auth / Verify OTP - Worker`
5. `Booking / List Services`
6. `Booking / Create Booking`
7. `Worker / List Worker Jobs`
8. `Worker / Accept Job`

Optional verification flow:

1. `Auth / Request OTP - Admin`
2. `Auth / Verify OTP - Admin`
3. `Worker / Upload Aadhaar`
4. `Worker / Admin Approve Worker Verification`

Notes:

- The collection uses collection variables for OTPs, JWTs, IDs, and coordinates.
- `Upload Aadhaar` requires you to choose a local file in Postman before sending.
- `Admin Approve Worker Verification` assumes the admin user already has `is_staff=True` in your database.
