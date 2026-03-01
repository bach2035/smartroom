-- Create enums
CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE booking_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role user_role DEFAULT 'STUDENT',
  student_class VARCHAR(100),
  student_id VARCHAR(100),
  facebook_link VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buildings table
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  svg_path VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Floors table
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  svg_path VARCHAR(255) NOT NULL,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL,
  description TEXT,
  svg_element_id VARCHAR(255) NOT NULL,
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Equipment junction table
CREATE TABLE room_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, equipment_id)
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_status DEFAULT 'PENDING',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  reject_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report enums
CREATE TYPE report_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE report_category AS ENUM ('EQUIPMENT_MALFUNCTION', 'DEVICE_MISSING', 'FURNITURE_DAMAGE', 'CLEANLINESS', 'OTHER');

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category report_category NOT NULL,
  status report_status DEFAULT 'OPEN',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Booking Guides table
CREATE TABLE room_booking_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
  instructions TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  approval_steps JSONB DEFAULT '[]'::jsonb,
  document_url TEXT,
  document_name VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking Attachments table
CREATE TABLE booking_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(255),
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_bookings_room_time ON bookings(room_id, start_time, end_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_floors_building ON floors(building_id);
CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_reports_room ON reports(room_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_room_booking_guides_room ON room_booking_guides(room_id);
CREATE INDEX idx_booking_attachments_booking ON booking_attachments(booking_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_booking_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for simplicity - you can make these more restrictive)
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON buildings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON floors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON room_equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON room_booking_guides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON booking_attachments FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Smart Course Trading
-- ============================================

CREATE TYPE trade_listing_status AS ENUM ('OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE trade_match_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');
CREATE TYPE trade_course_type AS ENUM ('HAVE', 'WANT');

-- Trade listings
CREATE TABLE trade_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status trade_listing_status DEFAULT 'OPEN',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses attached to a listing
CREATE TABLE trade_listing_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES trade_listings(id) ON DELETE CASCADE,
  course_name VARCHAR(255) NOT NULL,
  course_code VARCHAR(50) NOT NULL,
  class_code VARCHAR(50),
  section VARCHAR(50),
  schedule VARCHAR(255),
  credits INTEGER,
  type trade_course_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proposed matches between two listings
CREATE TABLE trade_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_a_id UUID NOT NULL REFERENCES trade_listings(id) ON DELETE CASCADE,
  listing_b_id UUID NOT NULL REFERENCES trade_listings(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status trade_match_status DEFAULT 'PENDING',
  completed_by_a BOOLEAN DEFAULT false,
  completed_by_b BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_a_id, listing_b_id)
);

-- Chat messages within a match
CREATE TABLE trade_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES trade_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading indexes
CREATE INDEX idx_trade_listings_user ON trade_listings(user_id);
CREATE INDEX idx_trade_listings_status ON trade_listings(status);
CREATE INDEX idx_trade_listing_courses_listing ON trade_listing_courses(listing_id);
CREATE INDEX idx_trade_listing_courses_code ON trade_listing_courses(course_code);
CREATE INDEX idx_trade_matches_listing_a ON trade_matches(listing_a_id);
CREATE INDEX idx_trade_matches_listing_b ON trade_matches(listing_b_id);
CREATE INDEX idx_trade_matches_status ON trade_matches(status);
CREATE INDEX idx_trade_messages_match ON trade_messages(match_id);
CREATE INDEX idx_trade_messages_created ON trade_messages(created_at);

-- Enable RLS
ALTER TABLE trade_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_listing_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_messages ENABLE ROW LEVEL SECURITY;

-- Permissive policies (same pattern as existing tables)
CREATE POLICY "Allow all" ON trade_listings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON trade_listing_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON trade_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON trade_messages FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Course Catalog
-- ============================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON courses FOR ALL USING (true) WITH CHECK (true);
