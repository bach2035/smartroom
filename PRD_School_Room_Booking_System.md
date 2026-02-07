# Product Requirements Document (PRD)
# School Room Booking System

**Version:** 1.0
**Date:** February 8, 2026
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary
A web-based platform that enables students to browse an interactive navigation map of their school (multiple buildings, multiple floors), view room availability in real time, and submit booking requests for available rooms. Bookings require admin/teacher approval before confirmation.

### 1.2 Problem Statement
Students currently lack a centralized, visual way to discover which rooms are available and to request bookings. This leads to scheduling conflicts, wasted time, and manual coordination overhead for administrators.

### 1.3 Goals
- Provide an intuitive, map-based interface for discovering room availability.
- Streamline the booking request and approval workflow.
- Reduce scheduling conflicts through real-time visual status indicators.
- Give admins a simple dashboard to review, approve, or reject requests.

### 1.4 Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, full-stack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | NextAuth.js (Credentials provider — username/password) |
| State | React Context / Zustand (client-side) |
| Deployment | Vercel (recommended) or self-hosted |

---

## 2. User Roles & Permissions

### 2.1 Student
- Register and log in with username & password.
- Browse interactive school maps (buildings → floors → rooms).
- Filter by date and time.
- View room availability (color-coded).
- Click a room to see details and availability timeline.
- Submit a booking request form for available time slots.
- View their own booking history and statuses (pending / approved / rejected).

### 2.2 Admin / Teacher
- All Student permissions.
- Access admin dashboard to view all incoming booking requests.
- Approve or reject booking requests (with optional rejection reason).
- Manage room metadata (name, capacity, equipment, description).
- Mark rooms as unavailable / under maintenance.
- View system-wide booking calendar.

### 2.3 Super Admin (optional, future scope)
- Manage user accounts (create, deactivate).
- Upload/update building maps.
- Configure system settings (booking rules, time slot constraints).

---

## 3. Core Features

### 3.1 Authentication System

**Registration:**
- Fields: full name, student ID, email, username, password, confirm password.
- Password requirements: minimum 8 characters, at least 1 uppercase, 1 number.
- Student ID uniqueness enforced.

**Login:**
- Username + password.
- Session managed via NextAuth.js with JWT strategy.
- "Remember me" option (extends session to 30 days).

**Account:**
- Password reset via email link.
- Profile page to view/edit personal info.

---

### 3.2 Interactive Navigation Map

This is the primary interface of the application. Users interact with a visual floor plan to discover and select rooms.

**3.2.1 Map Hierarchy**
```
Campus
├── Building A
│   ├── Floor 1 (ground)
│   │   ├── Room A101
│   │   ├── Room A102
│   │   └── ...
│   ├── Floor 2
│   └── Floor 3
├── Building B
│   ├── Floor 1
│   └── Floor 2
└── Building C
    └── ...
```

**3.2.2 Map Display**
- Default view: Campus overview showing all buildings as labeled, clickable blocks/shapes.
- Click a building → zooms into that building's floor selector.
- Select a floor → displays the floor plan with all rooms rendered as interactive shapes/zones.
- Each room is a clickable region on the floor plan.

**3.2.3 Map Implementation Options**
- **Option A (Recommended for MVP):** SVG-based floor plans. Each room is an `<svg>` polygon/rect element with a unique `room-id` data attribute. Styling (fill color) is driven by availability state. This is performant, scalable, and accessible.
- **Option B (Future):** Canvas-based rendering using a library like Konva.js or Fabric.js for more complex interactivity (drag, pinch-zoom on mobile).

**3.2.4 Room Color Coding**
| State | Color | Hex Code | Meaning |
|-------|-------|----------|---------|
| Available | Light Grey | `#D1D5DB` | No booking at selected date/time |
| Booked | Red | `#EF4444` | Occupied at selected date/time |
| Selected | Blue | `#3B82F6` | Currently clicked/focused by user |
| Unavailable / Maintenance | Dark Grey | `#6B7280` | Not bookable (admin-disabled) |

**3.2.5 Room Hover/Click Behavior**
- **Hover:** Tooltip appears showing room name, capacity, and status at the selected time.
- **Click:** Opens the Room Detail Panel (see §3.4).

---

### 3.3 Date & Time Filter

A filter bar displayed persistently above/beside the map.

**Fields:**
| Field | Type | Details |
|-------|------|---------|
| Date | Date Picker | Defaults to today. Cannot select past dates. Max 30 days ahead. |
| Start Time | Dropdown / Time Picker | 30-minute increments (e.g., 07:00, 07:30, 08:00 ... 22:00). |
| End Time | Dropdown / Time Picker | Auto-set to start time + 30 min. Must be after start time. Max duration TBD (e.g., 4 hours). |

