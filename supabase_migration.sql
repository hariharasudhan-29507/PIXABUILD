-- ============================================================
-- PixaBuild: Supabase Database Schema Migration
-- Run this in your Supabase Dashboard -> SQL Editor -> Click "Run"
-- ============================================================

-- 1. Ensure user columns exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- 2. Orders Table (Supports guest or member orders)
CREATE TABLE IF NOT EXISTS public.orders (
  order_id text PRIMARY KEY,
  user_id uuid REFERENCES public.users(user_id) ON DELETE SET NULL,
  total_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'Confirmed',
  shipping_address jsonb,
  payment_method text DEFAULT 'cod',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
  log_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(user_id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
  cart_item_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.furniture_items(item_id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  added_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. User Search History
CREATE TABLE IF NOT EXISTS public.user_search_history (
  history_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE,
  query text NOT NULL,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. Enable Row Level Security (RLS) & Public Policies for Anon Access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture_items ENABLE ROW LEVEL SECURITY;

-- Allow anon public read access to catalog
DO $$ BEGIN
  CREATE POLICY "Public read catalog" ON public.furniture_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow anon read/write to orders
DO $$ BEGIN
  CREATE POLICY "Public orders access" ON public.orders FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow anon logging
DO $$ BEGIN
  CREATE POLICY "Public activity logging" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow users access
DO $$ BEGIN
  CREATE POLICY "Public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
