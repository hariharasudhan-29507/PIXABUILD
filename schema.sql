-- =====================================================================
-- PixaBuild Database Schema (Supabase / PostgreSQL)
-- As specified in Appendix B.3, Tables 3.3 - 3.7 of PixaBuild Report
-- =====================================================================

-- Enable pgcrypto / uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. USERS TABLE (Table 3.4 & Appendix B.3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ---------------------------------------------------------------------
-- 2. ORDERS TABLE (Table 3.5 & Appendix B.3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    order_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    total_price NUMERIC NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'Confirmed', 'Dispatched', 'Delivered')),
    shipping_address JSONB NOT NULL,
    payment_method TEXT DEFAULT 'cod',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user order history lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ---------------------------------------------------------------------
-- 3. ACTIVITY LOG TABLE (Table 3.6 & Appendix B.3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
    id TEXT PRIMARY KEY DEFAULT ('act-' || floor(extract(epoch from now()) * 1000)::text),
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for recent activity stream
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity_log(created_at DESC);

-- ---------------------------------------------------------------------
-- 4. USER SEARCH HISTORY TABLE (Table 3.7 & Appendix B.3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_search_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for recommendation engine context queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.user_search_history(user_id);

-- ---------------------------------------------------------------------
-- 5. CATALOGUE TABLE (Table 3.3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.catalog (
    item_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(48) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    dimensions VARCHAR(48) NOT NULL,
    cutout_url VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    stock_count INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES (Chapter 3.7.5 & Section 2.2)
-- ---------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;

-- Allow public read access to catalog
CREATE POLICY "Public catalog read access"
    ON public.catalog FOR SELECT
    USING (true);

-- Allow public sign-up and authentication lookups
CREATE POLICY "Public user insert"
    ON public.users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public user select for auth"
    ON public.users FOR SELECT
    USING (true);

-- Allow order creation and customer reading
CREATE POLICY "Allow order creation"
    ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow order reading"
    ON public.orders FOR SELECT
    USING (true);

-- Allow activity logging
CREATE POLICY "Allow activity logging"
    ON public.activity_log FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow activity viewing"
    ON public.activity_log FOR SELECT
    USING (true);

-- Allow search recording
CREATE POLICY "Allow search recording"
    ON public.user_search_history FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow search reading"
    ON public.user_search_history FOR SELECT
    USING (true);

-- ---------------------------------------------------------------------
-- DEMO SEED DATA
-- ---------------------------------------------------------------------
INSERT INTO public.users (user_id, first_name, last_name, email, password_hash, role, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Admin',
    'PixaBuild',
    'admin',
    'admin123',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;
