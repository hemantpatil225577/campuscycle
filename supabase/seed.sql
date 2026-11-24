-- CampusCycle Demo Seed Script
-- NOTE: Clearly marked demo listings (is_demo = TRUE).
-- Before running in Supabase SQL Editor, create demo auth users in Supabase Auth
-- or replace the sample owner_id UUIDs with actual auth.users IDs from your project.

DO $$
DECLARE
  v_demo_owner_cse UUID := '00000000-0000-4000-8000-000000000101';
  v_demo_owner_ece UUID := '00000000-0000-4000-8000-000000000102';
  v_demo_owner_me  UUID := '00000000-0000-4000-8000-000000000103';
BEGIN
  -- Ensure demo profiles exist only if matching auth.users rows exist
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_demo_owner_cse) THEN
    INSERT INTO public.profiles (id, full_name, email, college, branch, semester, role, email_verified)
    VALUES
      (v_demo_owner_cse, 'Demo Senior (CSE)', 'demo.cse@campuscycle.edu', 'CampusCycle Demo Institute', 'CSE', 6, 'student', TRUE)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.items (
      owner_id, title, description, category, branch, semester, condition,
      exchange_type, price, estimated_retail_price, quantity, is_available, is_demo
    )
    VALUES
      (
        v_demo_owner_cse,
        'Data Structures & Algorithms (CLRS, 4th Ed) [DEMO]',
        'Demo listing: Hardcover CLRS textbook with clean pages and handwritten graph-theory summary notes tucked inside.',
        'Textbooks', 'CSE', 3, 'Like New', 'Lend', 250, 1895, 1, TRUE, TRUE
      ),
      (
        v_demo_owner_cse,
        'Database Management Systems (Korth & Silberschatz) [DEMO]',
        'Demo listing: Essential DBMS reference covering B+ trees, normalization, and transaction concurrency.',
        'Textbooks', 'IT', 4, 'Good', 'Sell', 380, 1250, 1, TRUE, TRUE
      ),
      (
        v_demo_owner_cse,
        'Higher Engineering Mathematics (B.S. Grewal) [DEMO]',
        'Demo listing: Covers Laplace transforms, vector calculus, and partial differential equations for Sem 1-3.',
        'Textbooks', 'CSE', 2, 'Good', 'Donate', 0, 995, 1, TRUE, TRUE
      );
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_demo_owner_ece) THEN
    INSERT INTO public.profiles (id, full_name, email, college, branch, semester, role, email_verified)
    VALUES
      (v_demo_owner_ece, 'Demo Senior (ECE)', 'demo.ece@campuscycle.edu', 'CampusCycle Demo Institute', 'ECE', 7, 'student', TRUE)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.items (
      owner_id, title, description, category, branch, semester, condition,
      exchange_type, price, estimated_retail_price, quantity, is_available, is_demo
    )
    VALUES
      (
        v_demo_owner_ece,
        'Casio fx-991EX ClassWiz Scientific Calculator [DEMO]',
        'Demo listing: Exam-approved non-programmable scientific calculator with protective slide case and fresh battery.',
        'Engineering Tools', 'ECE', 1, 'Like New', 'Sell', 550, 1495, 1, TRUE, TRUE
      ),
      (
        v_demo_owner_ece,
        'Arduino Uno & Breadboard Electronics Lab Toolkit [DEMO]',
        'Demo listing: Complete embedded lab kit with 830-pin breadboard, jumper wires, resistors, and digital multimeter.',
        'Lab Equipment', 'ECE', 4, 'Good', 'Lend', 300, 2400, 1, TRUE, TRUE
      );
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_demo_owner_me) THEN
    INSERT INTO public.profiles (id, full_name, email, college, branch, semester, role, email_verified)
    VALUES
      (v_demo_owner_me, 'Demo Senior (ME/CE)', 'demo.mech@campuscycle.edu', 'CampusCycle Demo Institute', 'ME', 5, 'student', TRUE)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.items (
      owner_id, title, description, category, branch, semester, condition,
      exchange_type, price, estimated_retail_price, quantity, is_available, is_demo
    )
    VALUES
      (
        v_demo_owner_me,
        'Full-Sleeve Cotton Chemistry Lab Coat (Size M) [DEMO]',
        'Demo listing: Freshly laundered white cotton lab coat with splash-resistant safety goggles.',
        'Lab Equipment', 'CE', 1, 'Like New', 'Donate', 0, 850, 1, TRUE, TRUE
      ),
      (
        v_demo_owner_me,
        'Precision Steel Mini-Drafter & A1 Sheet Holder [DEMO]',
        'Demo listing: Smooth acrylic L-scale drafter with protractor head and waterproof drawing tube.',
        'Engineering Tools', 'ME', 1, 'Like New', 'Lend', 150, 980, 1, TRUE, TRUE
      );
  END IF;
END $$;