**Behavior:**
- On any filter change, the map re-renders room colors based on availability for the selected date + time range.
- If no time is selected, show current availability (default to current 30-minute block).
- Filter state persists across building/floor navigation within the same session.

---

### 3.4 Room Detail Panel

When a user clicks a room on the map, a side panel or modal opens with:

**3.4.1 Room Information**
- Room name / number (e.g., "A201 — Seminar Room")
- Building & floor
- Capacity (max persons)
- Available equipment (projector, whiteboard, screen, microphone, etc.)
- Room photo (optional)
- Description / usage notes

**3.4.2 Availability Timeline**
- A horizontal timeline or grid for the selected date showing all 30-minute blocks.
- Each block is colored: grey (available) or red (booked).
- Booked blocks show "Booked" label (no personal info revealed to students).
- Users can click/drag on available blocks to select their desired time range.

**3.4.3 Booking Action**
- If the room is **available** for the selected time → show a **"Book This Room"** button that opens the booking form.
- If **booked** → display "This room is booked for the selected time. Please choose a different time." and disable the booking button.

---

### 3.5 Booking Request Form

Displayed after user clicks "Book This Room" on an available slot.

**Form Fields:**
| Field | Type | Required | Details |
|-------|------|----------|---------|
| Student Name | Text (pre-filled) | Yes | Auto-populated from user profile |
| Student ID | Text (pre-filled) | Yes | Auto-populated from user profile |
| Room | Text (read-only) | Yes | Auto-populated from selected room |
| Date | Date (read-only) | Yes | Auto-populated from filter |
| Start Time | Time (read-only) | Yes | Auto-populated from selected slot |
| End Time | Time (editable) | Yes | Pre-filled, adjustable in 30-min increments |
| Purpose / Reason | Textarea | Yes | Min 10 characters. E.g., "Group study for CS301 midterm" |
| Number of People | Number input | Yes | Min 1, max = room capacity |
| Additional Notes | Textarea | No | Optional special requests |

**Submission Behavior:**
1. Client-side validation on all required fields.
2. On submit → POST to `/api/bookings` endpoint.
3. Server checks for time-slot conflicts (race condition prevention with DB-level locking).
4. If no conflict → booking is created with status `PENDING`.
5. User sees confirmation: "Your booking request has been submitted and is awaiting approval."
6. Admin is notified (in-app notification; email notification is optional/future).
7. If conflict detected → user sees: "This slot was just booked. Please select a different time."

---

### 3.6 Booking Management (Student View)

**My Bookings Page** — accessible from the main navigation.

**Displays a list/table of:**
| Column | Details |
|--------|---------|
| Room | Room name + building/floor |
| Date | Booking date |
| Time | Start – End |
| Purpose | Truncated, expandable |
| Status | Badge: `Pending` (yellow), `Approved` (green), `Rejected` (red) |
| Actions | Cancel (if pending), View Details |

**Filters:** Status filter (All / Pending / Approved / Rejected), date range.

**Cancellation:** Students can cancel `PENDING` bookings. `APPROVED` bookings can be cancelled up to 1 hour before start time (configurable).

---

### 3.7 Admin Dashboard

**Accessible only to users with `ADMIN` role.**

**3.7.1 Pending Requests Queue**
- List of all `PENDING` booking requests, sorted by submission time (oldest first).
- Each entry shows: student name, student ID, room, date/time, purpose, number of people.
- Actions per request:
  - **Approve** → status changes to `APPROVED`, student is notified.
  - **Reject** → modal prompts for rejection reason (required), status changes to `REJECTED`, student is notified with reason.

**3.7.2 All Bookings View**
- Filterable calendar/table of all bookings across the system.
- Filters: room, building, date range, status, student.
- Ability to cancel any approved booking (with notification to student).

**3.7.3 Room Management**
- CRUD operations for rooms.
- Fields: room name, building, floor, capacity, equipment (multi-select), description, photo upload, active/inactive toggle.
- Bulk import via CSV (future scope).

---

## 4. Data Models

### 4.1 Entity Relationship Overview

```
User (1) ────── (N) Booking
Room (1) ────── (N) Booking
Building (1) ── (N) Floor
Floor (1) ───── (N) Room
Room (N) ────── (N) Equipment (join table)
```

### 4.2 Database Schema

