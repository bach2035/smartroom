# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

School Room Booking System — students browse interactive SVG maps of their school, view room availability in real time, and submit booking requests requiring admin approval.

## Tech Stack

- **Framework:** Next.js 16 (App Router, full-stack), standalone output mode
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 (inline theme in `globals.css`, no separate config)
- **Database:** Supabase (hosted PostgreSQL) — direct client queries, no ORM
- **Auth:** NextAuth.js v4 with Credentials provider, JWT strategy (30-day sessions)
- **State:** Zustand (single store for map filter state)
- **Package manager:** Bun (lockfile: `bun.lock`)

## Build & Development Commands

```bash
bun dev              # Dev server at localhost:3000
bun run build        # Production build
bun run lint         # ESLint (flat config, ESLint 9)
```

No test runner is configured. Seed data is in `supabase/seed.sql` (run via Supabase dashboard or psql). Note: `package.json` has stale Prisma scripts — the project does not use Prisma.

## Environment Variables

Required in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Public anon key (client-side)
SUPABASE_SERVICE_ROLE_KEY      # Service role key (server-side only)
NEXTAUTH_SECRET                # JWT signing secret
NEXTAUTH_URL                   # App URL (http://localhost:3000 for dev)
```

## Architecture

### Data Model

```
Building
└── Floor (svg_path → /public/maps/*.svg)
    └── Room (svg_element_id matches SVG data-room-id attribute)
        ├── RoomEquipment → Equipment
        ├── Booking (PENDING → APPROVED/REJECTED/CANCELLED)
        │   └── BookingAttachment
        └── RoomBookingGuide (approval_steps as JSONB)
Report → Room, User (issue reporting with status tracking)
```

Database schema: `supabase/schema.sql`. Seed data: `supabase/seed.sql` (3 test users, 2 buildings, 3 floors, 13 rooms). Test credentials: `admin`/`john.doe`/`jane.smith`.

### Dual Type System

Types are defined in two places with different casing conventions:
- `src/lib/supabase.ts` — database types (**snake_case**), plus two Supabase client exports
- `src/types/index.ts` — frontend types (**camelCase**) mirroring database types for JS ergonomics

Server components fetch snake_case data from Supabase, then transform to camelCase before passing to client components. Keep both type files in sync when modifying the data model.

### Supabase Clients (`src/lib/supabase.ts`)

Two clients exported:
- **`supabase`** (anon key) — client-side queries with RLS
- **`supabaseAdmin`** (service role key) — server-side API routes, unrestricted access

### Auth Flow (`src/lib/auth.ts`, `src/middleware.ts`)

- NextAuth Credentials provider validates username + password against Supabase `users` table via bcryptjs
- JWT enriched with `id`, `username`, `role` in callbacks
- Session type augmented in `src/types/next-auth.d.ts` (note: has stale `@prisma/client` import for `Role` type)
- Middleware enforces auth on all routes except `/`, `/login`, `/register`, `/api/auth/**`
- Admin routes (`/admin/*`) redirect non-admins to `/map`
- Matcher excludes `_next`, `maps/`, and `.svg` files

### Route Groups & Auth

| Group | Routes | Access |
|-------|--------|--------|
| `(auth)` | `/login`, `/register` | Unauthenticated only |
| `(main)` | `/map/**`, `/room/**`, `/bookings`, `/reports` | Authenticated users |
| `(admin)` | `/admin/**` | ADMIN role only |

### Server → Client Component Pattern

Server components fetch data from Supabase and pass to client wrappers:
- `map/[buildingId]/[floorId]/page.tsx` (server) → `FloorPlanWrapper.tsx` (client)
- `room/[roomId]/page.tsx` (server) → `RoomBookingClient.tsx` (client)

The server component handles initial data fetch with `supabaseAdmin`; the client component manages interactivity, re-fetching via API routes.

### SVG Map System

Each floor has an SVG file in `/public/maps/` (floor-a1.svg, floor-a2.svg, floor-b1.svg). `FloorPlan.tsx` fetches SVG content via `fetch()`, renders with `dangerouslySetInnerHTML`, then overrides fill colors via inline styles on elements matching `data-room-id`:

| Color | Status |
|-------|--------|
| `#D1D5DB` | Available (light grey) |
| `#EF4444` | Booked (red) |
| `#b11a1e` | Selected (deep red/maroon — also the primary brand color) |
| `#6B7280` | Maintenance (dark grey) |

Click behavior: available room → navigate to `/room/[roomId]?date=YYYY-MM-DD`; booked room → popup with booking details; admin → AdminRoomPanel for triage.

### Zustand Store (`src/store/mapStore.ts`)

Single store: `selectedDate`, `startTime`, `endTime`, `selectedRoomId`, `searchResult`, `searched`. Defaults: today (GMT+7), 08:00–18:00. State persists across building/floor navigation.

### API Routes (`src/app/api/`)

**User APIs:**
- `POST /api/bookings` — Create booking (409 on time conflict)
- `GET /api/bookings/me` — User's bookings
- `GET/PATCH /api/bookings/[id]` — Booking detail & updates
- `PATCH /api/bookings/[id]/cancel` — Cancel own booking
- `GET /api/rooms/[id]/availability` — 30-min time slots for a date (7:00–22:00)
- `GET /api/rooms/available` — Search available rooms with date/time filters
- `GET /api/buildings`, `GET /api/buildings/[id]/floors`, `GET /api/floors/[id]`
- `POST/GET /api/reports` — Issue reporting

**Admin APIs** (all check `session.user.role === 'ADMIN'`):
- `PATCH /api/admin/bookings/[id]/approve` — Approve with `approved_by` + timestamp
- `PATCH /api/admin/bookings/[id]/reject` — Reject with `reject_reason`
- `GET /api/admin/bookings/pending-by-room` — Triage view grouped by room
- `GET/POST/PATCH/DELETE /api/admin/rooms` — Room CRUD
- `GET/PUT /api/admin/rooms/[id]/guide` — Room booking guide management
- `GET/PATCH /api/admin/users` — User management
- `GET/PATCH /api/admin/reports` — Report management

### Utilities (`src/lib/utils.ts`)

- `cn()` — Tailwind class merging via clsx
- `getTodayString()` / `getDateString()` — YYYY-MM-DD in GMT+7
- `toGMT7ISO(date, time)` — Combine date + time to ISO string with +07:00 offset
- `formatDate()` / `formatTime()` / `formatDateTime()` — Display formatting in GMT+7
- `generateTimeSlots()` — Creates 30-min slots array from 7:00–22:00

### Key Conventions

- **Import alias:** `@/*` maps to `./src/*`
- **Timezone:** GMT+7 (Asia/Bangkok) for all date/time display. Constant `TZ` exported from utils.
- **Time slots:** 30-minute increments, range 7:00–22:00, inputs use `step={1800}`
- **Booking conflict detection:** Queries overlapping PENDING/APPROVED bookings before insert (non-atomic, sufficient for expected load)
- **User roles:** `STUDENT` (default) and `ADMIN` — enum `user_role` in database
- **Primary color:** `#b11a1e` (deep red/maroon), defined as CSS variable in globals.css
- **CSS utility classes:** Custom `.btn*`, `.card*`, `.form-*`, `.badge*`, `.table` classes defined in globals.css
