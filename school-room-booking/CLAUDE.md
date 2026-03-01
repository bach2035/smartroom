# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart School Platform with two products:
- **Smart Room Booking** — students browse interactive SVG maps of their school, view room availability in real time, and submit booking requests requiring admin approval.
- **Smart Course Trading** — students post courses they have/want, get matched with compatible listings, propose trades, chat, and complete swaps.

## Tech Stack

- **Framework:** Next.js 16 (App Router, full-stack), standalone output mode
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 (inline theme in `globals.css`, no separate config)
- **Database:** Supabase (hosted PostgreSQL) — direct client queries, no ORM
- **Auth:** NextAuth.js v4 with Credentials provider, JWT strategy (30-day sessions)
- **State:** Zustand (stores for map filter state and trading filter state)
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

Optional (email notifications via Nodemailer in `src/lib/email.ts`):

```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
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

TradeProfile → User (display_name, contact info for trading)
TradeListing → User (status: OPEN/MATCHED/COMPLETED/CANCELLED)
└── TradeListingCourse (course_name, course_code, type: HAVE/WANT)
TradeMatch → TradeListing A + TradeListing B (status: PENDING/ACCEPTED/REJECTED/COMPLETED)
└── TradeMessage (chat within a match)
```

Database schema: `supabase/schema.sql` (RLS enabled on all tables). Seed data: `supabase/seed.sql` (3 test users, 2 buildings, 3 floors, 13 rooms, 2 trade profiles, 2 trade listings). Test credentials: `admin`/`john.doe`/`jane.smith` (all passwords in seed.sql).

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
| `(trading)` | `/trading/**` | Authenticated users |
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

### Zustand Stores

**`src/store/mapStore.ts`** — Map filter state: `selectedDate`, `startTime`, `endTime`, `selectedRoomId`, `searchResult`, `searched`. Defaults: today (GMT+7), 08:00–18:00. State persists across building/floor navigation.

**`src/store/tradingStore.ts`** — Trading filter state: `searchQuery`, `courseCodeFilter`, `statusFilter` with setters and `resetFilters`.

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

**Trading APIs:**
- `GET/PUT /api/trading/profile` — Trade profile CRUD (upsert)
- `GET/POST /api/trading/listings` — Browse OPEN listings + create listing
- `GET /api/trading/listings/me` — User's own listings
- `GET/PATCH/DELETE /api/trading/listings/[id]` — Listing detail, update, cancel
- `GET /api/trading/listings/[id]/matches` — Matching algorithm (find compatible listings)
- `GET/POST /api/trading/matches` — My matches + propose match (409 if duplicate)
- `GET/PATCH /api/trading/matches/[id]` — Match detail + accept/reject
- `GET/POST /api/trading/matches/[id]/messages` — Chat messages (polling with `?after=`)
- `PATCH /api/trading/matches/[id]/complete` — Mark match + listings as COMPLETED

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

### Sticky Navigation Context

This app has multiple product sections (Room Booking, Course Trading) sharing common pages (profile, settings, etc.). Shared pages must preserve the user's last active product section in the header nav. Use `sessionStorage` to track which product the user was last on, and restore it on any page that doesn't explicitly belong to a specific section. Implementation: `Header.tsx` saves `lastProduct` to `sessionStorage` on product-specific routes and reads it back on neutral routes.

### Key Conventions

- **Import alias:** `@/*` maps to `./src/*`
- **Timezone:** GMT+7 (Asia/Bangkok) for all date/time display. Constant `TZ` exported from utils.
- **Time slots:** 30-minute increments, range 7:00–22:00, inputs use `step={1800}`
- **Booking conflict detection:** Queries overlapping PENDING/APPROVED bookings before insert (non-atomic, sufficient for expected load)
- **User roles:** `STUDENT` (default) and `ADMIN` — enum `user_role` in database
- **Primary color:** `#b11a1e` (deep red/maroon), defined as CSS variable in globals.css
- **CSS utility classes:** Custom `.btn*`, `.card*`, `.form-*`, `.badge*`, `.table` classes defined in globals.css
- **Deployment:** Standalone output mode (`next.config.ts`) with multi-stage Dockerfile for Bun-based production builds

## Code Review Rules

Claude must automatically review all written code for:
- **Simplification:** remove unnecessary abstractions and intermediate variables
- **Dead code:** remove unused imports, variables, and unreachable branches
- **Duplication:** extract shared logic only at 3+ occurrences
- **Lean functions:** ~40 line max, prefer early returns over deep nesting
- **Bundle size:** use tree-shakeable imports (e.g. `import { x } from 'lib'` not `import lib`)
- **Error handling:** consistent try/catch + console.error, never expose internal details to client
- **Type safety:** no `any`, keep dual type system (snake_case DB / camelCase frontend) in sync