```prisma
// schema.prisma

model User {
  id          String    @id @default(cuid())
  username    String    @unique
  email       String    @unique
  password    String    // bcrypt hashed
  fullName    String
  studentId   String    @unique
  role        Role      @default(STUDENT)
  bookings    Booking[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum Role {
  STUDENT
  ADMIN
}

model Building {
  id          String   @id @default(cuid())
  name        String   // e.g., "Building A"
  code        String   @unique // e.g., "A"
  description String?
  mapSvg      String?  // SVG markup or reference for campus-level view
  floors      Floor[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Floor {
  id          String   @id @default(cuid())
  number      Int      // e.g., 1, 2, 3
  label       String?  // e.g., "Ground Floor", "2nd Floor"
  buildingId  String
  building    Building @relation(fields: [buildingId], references: [id])
  mapSvg      String?  @db.Text // SVG markup for the floor plan
  rooms       Room[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([buildingId, number])
}

model Room {
  id          String      @id @default(cuid())
  name        String      // e.g., "A201"
  displayName String?     // e.g., "Seminar Room"
  floorId     String
  floor       Floor       @relation(fields: [floorId], references: [id])
  capacity    Int
  description String?
  photoUrl    String?
  svgElementId String?    // ID of the SVG element on the floor map
  isActive    Boolean     @default(true)
  equipment   RoomEquipment[]
  bookings    Booking[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Equipment {
  id    String          @id @default(cuid())
  name  String          @unique // e.g., "Projector", "Whiteboard"
  icon  String?         // icon identifier
  rooms RoomEquipment[]
}

model RoomEquipment {
  roomId      String
  equipmentId String
  room        Room      @relation(fields: [roomId], references: [id])
  equipment   Equipment @relation(fields: [equipmentId], references: [id])

  @@id([roomId, equipmentId])
}

model Booking {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  roomId          String
  room            Room          @relation(fields: [roomId], references: [id])
  date            DateTime      @db.Date
  startTime       DateTime      // full datetime for the start
  endTime         DateTime      // full datetime for the end
  purpose         String
  numberOfPeople  Int
  notes           String?
  status          BookingStatus @default(PENDING)
  rejectionReason String?
  reviewedBy      String?       // admin user ID who approved/rejected
  reviewedAt      DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([roomId, date])
  @@index([userId])
  @@index([status])
}

enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

---

## 5. API Routes

### 5.1 Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new student account |
| POST | `/api/auth/[...nextauth]` | NextAuth.js handler (login/logout/session) |

### 5.2 Buildings & Maps
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/buildings` | List all buildings |
| GET | `/api/buildings/[id]/floors` | List floors for a building |
| GET | `/api/floors/[id]` | Get floor details with room list |
| GET | `/api/floors/[id]/availability?date=&startTime=&endTime=` | Get all rooms on a floor with availability status |

### 5.3 Rooms
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/rooms/[id]` | Get room details + equipment |
| GET | `/api/rooms/[id]/availability?date=` | Get full-day availability timeline (all 30-min slots) |

### 5.4 Bookings
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/bookings` | Submit a new booking request |
| GET | `/api/bookings/me` | Get current user's bookings |
| PATCH | `/api/bookings/[id]/cancel` | Cancel a booking (student) |
| GET | `/api/admin/bookings` | List all bookings (admin only) |
| GET | `/api/admin/bookings/pending` | List pending bookings (admin only) |
| PATCH | `/api/admin/bookings/[id]/approve` | Approve a booking (admin only) |
| PATCH | `/api/admin/bookings/[id]/reject` | Reject a booking (admin only) |

