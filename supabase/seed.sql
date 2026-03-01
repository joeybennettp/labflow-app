-- ============================================
-- LabFlow Seed Data
-- Sample doctors, cases, and default settings.
-- ============================================

-- Sample doctors
INSERT INTO doctors (id, name, practice, email, phone) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Dr. Sarah Chen', 'Bright Smile Dental', 'chen@brightsmile.com', '(555) 100-2001'),
  ('d1000000-0000-0000-0000-000000000002', 'Dr. Michael Torres', 'Torres Family Dentistry', 'torres@torresfamily.com', '(555) 100-2002'),
  ('d1000000-0000-0000-0000-000000000003', 'Dr. Priya Patel', 'Downtown Dental Group', 'patel@downtowndental.com', '(555) 100-2003'),
  ('d1000000-0000-0000-0000-000000000004', 'Dr. James Whitfield', 'Whitfield Orthodontics', 'whitfield@whitfieldortho.com', '(555) 100-2004');

-- Sample cases
INSERT INTO cases (case_number, patient, doctor_id, type, shade, status, rush, due, price, notes, invoiced) VALUES
  ('C-4571', 'Margaret Thompson', 'd1000000-0000-0000-0000-000000000001', 'Zirconia Crown', 'A2', 'in_progress', false, CURRENT_DATE + INTERVAL '3 days', 285.00, 'Upper right first molar. Patient prefers high-translucency zirconia.', false),
  ('C-4572', 'Robert Garcia', 'd1000000-0000-0000-0000-000000000002', 'PFM Bridge', 'B1', 'received', true, CURRENT_DATE + INTERVAL '1 day', 950.00, '3-unit bridge #3-5. RUSH - patient traveling.', false),
  ('C-4573', 'Susan Williams', 'd1000000-0000-0000-0000-000000000001', 'E.max Veneer', 'BL2', 'quality_check', false, CURRENT_DATE + INTERVAL '5 days', 420.00, 'Veneer set #6-11. Match to existing #5. Photos attached.', false),
  ('C-4574', 'David Kim', 'd1000000-0000-0000-0000-000000000003', 'Implant Crown', 'A3', 'ready', false, CURRENT_DATE, 375.00, 'Implant #14, Nobel Active NP. Screw-retained.', false),
  ('C-4575', 'Patricia Martinez', 'd1000000-0000-0000-0000-000000000002', 'Full Denture', 'A2', 'in_progress', false, CURRENT_DATE + INTERVAL '7 days', 1200.00, 'Upper complete denture. Ivoclar teeth. Setup appointment scheduled.', false),
  ('C-4576', 'James Anderson', 'd1000000-0000-0000-0000-000000000004', 'Night Guard', '-', 'shipped', false, CURRENT_DATE - INTERVAL '1 day', 150.00, 'Hard/soft dual laminate. Delivered via UPS.', true),
  ('C-4577', 'Linda Brown', 'd1000000-0000-0000-0000-000000000003', 'Zirconia Crown', 'C2', 'received', false, CURRENT_DATE + INTERVAL '4 days', 285.00, 'Lower left second premolar. Monolithic.', false),
  ('C-4578', 'Michael Davis', 'd1000000-0000-0000-0000-000000000001', 'Custom Abutment', 'A3.5', 'in_progress', true, CURRENT_DATE + INTERVAL '2 days', 310.00, 'Titanium abutment #8. Straumann BLT RC. RUSH.', false),
  ('C-4579', 'Jennifer Wilson', 'd1000000-0000-0000-0000-000000000004', 'Surgical Guide', '-', 'quality_check', false, CURRENT_DATE + INTERVAL '6 days', 225.00, 'Full arch guide for implants #7, #8, #10.', false),
  ('C-4580', 'Richard Taylor', 'd1000000-0000-0000-0000-000000000002', 'PFM Crown', 'D3', 'received', false, CURRENT_DATE + INTERVAL '8 days', 245.00, 'Upper right canine. High noble metal.', false),
  ('C-4581', 'Barbara Jones', 'd1000000-0000-0000-0000-000000000003', 'E.max Crown', 'A1', 'in_progress', false, CURRENT_DATE + INTERVAL '4 days', 320.00, 'Central incisor #9. Ultra-thin prep.', false),
  ('C-4582', 'Thomas Moore', 'd1000000-0000-0000-0000-000000000001', 'Partial Denture', 'B2', 'received', false, CURRENT_DATE + INTERVAL '10 days', 875.00, 'Lower partial with precision attachments. Chrome cobalt frame.', false);

-- Default lab settings
INSERT INTO lab_settings (lab_name) VALUES ('My Dental Lab');
