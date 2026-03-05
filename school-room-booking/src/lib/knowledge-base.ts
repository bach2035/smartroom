// Knowledge base chunks for the Smart School support chat RAG system
// Each chunk covers one specific topic so vector search returns focused context

export const KNOWLEDGE_CHUNKS = [
  // === GENERAL ===
  {
    topic: 'app-overview',
    content: `Smart School is a university web app with two main products: "Room Booking" and "Course Trading". Students switch between them using the product switcher dropdown in the top-left of the header. The app is used by university students to book rooms and trade courses with each other.`,
  },
  {
    topic: 'navigation-room-booking',
    content: `When "Room Booking" is selected in the product switcher, the navigation bar shows three tabs: "Book" (find and book rooms), "My Bookings" (view your bookings and their status), and "My Reports" (view issues you reported about rooms).`,
  },
  {
    topic: 'navigation-course-trading',
    content: `When "Course Trading" is selected in the product switcher, the navigation bar shows three tabs: "Browse" (see listings from other students), "My Listings" (manage your own listings), and "My Matches" (see trades and requests you are involved in).`,
  },
  {
    topic: 'notifications',
    content: `The notification bell icon is in the top-right corner of the header. It shows updates like: booking approved/rejected, trade proposal received/accepted/rejected, new chat messages in a match, and trade completion confirmations. Click the bell to see all notifications. Unread notifications show a red badge with the count.`,
  },
  {
    topic: 'profile',
    content: `To update your profile, click your name in the top-right corner of the header, then go to your profile page. You can update your full name, email address, phone number, class, and student ID. This contact information is shown to other students when you create trade listings.`,
  },

  // === ROOM BOOKING ===
  {
    topic: 'how-to-book-room',
    content: `How to book a room step by step: 1) Click "Book" in the navigation bar. 2) You see a search form with Date, From time, and To time fields. 3) Click "Find Available Rooms" to see which rooms are free for your selected time. 4) Alternatively, click on a building name to browse its floors. 5) Click on a floor to see the interactive map. 6) On the map, grey rooms are available, red rooms are booked, dark grey rooms are under maintenance. 7) Click a grey (available) room. 8) You are taken to the room booking page. 9) Select your date and pick time slots (30-minute increments, from 07:00 to 22:00). 10) Add a reason or purpose for your booking. 11) Click "Submit Booking". 12) Your booking starts as PENDING — an admin must approve it. 13) You get a notification when it is approved or rejected.`,
  },
  {
    topic: 'room-map-colors',
    content: `On the interactive floor map, rooms are color-coded: Light grey means the room is available and can be booked. Red means the room is already booked by someone. Dark grey means the room is under maintenance and cannot be booked. Click on a grey room to start booking it. Click on a red room to see who booked it and when.`,
  },
  {
    topic: 'booking-time-slots',
    content: `Room bookings use 30-minute time slots. Available times range from 07:00 (7 AM) to 22:00 (10 PM). When booking, you select a start time and end time. The system checks for conflicts — you cannot book a room that is already booked for overlapping times. If there is a conflict, the system will show an error.`,
  },
  {
    topic: 'booking-status',
    content: `Booking statuses: PENDING means your booking is waiting for admin approval. APPROVED means the admin approved it and the room is reserved for you. REJECTED means the admin rejected your booking (a reason may be provided). CANCELLED means you cancelled the booking yourself. You can only cancel bookings that are still PENDING.`,
  },
  {
    topic: 'check-my-bookings',
    content: `To check your bookings: Click "My Bookings" in the navigation bar. You see a list of all your bookings with their status (PENDING, APPROVED, REJECTED, CANCELLED). You can click on any booking to see its details including the room, date, time, and status. You can cancel a PENDING booking by clicking on it and pressing the "Cancel Booking" button.`,
  },
  {
    topic: 'report-room-issue',
    content: `To report a room issue: Click "My Reports" in the navigation bar. Click "New Report" button. Select the room that has an issue. Describe the problem (for example: broken projector, dirty room, broken AC, etc.). Submit the report. An admin will review it. You can check the status of your reports on the "My Reports" page.`,
  },
  {
    topic: 'find-available-rooms',
    content: `To find available rooms: Go to the "Book" page. Enter your desired date, start time, and end time in the search form. Click "Find Available Rooms". The system shows a list of rooms that are free during your selected time period. You can then click on any room to book it. This is useful when you don't care which specific room you get — you just need any available room.`,
  },

  // === COURSE TRADING ===
  {
    topic: 'course-trading-overview',
    content: `Course Trading lets students swap courses with each other. There are two listing types: "Trade" (swap your course for someone else's) and "Giveaway" (give away a course for free). The Browse page has two tabs: "Trading" shows trade listings, "Giveaways" shows free courses. The system automatically matches trade listings when your HAVE courses match someone else's WANT courses and vice versa.`,
  },
  {
    topic: 'create-trade-listing',
    content: `How to create a trade listing: 1) Click "My Listings" in the navigation bar. 2) Click "+ New Listing" button. 3) Select "Trade" as the listing type. 4) Under "Courses I HAVE", select a course from the dropdown, and enter the class code (required). Click "+ Add Course" to add more courses. 5) Under "Courses I WANT", do the same for courses you want to receive. 6) Optionally add notes about the trade. 7) Click "Create Listing". Your listing is now visible to other students on the Browse page.`,
  },
  {
    topic: 'create-giveaway-listing',
    content: `How to create a giveaway listing: 1) Click "My Listings" in the navigation bar. 2) Click "+ New Listing" button. 3) Select "Giveaway" as the listing type. 4) Select ONE course you want to give away, and enter the class code (required). 5) Optionally add notes. 6) Click "Create Listing". Your giveaway appears on the "Giveaways" tab of the Browse page. Anyone can request it — you choose who gets it.`,
  },
  {
    topic: 'browse-listings',
    content: `The Browse page shows listings from other students. It has two tabs at the top: "Trading" shows trade listings (where you swap courses), and "Giveaways" shows courses being given away for free. You can search listings by course name, course code, or student name using the search bar. Click on any listing to see its details.`,
  },
  {
    topic: 'suggested-matches',
    content: `When you have an open trade listing, the Browse page shows a "Suggested for You" section at the top. These are listings that match your courses — meaning their HAVE courses overlap with your WANT courses, and their WANT courses overlap with your HAVE courses. You can click "Propose Trade" directly on a suggested match. This section only appears for trade listings, not giveaways.`,
  },
  {
    topic: 'propose-trade',
    content: `How to propose a trade: 1) Go to the Browse page (click "Browse" in the nav). 2) Look at the "Suggested for You" section or browse listings. 3) Click on a listing to see its details. 4) If you have one listing, click "Propose Trade" directly. If you have multiple listings, select which one to trade with from the dropdown. 5) Optionally add a message. 6) Your proposal is sent. The other person gets a notification. 7) Wait for them to accept or reject.`,
  },
  {
    topic: 'request-giveaway',
    content: `How to request a giveaway course: 1) Go to the Browse page. 2) Click the "Giveaways" tab. 3) Click on a giveaway listing to see details. 4) You can add an optional message. 5) Click "Request This Course". 6) The button changes to "Requested" to show you already requested it. 7) The owner gets a notification and decides who gets the course. You do NOT need your own listing to request a giveaway — anyone can request.`,
  },
  {
    topic: 'manage-listings',
    content: `To manage your listings: Go to "My Listings". You see all your listings with their status (OPEN, MATCHED, COMPLETED, CANCELLED). Click on a listing to see details. For OPEN listings you can: Edit the listing (change courses or notes), Cancel the listing (permanently), or Find Matches (for trade listings only — shows compatible listings). You cannot edit or cancel listings that are already MATCHED or COMPLETED.`,
  },
  {
    topic: 'my-matches',
    content: `To see your trades and requests: Click "My Matches" in the navigation bar. You see all your matches including pending proposals, accepted trades, completed trades, and rejected proposals. Click on a match to see the full detail page with the other person's info, courses involved, and the chat.`,
  },
  {
    topic: 'accept-reject-proposal',
    content: `When someone proposes a trade or requests your giveaway, you get a notification. Go to "My Matches" and click on the pending match. You see the other person's details and the courses involved. Click "Accept" to accept the proposal or "Reject" to decline it. After accepting, both parties can chat and coordinate the exchange.`,
  },
  {
    topic: 'trade-chat',
    content: `After a trade proposal is accepted, both parties can chat with each other. Go to "My Matches", click on the accepted match, and you'll see a chat section. Type your message and press Enter or click Send. Use the chat to coordinate the course swap details. Chat is only available for accepted and completed matches, not pending ones.`,
  },
  {
    topic: 'complete-trade',
    content: `How to complete a trade: After the swap is done in real life, go to "My Matches" and click on the match. Click "Mark as Completed" button. IMPORTANT: Both parties must confirm completion separately. The trade is only fully finalized when BOTH people click "Mark as Completed". You can undo your completion if you made a mistake by clicking "Undo". Once both confirm, the match status changes to COMPLETED.`,
  },
  {
    topic: 'listing-course-fields',
    content: `When creating a listing, each course requires: Course name (select from dropdown), Course code (auto-filled from dropdown), and Class code (you must type this — it's required and marked with a red asterisk *). The course dropdown shows all courses available in the university catalog. If your course is not in the list, contact an admin to add it.`,
  },
]
