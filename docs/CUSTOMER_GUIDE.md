# Customer App — Step-by-Step Guide

> **App:** Service Booking (Customer)  
> **Version:** 1.x  
> **Audience:** End-customers booking home-service professionals

---

## Table of Contents

1. [Getting Started — Sign Up & Log In](#1-getting-started--sign-up--log-in)
2. [Home Screen Tour](#2-home-screen-tour)
3. [Finding a Service](#3-finding-a-service)
4. [Choosing a Worker](#4-choosing-a-worker)
5. [Booking a Slot](#5-booking-a-slot)
6. [Booking Summary & Promo Codes](#6-booking-summary--promo-codes)
7. [Paying for the Service](#7-paying-for-the-service)
8. [Tracking Your Booking](#8-tracking-your-booking)
9. [Chatting with Your Worker](#9-chatting-with-your-worker)
10. [Cancelling or Rescheduling](#10-cancelling-or-rescheduling)
11. [Leaving a Review](#11-leaving-a-review)
12. [Managing Your Account](#12-managing-your-account)
13. [Frequently Asked Questions](#13-frequently-asked-questions)

---

## 1. Getting Started — Sign Up & Log In

1. **Download and open** the Service Booking app on your Android or iOS device.
2. On the **Login screen**, enter your **10-digit mobile number**.
3. Tap **Send OTP**. A 6-digit code is sent to your phone via SMS.
4. Enter the code in the **OTP** field.
5. Make sure the **"Customer"** role pill is selected (highlighted in green).
6. Tap **Continue** to log in.

> 💡 **Tip:** Your phone number is your permanent account ID — no password is ever required.  
> Demo credentials: phone `9000000001`, OTP `123456` (role: Customer).

---

## 2. Home Screen Tour

After logging in you land on the **Home** screen. Here you will find:

| Element | What it does |
|---|---|
| **Location Bar** (top) | Shows your current/selected location. Tap to change. |
| **Search Bar** 🔍 | Search services or workers by name. |
| **Category Scroll** | Horizontal chips for quick category browsing. |
| **Service Cards** | Grid of top-level services. Tap any card to see workers. |
| **Bottom Tab Bar** | Navigate between Home, Orders, and Profile. |

---

## 3. Finding a Service

**Option A — Browse categories:**

1. Tap a **category chip** in the horizontal scroll row (e.g. "Home Cleaning").
2. The **Category screen** lists all services within that category.
3. Tap a service to open its **Service Detail screen**.

**Option B — Search:**

1. Tap the **Search bar** at the top of the Home screen.
2. Type any keyword (e.g. "plumber", "deep clean").
3. Results update as you type (debounced 400 ms). Tap a result to proceed.

**Option C — Direct service card:**

1. Tap any **service card** in the Home grid.
2. You are taken directly to the **Workers** list for that service.

---

## 4. Choosing a Worker

1. After selecting a service you see the **Available Workers** list, sorted by distance.
2. Each card shows:
   - Worker name and photo
   - Average ⭐ rating and number of completed jobs
   - Skills list
   - Distance from your location
   - Verification status badge
3. Tap a worker card to open their **full profile** (portfolio, reviews, certificates).
4. Tap **"Book this Worker"** to proceed.

> 💡 **Tip:** Workers with the ✓ *Verified* badge have passed our government ID check.

---

## 5. Booking a Slot

1. On the **Book Service** screen, select a **date** from the calendar.
2. Available **time slots** for that date are shown as pill buttons. Tap one.
3. Your **saved addresses** appear in a dropdown. Select one or type a new address.
4. Tap **"Confirm Slot"** to move to the Booking Summary.

---

## 6. Booking Summary & Promo Codes

The **Booking Summary** screen shows a full breakdown before payment:

| Section | Details |
|---|---|
| Booking Details | Service name, package, worker, slot, date |
| Price Breakdown | Base price, coupon discount, final total |
| Promo Code | Enter a code and tap **Apply** |

**To apply a promo code:**

1. Type the code in the "Enter code" field (e.g. `FIRST50`).
2. Tap **Apply**.
3. If valid, the discount appears instantly in the Price Breakdown.
4. Tap **"Confirm & Pay →"** to proceed.

> 💡 **Tip:** First-time users can use `FIRST50` for ₹50 off.

---

## 7. Paying for the Service

On the **Payment** screen:

1. The **total amount** is shown prominently at the top.
2. Select a **payment method**:
   - 📱 **UPI** — any UPI app (Google Pay, PhonePe, Paytm …)
   - 💳 **Card** — debit or credit card
   - 👜 **Wallet** — in-app wallet balance
   - 💵 **Cash** — pay the worker directly on completion
3. Tap **"Pay ₹{amount} →"**.
4. For UPI/Card/Wallet, the payment gateway opens. Complete the transaction.
5. On success you see the **"Booking Confirmed!"** screen with your Booking ID.

---

## 8. Tracking Your Booking

1. Tap **"Track Booking"** on the confirmation screen, or navigate to it from your profile.
2. The tracking screen shows real-time **progress steps**:

   ```
   ● Searching for a worker
   ● Worker Assigned
   ● On the Way
   ● In Progress
   ● Completed
   ```

3. Each step shows its status: **Completed**, **Happening now**, or **Coming up**.

---

## 9. Chatting with Your Worker

1. On the Booking Tracking screen, tap **"Open Chat"**.
2. Type a message and press **Send**.
3. Your worker's replies appear in real time.
4. Chat history is preserved for the duration of the booking.

---

## 10. Cancelling or Rescheduling

**To cancel:**

1. Open the Booking Tracking screen.
2. If the booking is still *Searching* or *Assigned*, a **"Cancel Booking"** button appears.
3. Confirm cancellation. A refund (if applicable) is processed within 3–5 business days.

**To reschedule:**

1. Open **Order History** from the Profile tab.
2. Find the active booking and tap **"Reschedule"**.
3. Pick a new date and time slot.

> ⚠️ Cancellations after the worker is *On the Way* may incur a cancellation fee per our policy.

---

## 11. Leaving a Review

After a booking is marked **Completed**:

1. A **"Leave a Review"** button appears on the Tracking screen.
2. Tap it to open the **Review screen**.
3. Select a **star rating** (1–5).
4. Optionally add **tags** (Punctual, Professional, Skilled, Friendly, Clean).
5. Write a **comment** describing your experience.
6. Toggle whether you **would recommend** this worker.
7. Tap **"Submit Review"**.

> 💡 Reviews are public and directly affect the worker's search ranking.

---

## 12. Managing Your Account

Access your account from the **Profile tab** (👤) in the bottom bar:

| Option | What it does |
|---|---|
| **Track Booking** | Opens the live booking tracker |
| **My Addresses** | Add, edit, or delete saved addresses |
| **Order History** | Browse all past and active bookings |
| **How to Use** | Opens this guide inside the app |
| **Logout** | Signs you out safely |

**To add an address:**

1. Go to Profile → **My Addresses**.
2. Tap **"+ Add New Address"**.
3. Enter the address details and set a label (Home / Work / Other).
4. Tap **Save**.

---

## 13. Frequently Asked Questions

**Q: Can I book multiple services at once?**  
A: Currently each booking is for one service at a time. Create separate bookings for multiple services.

**Q: How do I change my registered phone number?**  
A: Contact support from the Help section. Account transfers require manual verification.

**Q: What if my worker doesn't show up?**  
A: Use the in-app chat first. If unresolved, tap "Raise a Dispute" on the booking detail screen. Our team will mediate.

**Q: Are workers insured?**  
A: Verified workers carry basic liability coverage. Check each worker's profile for details.

**Q: What payment methods are supported?**  
A: UPI, Credit/Debit Cards, in-app Wallet, and Cash on Delivery.

**Q: Can I tip my worker?**  
A: Tip functionality is coming soon. For now, you can leave a generous review to support them.

---

*For further help, contact **support@servicebooking.app** or use the in-app Help chat.*
