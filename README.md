# CampusCycle — College Academic Resource Exchange

CampusCycle is a college-only peer-to-peer academic resource exchange platform where students buy, sell, borrow, lend, or donate used textbooks, lab coats, engineering drafters, scientific calculators, stationery, and engineering tools.

> **Runtime Stack:** React 19 + TypeScript + Tailwind CSS + Express (`server.ts`) on port `3000`, backed by **Google Cloud SQL (PostgreSQL)** via Drizzle ORM and **Firebase Authentication** (Google Sign-In + Email/Password).

---

## Core Features

- **Searchable, Database-Filtered Catalog**: Filter by branch (`CSE`, `IT`, `ECE`, `EEE`, `ME`, `CE`, `Other`), semester (`1–8`), category (`Textbooks`, `Lab Equipment`, `Engineering Tools`, `Stationery`, `Other`), condition (`Like New`, `Good`, `Fair`), exchange type (`Sell`, `Lend`, `Donate`), and availability, plus sorting (`Newest`, `Price Low → High`, `Price High → Low`).
- **Dual Student Authentication**: Students can sign up and sign in using either **Google Sign-In** or **Email & Password** (with email verification, password reset, and editable student profiles). Optional college email domain enforcement (`ALLOWED_COLLEGE_DOMAIN`) and role-verified **Admin Console** (`ADMIN_EMAIL` / PostgreSQL `role = 'admin'`).
- **Safe Item Request & Reservation Workflow**:
  - Blocks self-requests and duplicate active borrower requests.
  - Accepting a request atomically reserves the item in a PostgreSQL transaction and declines conflicting requests.
  - Cancelling a reserved request safely restores item availability.
- **Shared Pickup Coordination**: Both borrower and owner see and can update the campus pickup point (`College Library`, `Canteen`, `Department Office`, `Main Gate`, `Hostel Courtyard`), date, time, and instructions.
- **Dual-Confirmed Handover Tracker**: Tracks `Requested` → `Accepted` → `Reserved` → `Pickup Scheduled` → `Handed Over` → `Completed` / `Cancelled`. Status transitions to `Completed` **only after both** owner handover confirmation and borrower receipt confirmation.
- **Secure Image Uploads**: Restricts uploads to `image/jpeg`, `image/png`, and `image/webp` (`<= 2 MB`), verified via magic bytes on the server (`POST /api/upload`).
- **Admin Console**: Strictly role-protected user suspension/activation, listing moderation, report resolution, and transaction activity overview.

---

## Database & Authentication Setup

- **Database (Cloud SQL PostgreSQL)**: Provisioned in AI Studio (`SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME` are automatically injected). Schema lives in `src/db/schema.ts`.
- **Firebase Auth**: Configured via `firebase-applet-config.json`. Google Sign-In works immediately; to enable Email & Password logins, enable the **Email/Password** provider inside **Firebase Console → Authentication → Sign-in method**.
- **Optional Environment Variables** (see `.env.example`):
  - `ALLOWED_COLLEGE_DOMAIN` — optional domain filter (e.g., `.edu` or `.ac.in`). Leave blank to allow any student email.
  - `ADMIN_EMAIL` — optional primary administrator email override.

---

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To type-check and build for production:

```bash
npm run lint
npm run build
```
