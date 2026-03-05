// Knowledge base for the Smart School support chat
// Each chunk covers one specific topic with accurate UI details

export const KNOWLEDGE_CHUNKS = [
  // === GENERAL ===
  {
    topic: 'app-overview',
    content: `Smart School is a university web app with two products: "Room Booking" and "Course Trading". You switch between them using the product switcher dropdown in the top-left of the header. The header also has a notification bell (top-right) and your profile avatar with username and role.`,
  },
  {
    topic: 'navigation-room-booking',
    content: `When "Room Booking" is selected, the navigation bar shows: "Book" (find and book rooms), "My Bookings" (view your bookings), and "My Reports" (view issues you reported). Admin users also see an "Admin" link.`,
  },
  {
    topic: 'navigation-course-trading',
    content: `When "Course Trading" is selected, the navigation bar shows: "Browse" (see listings from others), "My Listings" (manage your own listings), and "My Matches" (see trades and requests). My Matches shows a red badge with pending count. Admin users also see "Admin" and "Courses" links.`,
  },

  // === ROOM BOOKING ===
  {
    topic: 'how-to-book-room',
    content: `How to book a room step by step:
1) Click "Book" in the navigation bar. You see a page titled "Book a Room" with a search form.
2) Fill in: Date, From time, and To time (30-minute increments, 07:00 to 22:00).
3) Click "Find Available Rooms" to see rooms free for your time.
4) Results show rooms grouped by building, each showing room name, number, capacity, floor, and equipment count.
5) Click a room to go to its booking page.
6) On the booking page, select your date, then click time slots on the availability timeline (green = available, grey = booked).
7) Enter a Booking Title (e.g. "Study Group Session").
8) Optionally add a Description and attach files (PDF, JPG, PNG, DOC — max 10MB each).
9) Click "Submit Booking Request".
10) Your booking starts as PENDING — an admin must approve it.
11) You get a notification when it is approved or rejected.`,
  },
  {
    topic: 'alternative-booking-via-map',
    content: `You can also book a room by browsing the interactive floor map. On the "Book" page, click a building name to see its floors. Click a floor to see the interactive SVG map. On the map: light grey rooms are available (click to book), red rooms are already booked (click to see booking details), and dark grey rooms are under maintenance. Click an available (grey) room to go to its booking page.`,
  },
  {
    topic: 'booking-form-details',
    content: `The room booking page shows: room name, number, capacity, building, floor, and equipment list. On the right side there are Booking Tips: "Select your preferred time slot below", "Bookings require admin approval", "Check your bookings page for status". The availability timeline shows 30-minute slots from 7:00 to 22:00. Green slots are available, grey slots are taken. Click to select your time range. Fill in the title (required) and optional description, then click "Submit Booking Request".`,
  },
  {
    topic: 'booking-status',
    content: `Booking statuses: PENDING (yellow badge) = waiting for admin approval. APPROVED (green badge) = admin approved, room is reserved. REJECTED (red badge) = admin rejected (a reason may be shown in a red box). CANCELLED (grey badge) = you cancelled the booking yourself.`,
  },
  {
    topic: 'check-my-bookings',
    content: `To check your bookings: Click "My Bookings" in the nav bar. You see a list of all your bookings. You can search by title or room name, filter by date, building, or status tabs (All, Upcoming, Pending, Expired, Approved, Completed, Rejected, Cancelled). Click any booking to see its details including room, date, time, status, description, and attachments. If the booking was rejected, the rejection reason appears in a red box.`,
  },
  {
    topic: 'cancel-booking',
    content: `To cancel a booking: Go to "My Bookings", click on the booking, and press the red "Cancel Booking" button at the bottom. You can only cancel bookings that are PENDING or APPROVED and in the future. A confirmation dialog will ask "Cancel this booking?" with options "Keep Booking" or "Cancel Booking".`,
  },
  {
    topic: 'no-bookings-yet',
    content: `If you have no bookings yet, the My Bookings page shows a guide: 1) Browse the interactive floor map, 2) Select an available room and pick a time, 3) Submit your booking for admin approval. There's a "Browse Rooms" button to get started.`,
  },

  // === REPORTS ===
  {
    topic: 'report-room-issue',
    content: `To report a room issue:
1) Click "My Reports" in the nav bar.
2) Click the "New Report" button (top right).
3) Step 1 — Select the room: choose a Building, then Floor, then Room from the dropdowns (or click a room card).
4) Step 2 — Fill in the report: enter a Title (required), select a Category (Equipment Malfunction, Device Missing, Furniture Damage, Cleanliness, or Other), and optionally add a Description.
5) Click "Submit Report".
Your reports appear on the "My Reports" page with status tabs: All, Open, In Progress, Resolved, Closed.`,
  },

  // === COURSE TRADING ===
  {
    topic: 'course-trading-overview',
    content: `Course Trading lets students swap courses or give them away. There are two listing types: "Trade" (swap your course for someone else's) and "Giveaway" (give away a course for free). The Browse page has two tabs at the top: "TRADE" shows trade listings, "GIVEAWAY" shows free courses. You can search by course name, code, or student name, and filter by course code.`,
  },
  {
    topic: 'create-trade-listing',
    content: `How to create a trade listing:
1) Click "My Listings" in the nav bar.
2) Click "+ New Listing" or "Create New Listing" button.
3) Select "TRADE" as the listing type (shown as "Swap courses with others").
4) Under "Courses I HAVE (to trade away)" (green label): select a course from the searchable dropdown, enter the Class Code (required, marked with *). Click "+ Add Course" to add more.
5) Under "Courses I WANT (to receive)" (blue label): do the same for courses you want.
6) Optionally add notes about the trade.
7) Click "Create Listing".
Your listing is now visible on the Browse page under the TRADE tab.`,
  },
  {
    topic: 'create-giveaway-listing',
    content: `How to create a giveaway listing:
1) Click "My Listings" in the nav bar.
2) Click "+ New Listing" button.
3) Select "GIVEAWAY" as the listing type (shown as "Give a course to someone").
4) Select ONE course to give away from the dropdown (emerald/green label), enter the Class Code (required).
5) Optionally add notes.
6) Click "Create Listing".
Your giveaway appears on the Browse page under the GIVEAWAY tab. Anyone can request it.`,
  },
  {
    topic: 'browse-listings',
    content: `The Browse page shows listings from other students. It has two tabs: "TRADE" (default) for course swaps, and "GIVEAWAY" for free courses. Each listing card shows: the student's name, class, student ID, courses they HAVE (green tags), courses they WANT (blue tags, trades only), and status. You can search by course name, code, or student name using the search bar, and filter by course code.`,
  },
  {
    topic: 'suggested-matches',
    content: `If you have an open trade listing, the Browse page shows a "Suggested for You" section at the top with up to 4 compatible listings. These are listings where their HAVE courses match your WANT courses, and their WANT courses match your HAVE courses. You can click "View Details" or "Propose Trade" directly. This section only appears on the TRADE tab, not giveaways.`,
  },
  {
    topic: 'propose-trade',
    content: `How to propose a trade:
1) Go to Browse page (click "Browse" in the nav).
2) Look at "Suggested for You" or browse listings under the TRADE tab.
3) Click "View Details" on a listing, or click "Propose Trade" directly.
4) If you have multiple open listings, select which one to trade with.
5) Optionally add a message.
6) Your proposal is sent. The other person gets a notification.
7) Wait for them to accept or reject on their "My Matches" page.`,
  },
  {
    topic: 'request-giveaway',
    content: `How to request a giveaway course:
1) Go to Browse page.
2) Click the "GIVEAWAY" tab.
3) Click on a giveaway listing.
4) Click "Request" button.
5) The button changes to "Requested" to show you already requested it.
6) The owner gets a notification and decides who gets the course.
You do NOT need your own listing to request a giveaway — anyone can request.`,
  },
  {
    topic: 'manage-listings',
    content: `To manage your listings: Go to "My Listings". You see all your listings with their type badge (TRADE in blue, GIVEAWAY in green) and status (OPEN, MATCHED, COMPLETED, CANCELLED). Click a listing to see details. For OPEN listings you can: Edit (change courses or notes), Cancel (permanently removes it), or view Suggested Matches (trade listings only). You cannot edit or cancel listings that are already MATCHED or COMPLETED.`,
  },
  {
    topic: 'my-matches',
    content: `To see your trades and requests: Click "My Matches" in the nav bar. You see status tabs: Pending, Accepted, Completed, Rejected, Cancelled. Each match card shows the type ("Trade" or "Course Request"), the other person's name, courses involved, and status. Click "Open" to go to the match detail page.`,
  },
  {
    topic: 'accept-reject-proposal',
    content: `When someone proposes a trade or requests your giveaway, you get a notification. Go to "My Matches" and click the pending match. You see the other person's details and the courses involved. If they proposed to you, you see a banner: "{name} has proposed a trade with you." Click "Accept" (green) to accept or "Reject" (red) to decline. After accepting, both parties can chat and coordinate.`,
  },
  {
    topic: 'trade-chat',
    content: `After a trade is accepted, both parties can chat. Go to "My Matches", click the accepted match, and you see a chat section. Your messages appear on the right (red background), their messages on the left (grey). Type your message and press Enter or click the send button. Chat is available for ACCEPTED and COMPLETED matches, not pending ones.`,
  },
  {
    topic: 'complete-trade',
    content: `How to complete a trade: After the swap is done in real life, go to "My Matches" and click the match. Click "Mark as Completed" (green button). IMPORTANT: Both parties must confirm completion separately. The match shows who has confirmed. You can click "Cancel Completion" if you made a mistake. Once both confirm, the match status changes to COMPLETED and the listings are also marked COMPLETED.`,
  },

  // === NOTIFICATIONS ===
  {
    topic: 'notifications',
    content: `The notification bell icon is in the top-right corner. It shows a red badge with unread count (or "99+" if many). Click it to see your notifications. Types include: trade proposal received/accepted/rejected, booking approved/rejected/cancelled, new chat messages, and trade completion updates. Click a notification to mark it as read and navigate to the relevant page. You can also click "Mark all as read".`,
  },

  // === PROFILE ===
  {
    topic: 'profile',
    content: `To update your profile: click your avatar/name in the top-right corner. You can edit: Full Name, Email, Phone (e.g. 0912345678), Facebook Link (optional), Class (e.g. "Grade 11A"), and Student ID (e.g. "STU-2024-001"). Click "Save Changes" to update. This contact info is shown to other students in trade matches.`,
  },

  // === SUPPORT CHAT ===
  {
    topic: 'support-chat',
    content: `The support chat is a floating button in the bottom-right corner of every page (red circle with chat icon). Click it to open the chat panel. You can type questions about the app or click one of the 4 suggested questions: "How do I book a room?", "How do I create a trade listing?", "How do I propose a trade?", "Where can I see my bookings?". Click the X button or the chat button again to close.`,
  },

  // === ACCOUNT & LOGIN ===
  {
    topic: 'account-registration',
    content: `To create a new account: Go to the registration page (click "Register" on the login page or go to /register). Fill in: Full Name, Username (3-20 characters, letters, numbers, underscores only), Email, Password (minimum 8 characters), and Confirm Password. Click "Create account". After registering, you are redirected to the login page to sign in. New accounts are created with the Student role by default.`,
  },
  {
    topic: 'account-login',
    content: `To log in, go to the login page and enter your username and password. If you don't have an account, click "Register" or "Sign up" to create one. If you forgot your password, contact your admin to reset it. After logging in, you are taken to the main page.`,
  },
  {
    topic: 'user-roles',
    content: `There are two user roles: Student and Administrator. Students can book rooms, report issues, create trade/giveaway listings, propose trades, request giveaways, and chat in matches. Administrators can do everything students can, plus: approve/reject bookings, manage rooms, manage users, manage reports, manage courses in the catalog, and view trading statistics. The admin panel is only visible to admin users.`,
  },

  // === ADMIN FEATURES ===
  {
    topic: 'admin-room-booking',
    content: `Admin features for Room Booking (accessible via the "Admin" link): "Pending Requests" shows all pending bookings grouped by room — admins can approve or reject each one (with an optional rejection reason). "All Bookings" shows every booking in the system. "Room Management" lets admins add, edit, or delete rooms, set room capacity, equipment, and maintenance status. "Issue Reports" shows all room issue reports submitted by students — admins can update the status (Open, In Progress, Resolved, Closed). "Admin Users" lets admins manage user accounts.`,
  },
  {
    topic: 'admin-course-trading',
    content: `Admin features for Course Trading: "Admin" dashboard shows trading statistics (total listings, matches, completion rate, top traded courses). "Courses" page lets admins manage the course catalog — add new courses (name + code), edit, or delete courses. The course catalog is what students see in the dropdown when creating listings. "Listings" and "Matches" pages let admins browse and manage all trade listings and matches in the system.`,
  },

  // === TIME & SCHEDULING ===
  {
    topic: 'time-and-scheduling',
    content: `All times in the app are displayed in GMT+7 (Bangkok/Vietnam timezone). Room bookings use 30-minute time slots. Available booking hours are from 07:00 (7 AM) to 22:00 (10 PM). When booking, you select a start time and end time on the availability timeline. The system prevents double-booking — you cannot book a room that already has an approved or pending booking for the same time.`,
  },

  // === FILE ATTACHMENTS ===
  {
    topic: 'file-attachments',
    content: `When submitting a room booking, you can attach files as supporting documents. Supported file types: PDF, JPG, PNG, GIF, WebP, DOC, and DOCX. Maximum file size: 10MB per file. You can attach multiple files. Files can be dragged and dropped into the upload area, or clicked to browse. You can remove attached files before submitting by clicking the X button on each file.`,
  },

  // === ERRORS & TROUBLESHOOTING ===
  {
    topic: 'booking-conflict',
    content: `If you try to book a room that is already booked for the same time, you will see a conflict error. This happens when another student's booking (PENDING or APPROVED) overlaps with your requested time. Solution: try a different time slot, or use "Find Available Rooms" to search for rooms that are free during your desired time.`,
  },
  {
    topic: 'duplicate-trade',
    content: `You cannot propose a trade to the same listing twice. If you already sent a proposal, the system will show an error. Check "My Matches" to see the status of your existing proposal. Similarly, you cannot request the same giveaway twice — the button shows "Requested" if you already requested it.`,
  },
  {
    topic: 'common-issues',
    content: `Common issues and solutions:
- "I can't find any available rooms" → Try a different date or time. Rooms are busiest during midday. Early morning (7-9 AM) and evening (7-10 PM) usually have more availability.
- "My booking was rejected" → Check the rejection reason in the booking details (red box). You can submit a new booking with corrections.
- "I can't edit my listing" → You can only edit OPEN listings. MATCHED or COMPLETED listings cannot be edited.
- "I don't see the course I need in the dropdown" → The course may not be in the catalog yet. Contact your admin to add it.
- "I can't chat in my match" → Chat is only available after both parties accept. Pending matches don't have chat.`,
  },

  // === THINGS THE APP DOES NOT DO (negative knowledge) ===
  {
    topic: 'not-supported-features',
    content: `Things the app does NOT support:
- No password reset by students (contact admin to reset)
- No direct messaging between students outside of trade matches
- No room booking without admin approval — all bookings start as PENDING
- No editing or cancelling bookings/listings that are already MATCHED or COMPLETED
- No booking rooms that are under maintenance (dark grey on the map)
- No trading courses without first creating a listing (except for requesting giveaways, which requires no listing)
- No multiple giveaway requests to the same listing`,
  },
  {
    topic: 'not-supported-payments',
    content: `The app does not involve any payments or fees. Room booking is free. Course trading is a peer-to-peer swap system with no monetary transactions. Giveaways are completely free — the owner simply gives the course to a requester.`,
  },

  // === GENERAL FAQ ===
  {
    topic: 'faq-general',
    content: `Frequently asked questions:
- "What is Smart School?" → A university web app for booking rooms and trading courses with other students.
- "Is it free?" → Yes, the app is completely free to use. No payments involved.
- "Who can use it?" → University students and administrators. Students can register their own accounts on the registration page.
- "What languages does the app support?" → The interface is in English, but you can write in any language in descriptions, notes, and chat messages.
- "How do I switch between Room Booking and Course Trading?" → Use the product switcher dropdown in the top-left corner of the header.
- "How do I log out?" → Click your profile avatar in the top-right corner and click "Sign out".`,
  },
  {
    topic: 'faq-contact',
    content: `If you need help that this chatbot cannot provide, contact your system administrator. The admin manages all accounts, room settings, course catalog, and booking approvals. You can find other students' contact information (name, email, class) on their trade match detail page after a trade is accepted.`,
  },
]
