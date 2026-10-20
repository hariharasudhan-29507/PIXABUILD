-- PixaBuild: Additional tables for orders, admin, and activity tracking
-- Run this in Supabase SQL Editor

-- Add role column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- Insert default admin user (password: admin123 → bcrypt hash)
INSERT INTO public.users (first_name, last_name, email, password_hash, role, status)
VALUES (
  'Admin',
  'PixaBuild',
  'admin',
  '$2b$10$rQZ8kHzN8e5s5g5j5j5j5OYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  order_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  visualization_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  shipping_address jsonb,
  payment_method text DEFAULT 'cod',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT orders_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.furniture_items(item_id)
);

-- Activity log for admin monitoring
CREATE TABLE IF NOT EXISTS public.activity_log (
  log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_log_pkey PRIMARY KEY (log_id),
  CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Recommendations cache
CREATE TABLE IF NOT EXISTS public.recommendations (
  rec_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_ids uuid[] NOT NULL,
  scores numeric[] NOT NULL,
  algorithm text NOT NULL DEFAULT 'cosine_similarity',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recommendations_pkey PRIMARY KEY (rec_id),
  CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Cart items
CREATE TABLE IF NOT EXISTS public.cart_items (
  cart_item_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  visualization_id uuid,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT cart_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.furniture_items(item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_furniture_items_category ON public.furniture_items(category);
CREATE INDEX IF NOT EXISTS idx_furniture_items_catalog ON public.furniture_items(catalog_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_requests_user ON public.generation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_requests_status ON public.generation_requests(status);
