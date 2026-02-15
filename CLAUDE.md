# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

School Room Booking System — students browse interactive SVG maps of their school, view room availability in real time, and submit booking requests requiring admin approval.

## Tech Stack

- **Framework:** Next.js 16 (App Router, full-stack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (hosted PostgreSQL) — NOT Prisma
- **Auth:** NextAuth.js v4 with Credentials provider, JWT strategy (30-day sessions)
- **State:** Zustand (single store for map filter state)
- **Package manager:** Bun (lockfile: `bun.lock`)

## Project Root

The Next.js application lives in `school-room-booking/` — all source code, configs, and commands run from there.

## Build & Development Commands

```bash
cd school-room-booking

bun dev              # Dev server at localhost:3000
bun run build        # Production build
bun run lint         # ESLint (flat config, ESLint 9)
bun run db:seed      # Seed database
```

No test runner is configured.

## Environment Variables

Required in `school-room-booking/.env`:

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
└── Floor (has SVG floor plan at svg_path)
    └── Room (svg_element_id links to SVG element with data-room-id)
        ├── RoomEquipment → Equipment
        └── Booking (PENDING → APPROVED/REJECTED/CANCELLED)
```

Database types are defined inline in `src/lib/supabase.ts` (no Prisma schema).

### Route Groups & Auth

Three Next.js route groups with different auth requirements:

| Group | Routes | Access |
|-------|--------|--------|
| `(auth)` | `/login`, `/register` | Unauthenticated only |
| `(main)` | `/map/**`, `/room/**`, `/bookings` | Authenticated users |
| `(admin)` | `/admin/**` | ADMIN role only |

Middleware (`src/middleware.ts`) enforces auth via NextAuth `withAuth`. Admin routes redirect non-admins to `/map`.

### Server vs Client Component Pattern

Server components fetch data from Supabase, then pass it to client wrapper components:
- `map/[buildingId]/[floorId]/page.tsx` (server) → `FloorPlanWrapper.tsx` (client)
- `room/[roomId]/page.tsx` (server) → `RoomBookingClient.tsx` (client)

### API Routes (`src/app/api/`)

**User APIs:**
- `POST /api/bookings` — Create booking (returns 409 on time conflict)
- `GET /api/bookings/me` — User's bookings
- `PATCH /api/bookings/[id]/cancel` — Cancel own booking
- `GET /api/rooms/[id]/availability` — 30-min time slots for a date (7:00–22:00)
- `GET /api/buildings`, `GET /api/buildings/[id]/floors`, `GET /api/floors/[id]`

**Admin APIs:**
- `PATCH /api/admin/bookings/[id]/approve` — Approve with `approved_by` + timestamp
- `PATCH /api/admin/bookings/[id]/reject` — Reject with `reject_reason`
- `GET/POST/PATCH/DELETE /api/admin/rooms` — Room CRUD

All admin APIs check `session.user.role === 'ADMIN'`.

### SVG Map System

Each floor has an SVG file. Room elements use `data-room-id` attributes matching the `svg_element_id` column. `FloorPlan.tsx` dynamically loads the SVG and sets fill colors based on booking status:
- `#D1D5DB` — Available (grey)
- `#EF4444` — Booked (red)
- `#3B82F6` — Selected (blue)
- `#6B7280` — Maintenance (dark grey)

Clicking an available room navigates to `/room/[roomId]?date=YYYY-MM-DD`.

### Zustand Store (`src/store/mapStore.ts`)

Single store holding: `selectedDate`, `startTime`, `endTime`, `selectedRoomId`. Filter state persists across building/floor navigation. Default time range: 08:00–18:00.

### Import Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

### Supabase Client Usage

- `src/lib/supabase.ts` exports two clients:
  - Anonymous client (uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — limited access
  - Admin/service client (uses `SUPABASE_SERVICE_ROLE_KEY`) — full access, server-side only

### Booking Conflict Detection

`POST /api/bookings` queries for overlapping bookings with PENDING or APPROVED status before inserting. Not an atomic transaction — sufficient for expected concurrency levels.

### Time Slots

30-minute increments. Time inputs use `step={1800}`. Availability endpoint generates slots from 7:00 to 22:00. Filter bar and booking form should always use rounded 30-min boundaries.
