-- =====================================================================
-- PixaBuild Database Schema (Supabase / PostgreSQL)
-- As specified in Appendix B.3, Tables 3.3 - 3.7 of PixaBuild Report
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

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

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

CREATE TABLE IF NOT EXISTS public.activity_log (
    id TEXT PRIMARY KEY DEFAULT ('act-' || floor(extract(epoch from now()) * 1000)::text),
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity_log(created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_search_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.user_search_history(user_id);

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

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public catalog read access" ON public.catalog FOR SELECT USING (true);
CREATE POLICY "Public user insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public user select for auth" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow order creation" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow order reading" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow activity logging" ON public.activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow activity viewing" ON public.activity_log FOR SELECT USING (true);
CREATE POLICY "Allow search recording" ON public.user_search_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow search reading" ON public.user_search_history FOR SELECT USING (true);

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
