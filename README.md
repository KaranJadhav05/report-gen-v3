# ReportGen — Attendance Intelligence Platform

> PCCOE · Computer Engineering · Automated Attendance Processing & Defaulter Letter Generator

---

## Project Structure

```
reportgen/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── db.ts                 # MongoDB connection + seed
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT protect middleware
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   └── Attendance.ts
│   │   └── routes/
│   │       ├── auth.ts           # /api/auth/login  /api/auth/me
│   │       └── attendance.ts     # /api/attendance/upload|history|report/:id
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/         # React 19 + TypeScript + Vite
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx               # Routes + ProtectedRoute
    │   ├── index.css
    │   ├── context/
    │   │   └── AuthContext.tsx   # Auth state + login/logout
    │   ├── lib/
    │   │   ├── utils.ts          # CSV parser + types
    │   │   └── letterGenerator.ts# PCCOE letter HTML + window.open
    │   ├── components/ui/
    │   │   └── DashboardLayout.tsx
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── UserDashboard.tsx
    │       ├── AdminDashboard.tsx
    │       └── AttendancePage.tsx  ← main feature
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.ts
    └── tsconfig.json
```

---

## Quick Start

### 1 — Backend

```bash
cd backend
cp .env.example .env        # fill in MONGODB_URI, JWT_SECRET
npm install
npm run dev                 # starts on http://localhost:5001
```

**Default seeded accounts:**
| Email | Password | Role |
|---|---|---|
| admin@reportgen.com | admin123 | admin |
| user@reportgen.com  | user123  | user  |

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

> The Vite dev server proxies `/api` → `http://localhost:5001` automatically.

---

## Generating Defaulter Letters (Fix for Letter Download)

Letters open in a **new browser window** via `window.open()` — this avoids
all blob/download restrictions in modern browsers.

From the window toolbar click **🖨 Print / Save as PDF**.

> ⚠️ Make sure your browser allows pop-ups from `localhost`.
> Chrome: address bar → 🔒 → Site settings → Pop-ups: Allow

---

## Environment Variables (backend/.env)

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/reportgen
JWT_SECRET=change_this_to_a_long_random_string
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=        # optional — leave blank to skip cloud upload
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/login | — | Login, returns JWT |
| GET  | /api/auth/me | ✅ | Returns current user |
| POST | /api/attendance/upload | ✅ | Upload & parse Excel/CSV |
| GET  | /api/attendance/history | ✅ | Last 50 reports |
| GET  | /api/attendance/report/:id | ✅ | Single report with students |
