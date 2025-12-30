-- Insert sample users
INSERT INTO "User" ("id", "email", "name") VALUES
  ('u_alice', 'alice@example.com', 'Alice'),
  ('u_bob', 'bob@example.com', 'Bob');

-- Insert sample services
INSERT INTO "Service" ("id", "title", "description", "price", "sellerId") VALUES
  ('s_haircut', 'Haircut Basic', 'A quick trim and style', 2000, 'u_alice'),
  ('s_photo', 'Photography Session', '1 hour portrait session', 5000, 'u_bob');

-- Insert a sample appointment
INSERT INTO "Appointment" ("id", "serviceId", "buyerId", "datetime", "status") VALUES
  ('a1', 's_haircut', 'u_bob', now() + interval '1 day', 'confirmed');

-- Verify rows (optional)
SELECT * FROM "User";
SELECT * FROM "Service";
SELECT * FROM "Appointment";
