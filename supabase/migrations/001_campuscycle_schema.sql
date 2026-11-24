-- CampusCycle PostgreSQL + Supabase Schema Migration
-- Includes UUID PKs, foreign keys, constraints, indexes, triggers, Storage policies, and Row Level Security.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL UNIQUE,
  college TEXT NOT NULL DEFAULT 'National Institute of Engineering & Technology',
  branch TEXT NOT NULL CHECK (branch IN ('CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other')),
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  contact_details TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_sem ON public.profiles(branch, semester);

-- ============================================================================
-- 2. ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 160),
  description TEXT NOT NULL CHECK (char_length(trim(description)) BETWEEN 10 AND 2000),
  category TEXT NOT NULL CHECK (category IN ('Textbooks', 'Lab Equipment', 'Engineering Tools', 'Stationery', 'Other')),
  branch TEXT NOT NULL CHECK (branch IN ('CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other')),
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  condition TEXT NOT NULL CHECK (condition IN ('Like New', 'Good', 'Fair')),
  exchange_type TEXT NOT NULL CHECK (exchange_type IN ('Sell', 'Lend', 'Donate')),
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  estimated_retail_price INTEGER NOT NULL DEFAULT 500 CHECK (estimated_retail_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 50),
  image_url TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'flagged', 'removed')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_donate_zero_price CHECK (exchange_type <> 'Donate' OR price = 0)
);

CREATE INDEX IF NOT EXISTS idx_items_owner ON public.items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_catalog_filter
  ON public.items(branch, semester, category, condition, exchange_type, is_available, moderation_status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC);

-- ============================================================================
-- 3. REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 3 AND 1000),
  status TEXT NOT NULL DEFAULT 'Requested' CHECK (
    status IN (
      'Requested',
      'Accepted',
      'Reserved',
      'Pickup Scheduled',
      'Handed Over',
      'Completed',
      'Cancelled',
      'Rejected'
    )
  ),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_no_self_request CHECK (borrower_id <> owner_id)
);

CREATE INDEX IF NOT EXISTS idx_requests_item ON public.requests(item_id);
CREATE INDEX IF NOT EXISTS idx_requests_owner ON public.requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_requests_borrower ON public.requests(borrower_id);

-- Prevent duplicate active requests from the same borrower on the same item
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_borrower_request
  ON public.requests(item_id, borrower_id)
  WHERE status IN ('Requested', 'Accepted', 'Reserved', 'Pickup Scheduled', 'Handed Over');

-- Prevent conflicting accepted/reserved requests on the same item
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reserved_item_request
  ON public.requests(item_id)
  WHERE status IN ('Accepted', 'Reserved', 'Pickup Scheduled', 'Handed Over');

-- ============================================================================
-- 4. PICKUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.requests(id) ON DELETE CASCADE,
  pickup_point TEXT NOT NULL CHECK (
    pickup_point IN ('College Library', 'Canteen', 'Department Office', 'Main Gate', 'Hostel Courtyard', 'Other')
  ),
  pickup_date DATE NOT NULL,
  pickup_time TEXT NOT NULL,
  instructions TEXT DEFAULT '',
  updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickups_request ON public.pickups(request_id);

-- ============================================================================
-- 5. HANDOVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.requests(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Requested' CHECK (
    status IN (
      'Requested',
      'Accepted',
      'Reserved',
      'Pickup Scheduled',
      'Handed Over',
      'Completed',
      'Cancelled'
    )
  ),
  owner_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  borrower_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  owner_confirmed_at TIMESTAMPTZ,
  borrower_confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_completed_requires_both CHECK (
    status <> 'Completed' OR (owner_confirmed = TRUE AND borrower_confirmed = TRUE)
  )
);

CREATE INDEX IF NOT EXISTS idx_handovers_participants ON public.handovers(owner_id, borrower_id);
CREATE INDEX IF NOT EXISTS idx_handovers_status ON public.handovers(status);

-- ============================================================================
-- 6. REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) BETWEEN 3 AND 160),
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Reviewed', 'Resolved', 'Dismissed')),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_item ON public.reports(item_id);

-- ============================================================================
-- 7. UPDATED_AT TRIGGER & ADMIN HELPER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
  );
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_items_updated ON public.items;
CREATE TRIGGER trg_items_updated BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_requests_updated ON public.requests;
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_pickups_updated ON public.pickups;
CREATE TRIGGER trg_pickups_updated BEFORE UPDATE ON public.pickups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_handovers_updated ON public.handovers;
CREATE TRIGGER trg_handovers_updated BEFORE UPDATE ON public.handovers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated ON public.reports;
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT USING (is_active = TRUE OR id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'student');

CREATE POLICY "profiles_update_self_no_escalation" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR (
      auth.uid() = id
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- Items RLS
CREATE POLICY "items_select_public" ON public.items
  FOR SELECT USING (moderation_status = 'active' OR owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "items_insert_owner" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "items_update_owner_or_admin" ON public.items
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "items_delete_owner_or_admin" ON public.items
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- Requests RLS
CREATE POLICY "requests_select_participants" ON public.requests
  FOR SELECT USING (
    auth.uid() = borrower_id OR auth.uid() = owner_id OR public.is_admin()
  );

CREATE POLICY "requests_insert_borrower" ON public.requests
  FOR INSERT WITH CHECK (
    auth.uid() = borrower_id
    AND borrower_id <> owner_id
    AND EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.owner_id = owner_id AND i.is_available = TRUE AND i.moderation_status = 'active'
    )
  );

CREATE POLICY "requests_update_participants" ON public.requests
  FOR UPDATE USING (
    auth.uid() = borrower_id OR auth.uid() = owner_id OR public.is_admin()
  );

-- Pickups RLS
CREATE POLICY "pickups_select_participants" ON public.pickups
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND (r.borrower_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

CREATE POLICY "pickups_upsert_participants" ON public.pickups
  FOR ALL USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND (r.borrower_id = auth.uid() OR r.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND (r.borrower_id = auth.uid() OR r.owner_id = auth.uid())
    )
  );

-- Handovers RLS
CREATE POLICY "handovers_select_participants" ON public.handovers
  FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() = borrower_id OR public.is_admin()
  );

CREATE POLICY "handovers_update_participants" ON public.handovers
  FOR UPDATE USING (
    auth.uid() = owner_id OR auth.uid() = borrower_id OR public.is_admin()
  );

-- Reports RLS
CREATE POLICY "reports_insert_authenticated" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_own_or_admin" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());

CREATE POLICY "reports_update_admin_only" ON public.reports
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKET & POLICIES (campus-items)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campus-items',
  'campus-items',
  TRUE,
  2097152, -- 2 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "campus_items_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'campus-items');

CREATE POLICY "campus_items_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'campus-items'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "campus_items_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'campus-items'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
