-- Seed Equipment
INSERT INTO equipment (name, icon) VALUES
  ('Projector', 'projector'),
  ('Whiteboard', 'whiteboard'),
  ('Screen', 'screen'),
  ('Microphone', 'microphone'),
  ('Computer', 'computer'),
  ('Video Conference', 'video');

-- Seed Users (passwords are hashed 'admin123' and 'student123')
INSERT INTO users (username, email, password, full_name, role) VALUES
  ('admin', 'admin@school.edu', '$2b$12$0ojnKa21IgA7YSfnrgIoP.RX0niut/..NyP0XlHkG7YtQGvoeK.Mm', 'System Administrator', 'ADMIN'),
  ('john.doe', 'john.doe@student.school.edu', '$2b$12$XvjsB1/N4uXXQlp.g4pAduhQvACrR3igcWZuY0rWUjeWHqOwyvyw2', 'John Doe', 'STUDENT'),
  ('jane.smith', 'jane.smith@student.school.edu', '$2b$12$XvjsB1/N4uXXQlp.g4pAduhQvACrR3igcWZuY0rWUjeWHqOwyvyw2', 'Jane Smith', 'STUDENT');

-- Seed Buildings
INSERT INTO buildings (name, description) VALUES
  ('Building A', 'Main academic building with classrooms and labs'),
  ('Building B', 'Library and conference center');

-- Seed Floors for Building A
INSERT INTO floors (name, level, svg_path, building_id)
SELECT 'Ground Floor', 1, '/maps/floor-a1.svg', id FROM buildings WHERE name = 'Building A';

INSERT INTO floors (name, level, svg_path, building_id)
SELECT 'First Floor', 2, '/maps/floor-a2.svg', id FROM buildings WHERE name = 'Building A';

-- Seed Floor for Building B
INSERT INTO floors (name, level, svg_path, building_id)
SELECT 'Ground Floor', 1, '/maps/floor-b1.svg', id FROM buildings WHERE name = 'Building B';

-- Seed Rooms for Building A - Ground Floor
INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Lecture Hall 101', 'A101', 120, 'Large lecture hall with stadium seating', 'room-a101', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Classroom 102', 'A102', 40, 'Standard classroom with desks', 'room-a102', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Classroom 103', 'A103', 40, 'Standard classroom with desks', 'room-a103', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Meeting Room 104', 'A104', 12, 'Small meeting room with conference table', 'room-a104', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Computer Lab 105', 'A105', 30, 'Computer lab with 30 workstations', 'room-a105', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Study Room 106', 'A106', 8, 'Quiet study room for small groups', 'room-a106', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 1;

-- Seed Rooms for Building A - First Floor
INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Science Lab 201', 'A201', 24, 'Equipped science laboratory', 'room-a201', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 2;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Classroom 202', 'A202', 35, 'Standard classroom', 'room-a202', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 2;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Classroom 203', 'A203', 35, 'Standard classroom', 'room-a203', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 2;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Art Studio 204', 'A204', 20, 'Art studio with natural lighting', 'room-a204', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 2;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Music Room 205', 'A205', 15, 'Soundproofed music practice room', 'room-a205', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building A' AND f.level = 2;

-- Seed Rooms for Building B - Ground Floor
INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Auditorium', 'B101', 200, 'Main auditorium for events and presentations', 'room-b101', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building B' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Conference Room', 'B102', 20, 'Professional conference room', 'room-b102', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building B' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Library', 'B103', 80, 'Main library with study areas', 'room-b103', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building B' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Study Room B104', 'B104', 6, 'Small private study room', 'room-b104', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building B' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Group Study B105', 'B105', 10, 'Group study and collaboration room', 'room-b105', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building B' AND f.level = 1;

INSERT INTO rooms (name, room_number, capacity, description, svg_element_id, floor_id)
SELECT 'Multimedia Room', 'B106', 25, 'Multimedia room with AV equipment', 'room-b106', f.id
FROM floors f JOIN buildings b ON f.building_id = b.id
WHERE b.name = 'Building B' AND f.level = 1;

-- Seed Room Equipment
INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'A101' AND e.name = 'Projector';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'A101' AND e.name = 'Screen';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 2 FROM rooms r, equipment e WHERE r.room_number = 'A101' AND e.name = 'Microphone';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'A102' AND e.name = 'Projector';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'A102' AND e.name = 'Whiteboard';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 30 FROM rooms r, equipment e WHERE r.room_number = 'A105' AND e.name = 'Computer';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'A105' AND e.name = 'Projector';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'B102' AND e.name = 'Video Conference';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'B102' AND e.name = 'Projector';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'B102' AND e.name = 'Whiteboard';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 2 FROM rooms r, equipment e WHERE r.room_number = 'B101' AND e.name = 'Projector';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 2 FROM rooms r, equipment e WHERE r.room_number = 'B101' AND e.name = 'Screen';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 4 FROM rooms r, equipment e WHERE r.room_number = 'B101' AND e.name = 'Microphone';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 1 FROM rooms r, equipment e WHERE r.room_number = 'B106' AND e.name = 'Projector';

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 10 FROM rooms r, equipment e WHERE r.room_number = 'B106' AND e.name = 'Computer';

-- Seed Sample Bookings (times are rounded to 30-min slots)
INSERT INTO bookings (title, description, start_time, end_time, status, user_id, room_id)
SELECT 'Study Group Session', 'Weekly study group for Math 101',
       (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours')::timestamptz,
       (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12 hours')::timestamptz,
       'PENDING', u.id, r.id
FROM users u, rooms r WHERE u.username = 'john.doe' AND r.room_number = 'A106';

INSERT INTO bookings (title, description, start_time, end_time, status, user_id, room_id, approved_by, approved_at)
SELECT 'Project Presentation', 'Final project presentation for CS 301',
       (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours')::timestamptz,
       (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '16 hours')::timestamptz,
       'APPROVED', u.id, r.id, admin.id, NOW()
FROM users u, rooms r, users admin
WHERE u.username = 'john.doe' AND r.room_number = 'A102' AND admin.username = 'admin';

INSERT INTO bookings (title, description, start_time, end_time, status, user_id, room_id)
SELECT 'Club Meeting', 'Photography club weekly meeting',
       (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours')::timestamptz,
       (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '17 hours')::timestamptz,
       'PENDING', u.id, r.id
FROM users u, rooms r WHERE u.username = 'jane.smith' AND r.room_number = 'B105';
