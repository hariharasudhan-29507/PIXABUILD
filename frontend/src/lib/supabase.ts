import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yxrrsxewozrbaatocclu.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// App State Management for Search History & Cart in Local Storage
export interface UserSession {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "user" | "admin";
  status: "active" | "locked";
}

export interface CartItem {
  cart_id: string;
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  color: string;
}

export const STORAGE_KEYS = {
  USER: "pixabuild_user",
  SEARCH_HISTORY: "pixabuild_searches",
  CART: "pixabuild_cart",
  USERS_LIST: "pixabuild_admin_users",
  ACTIVITY_LOG: "pixabuild_activity_log",
  ORDERS: "pixabuild_orders",
};

// Initial admin seed
export const DEFAULT_ADMIN: UserSession = {
  user_id: "admin-super-01",
  email: "admin",
  first_name: "Admin",
  last_name: "PixaBuild",
  role: "admin",
  status: "active",
};

// Helper to log user/admin activity
export function recordActivity(action: string, details: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
    const logs = raw ? JSON.parse(raw) : [];
    const currentUser = getCurrentUser();
    
    const entry = {
      id: "act-" + Date.now(),
      action,
      user_id: currentUser ? currentUser.user_id : "anonymous",
      user_email: currentUser ? currentUser.email : "guest@pixabuild.local",
      details,
      created_at: new Date().toISOString(),
    };
    logs.unshift(entry);
    // keep latest 100 entries
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    console.error("Failed to record activity", err);
  }
}

// Get current logged-in user
export function getCurrentUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Set current user
export function setCurrentUser(user: UserSession | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    recordActivity("USER_LOGIN", { email: user.email, role: user.role });
  } else {
    recordActivity("USER_LOGOUT");
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

// Record search query in search history
export function saveSearchQuery(query: string, category?: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    const searches: string[] = raw ? JSON.parse(raw) : [];
    const trimmed = query.trim();
    // remove duplicate and add to front
    const updated = [trimmed, ...searches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated));
    recordActivity("SEARCH_PERFORMED", { query: trimmed, category });
  } catch (err) {
    console.error("Failed to save search", err);
  }
}

// Get search history
export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