### 5.5 Admin — Room Management
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/rooms` | Create a room |
| PUT | `/api/admin/rooms/[id]` | Update room details |
| DELETE | `/api/admin/rooms/[id]` | Soft-delete / deactivate a room |

---

## 6. Page Structure

```
/                           → Landing / redirect to /map
/login                      → Login page
/register                   → Registration page
/map                        → Main map view (campus → building → floor)
/map/[buildingId]           → Building view (floor selector)
/map/[buildingId]/[floorId] → Floor plan with rooms
/room/[roomId]              → Room detail + availability + booking form
/bookings                   → Student: My bookings list
/admin                      → Admin dashboard (redirect to /admin/pending)
/admin/pending              → Pending booking requests
/admin/bookings             → All bookings calendar/table view
/admin/rooms                → Room management CRUD
/profile                    → User profile page
```

---

## 7. UI/UX Specifications

### 7.1 Layout
- **Header:** Logo, nav links (Map, My Bookings, Profile), login/logout.
- **Map Page:** Full-width map area with a collapsible filter bar on top (date, start time, end time). Breadcrumb navigation: Campus > Building A > Floor 2.
- **Room Detail:** Slide-in side panel (desktop) or full-screen modal (mobile).
- **Admin Dashboard:** Sidebar nav (Pending, All Bookings, Rooms) + main content area.

### 7.2 Responsive Design
- Desktop (≥1024px): Side panel for room details, full map visible.
- Tablet (768–1023px): Overlay modal for room details.
- Mobile (<768px): Full-screen views, stacked layout, pinch-to-zoom on maps.

### 7.3 Key Interactions
- **Map zoom:** Scroll-wheel on desktop, pinch on mobile. Building → Floor transitions are navigation events, not zoom.
- **Room selection:** Single click opens detail panel. Clicking another room swaps the panel content.
- **Time selection on timeline:** Click a block to select start. Click another to set end. Drag to select a range.
- **Notifications:** Toast messages for success/error states. In-app notification bell for booking status changes.

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Map SVGs should load in <1 second (optimized SVGs, lazy-loaded per floor).
- Availability queries should respond in <200ms.
- Client-side caching of building/floor/room metadata (changes infrequently).

### 8.2 Security
- Passwords hashed with bcrypt (salt rounds = 12).
- All API routes protected with session validation middleware.
- Admin routes require `role === 'ADMIN'` check.
- CSRF protection via NextAuth.js.
- Rate limiting on auth endpoints (5 attempts per minute).
- Input sanitization on all form fields.

### 8.3 Concurrency & Conflict Resolution
- Booking creation must check for time-slot conflicts at the database level.
- Use a database transaction with row-level locking when creating bookings to prevent double-booking race conditions.
- If a conflict is detected, return HTTP 409 with a clear message.

### 8.4 Accessibility
- All interactive map elements must be keyboard-navigable.
- ARIA labels on SVG room elements.
- Color coding supplemented with icons/patterns for color-blind users (e.g., "X" pattern on booked rooms).
- Minimum contrast ratio of 4.5:1 on all text.

---

## 9. MVP Scope vs. Future Enhancements

### 9.1 MVP (v1.0)
- [x] User registration & login (username/password)
- [x] Interactive SVG maps (buildings → floors → rooms)
- [x] Date/time filter with 30-min blocks
- [x] Room color coding (available/booked)
- [x] Room detail panel with availability timeline
- [x] Booking request form (name, ID, purpose, people, time)
- [x] Admin approval/rejection workflow
- [x] My Bookings page for students
- [x] Admin dashboard (pending queue, all bookings)
- [x] Basic room management (CRUD)

### 9.2 Future Enhancements (v2.0+)
- [ ] Email notifications on booking status changes
- [ ] Google Calendar / Outlook integration
- [ ] Recurring bookings
- [ ] Room search (by name, capacity, equipment)
- [ ] Booking analytics for admins (utilization reports)
- [ ] Super Admin role with user management
- [ ] Mobile app (React Native)
- [ ] QR code check-in at room entrance
- [ ] Auto-cancellation for no-shows
- [ ] Waitlist for popular rooms
- [ ] Bulk room import via CSV
- [ ] Multi-language support (i18n)

---

## 10. Development Milestones

| Phase | Scope | Estimated Duration |
|-------|-------|--------------------|
| 1 — Setup & Auth | Project scaffolding, DB setup, NextAuth, registration/login pages | 1 week |
| 2 — Maps & Navigation | Building/floor/room data models, SVG map rendering, breadcrumb navigation | 1.5 weeks |
| 3 — Availability & Filtering | Date/time filter, availability API, color-coded room states | 1 week |
| 4 — Room Detail & Booking | Room detail panel, timeline view, booking form, conflict detection | 1.5 weeks |
| 5 — Admin Dashboard | Pending queue, approve/reject flow, all bookings view, room management | 1.5 weeks |
| 6 — Polish & Testing | Responsive design, accessibility, error handling, testing, deployment | 1 week |
| **Total** | | **~7.5 weeks** |

---

## 11. Open Questions & Decisions Needed

1. **Map Assets:** Who will create the SVG floor plans? Will they be hand-drawn or derived from existing CAD/architectural drawings?
2. **Operating Hours:** Should the system enforce school operating hours (e.g., 07:00–22:00), or allow any time?
3. **Booking Duration Limit:** Max booking length (e.g., 4 hours)? Configurable per room?
4. **Email Service:** Which email provider for notifications in v2? (SendGrid, Resend, AWS SES?)
5. **Hosting:** Vercel (easiest for Next.js), self-hosted (school server), or cloud (AWS/GCP)?
6. **Data Privacy:** Any specific school policies on student data handling that must be respected?

---

*End of PRD*
