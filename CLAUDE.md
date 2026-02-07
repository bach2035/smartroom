# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

School Room Booking System - a web-based platform for students to browse interactive navigation maps of their school, view room availability in real time, and submit booking requests requiring admin approval.

## Tech Stack

- **Framework:** Next.js (App Router, full-stack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js with Credentials provider (username/password, JWT strategy)
- **State:** React Context / Zustand (client-side)
- **Deployment:** Vercel (recommended)

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Database operations
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations in development
npx prisma migrate deploy # Run migrations in production
npx prisma studio        # Open Prisma Studio GUI
```

## Architecture

### Data Model Hierarchy

```
Campus
├── Building (has SVG for campus-level view)
│   └── Floor (has SVG floor plan)
│       └── Room (has svgElementId linking to floor plan element)
│           └── Booking (with PENDING/APPROVED/REJECTED/CANCELLED status)
```

### User Roles

- **STUDENT:** Browse maps, submit booking requests, view own bookings
- **ADMIN:** All student permissions + approve/reject bookings, manage rooms

### Page Routes

- `/map` - Main interactive map view (campus → building → floor)
- `/map/[buildingId]` - Building floor selector
- `/map/[buildingId]/[floorId]` - Floor plan with clickable rooms
- `/room/[roomId]` - Room detail + availability timeline + booking form
- `/bookings` - Student's booking history
- `/admin/pending` - Admin pending requests queue
- `/admin/bookings` - All bookings view
- `/admin/rooms` - Room management CRUD

### Key Implementation Details

**SVG Maps:** Each room is an `<svg>` polygon/rect element with a unique `room-id` data attribute. Room availability state drives fill color:
- Available: `#D1D5DB` (light grey)
- Booked: `#EF4444` (red)
- Selected: `#3B82F6` (blue)
- Maintenance: `#6B7280` (dark grey)

**Booking Conflicts:** Use database transaction with row-level locking when creating bookings to prevent double-booking. Return HTTP 409 on conflict.

**Time Slots:** 30-minute increments. Filter state persists across building/floor navigation.

**Security:**
- Passwords hashed with bcrypt (salt rounds = 12)
- Admin routes require `role === 'ADMIN'` check
- Rate limiting on auth endpoints (5 attempts/minute)
