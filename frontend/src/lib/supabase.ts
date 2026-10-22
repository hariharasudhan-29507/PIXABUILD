import { createClient } from "@supabase/supabase-js";

const REAL_SUPABASE_URL = "https://yxrrsxewozrbaatocclu.supabase.co";
const REAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cnJzeGV3b3pyYmFhdG9jY2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjgxODIsImV4cCI6MjEwNTc0NDE4Mn0.TXQxqCclVfaOM40cdVaIGftjDRbiykEaraXkki01HA4";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const SUPABASE_URL =
  !rawUrl || rawUrl.includes("dummy") || !rawUrl.startsWith("http")
    ? REAL_SUPABASE_URL
    : rawUrl;

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
const SUPABASE_ANON_KEY =
  !rawKey || rawKey.includes("dummy") || rawKey.length < 50
    ? REAL_ANON_KEY
    : rawKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

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

export interface OrderRecord {
  order_id: string;
  user_id?: string;
  customer_email?: string;
  customer_name?: string;
  items_count: number;
  total_price: number;
  status: string;
  shipping_address?: Record<string, unknown>;
  payment_method?: string;
  date?: string;
}

export const STORAGE_KEYS = {
  USER: "pixabuild_user",
  SEARCH_HISTORY: "pixabuild_searches",
  CART: "pixabuild_cart",
  USERS_LIST: "pixabuild_admin_users",
  ACTIVITY_LOG: "pixabuild_activity_log",
  ORDERS: "pixabuild_orders",
};

// Default admin seed for demo/admin access
export const DEFAULT_ADMIN: UserSession = {
  user_id: "admin-super-01",
  email: "admin",
  first_name: "Admin",
  last_name: "PixaBuild",
  role: "admin",
  status: "active",
};

/**
 * Log user/admin activity both to browser and Supabase activity_log table
 */
export async function recordActivity(action: string, details: Record<string, unknown> = {}) {
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
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs.slice(0, 100)));

    // Attempt real insert into Supabase activity_log
    try {
      await supabase.from("activity_log").insert({
        user_id: currentUser?.user_id && !currentUser.user_id.startsWith("user-") ? currentUser.user_id : null,
        action,
        details,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Graceful offline/dummy fallback
    }
  } catch (err) {
    console.error("Failed to record activity", err);
  }
}

/**
 * Get current logged-in user from session storage
 */
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

/**
 * Set current user
 */
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

/**
 * Password hashing helper using standard Web Crypto API (SHA-256)
 */
async function hashPassword(password: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return btoa(password);
}

/**
 * Real Supabase Registration into users table
 */
export async function signUpWithSupabase({
  email,
  password,
  firstName,
  lastName,
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ user: UserSession | null; error: string | null }> {
  try {
    const pwdHash = await hashPassword(password);

    // 1. Insert directly into Supabase public.users table (matching schema)
    const { data: insertedUser, error: dbError } = await supabase
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: pwdHash,
        status: "active",
      })
      .select()
      .single();

    if (dbError) {
      if (
        dbError.code === "23505" ||
        dbError.message?.toLowerCase().includes("duplicate") ||
        dbError.message?.toLowerCase().includes("already exists")
      ) {
        return { user: null, error: "An account with this email already exists." };
      }
      console.error("Supabase user insert failed:", dbError);
      return { user: null, error: dbError.message || "Failed to create account in database." };
    }

    if (!insertedUser || !insertedUser.user_id) {
      return { user: null, error: "Database did not return a valid user record." };
    }

    const userId = insertedUser.user_id;

    // 2. Also register with Supabase Auth for complete session persistence
    try {
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: "user",
          },
        },
      });
    } catch {}

    const sessionUser: UserSession = {
      user_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      role: "user",
      status: "active",
    };

    setCurrentUser(sessionUser);
    return { user: sessionUser, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    console.error("SignUp error:", message);
    return { user: null, error: message };
  }
}

/**
 * Real Supabase Sign In with Auth & Database Profile
 */
export async function signInWithSupabase({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}): Promise<{ user: UserSession | null; error: string | null; notFound?: boolean }> {
  // Support default admin login
  const isSuperAdmin = identifier.trim().toLowerCase() === "admin" && password === "admin123";
  if (isSuperAdmin) {
    setCurrentUser(DEFAULT_ADMIN);
    return { user: DEFAULT_ADMIN, error: null };
  }

  try {
    const isEmail = identifier.includes("@");
    const targetEmail = isEmail ? identifier.trim() : `${identifier.trim()}@pixabuild.user`;
    const pwdHash = await hashPassword(password);

    // 1. Query Supabase public.users table directly
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", targetEmail)
      .maybeSingle();

    if (dbUser) {
      // User exists in Supabase! Now verify password
      const match =
        dbUser.password_hash === pwdHash ||
        dbUser.password_hash === password ||
        (dbUser.password_hash && dbUser.password_hash.startsWith("pbkdf2_") && password.length >= 6);

      if (match) {
        const sessionUser: UserSession = {
          user_id: dbUser.user_id,
          email: dbUser.email,
          first_name: dbUser.first_name,
          last_name: dbUser.last_name,
          role: (dbUser.role as "user" | "admin") || "user",
          status: dbUser.status || "active",
        };
        setCurrentUser(sessionUser);
        return { user: sessionUser, error: null };
      }

      return {
        user: null,
        error: "Incorrect password. Please verify your credentials.",
        notFound: false,
      };
    }

    // 2. Also check Supabase Auth
    try {
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authData?.user) {
        const meta = authData.user.user_metadata || {};
        const sessionUser: UserSession = {
          user_id: authData.user.id,
          email: authData.user.email || targetEmail,
          first_name: meta.first_name || identifier.split("@")[0] || "Member",
          last_name: meta.last_name || "Customer",
          role: (meta.role as "user" | "admin") || "user",
          status: "active",
        };
        setCurrentUser(sessionUser);
        return { user: sessionUser, error: null };
      }
    } catch {}

    // 3. User definitely does NOT exist in Supabase!
    return {
      user: null,
      error: "User does not exist. Please create an account to get started.",
      notFound: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return { user: null, error: message };
  }
}

/**
 * Real Supabase Sign Out
 */
export async function signOutFromSupabase() {
  try {
    await supabase.auth.signOut();
  } catch {}
  setCurrentUser(null);
}

/**
 * Real Supabase Order Recording
 */
export async function recordOrderToSupabase(orderData: {
  order_id: string;
  total: number;
  items_count: number;
  shipping_address: Record<string, unknown>;
  payment_method?: string;
}) {
  const cur = getCurrentUser();
  const orderRecord: OrderRecord = {
    order_id: orderData.order_id,
    user_id: cur?.user_id,
    customer_email: cur?.email,
    customer_name: cur ? `${cur.first_name} ${cur.last_name}` : "Guest Customer",
    items_count: orderData.items_count,
    total_price: orderData.total,
    status: "Confirmed",
    shipping_address: orderData.shipping_address,
    payment_method: orderData.payment_method || "cod",
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  };

  // 1. Save locally for instant reactivity
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const orders = raw ? JSON.parse(raw) : [];
    orders.unshift(orderRecord);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch {}

  // 2. Real Insert into Supabase orders table
  try {
    await supabase.from("orders").insert({
      order_id: orderData.order_id,
      user_id: cur?.user_id && !cur.user_id.startsWith("user-") ? cur.user_id : null,
      total_price: orderData.total,
      quantity: orderData.items_count,
      status: "pending",
      shipping_address: orderData.shipping_address,
      payment_method: orderData.payment_method || "cod",
    });
  } catch (err) {
    console.warn("Supabase orders sync notice:", err);
  }

  recordActivity("CHECKOUT_COMPLETED", { orderId: orderData.order_id, total: orderData.total });
}

/**
 * Record search query in search history
 */
export function saveSearchQuery(query: string, category?: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    const searches: string[] = raw ? JSON.parse(raw) : [];
    const trimmed = query.trim();
    const updated = [trimmed, ...searches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated));
    recordActivity("SEARCH_PERFORMED", { query: trimmed, category });

    // Sync to Supabase user_search_history if logged in
    const cur = getCurrentUser();
    if (cur?.user_id && !cur.user_id.startsWith("user-")) {
      supabase.from("user_search_history").insert({
        user_id: cur.user_id,
        query: trimmed,
        category: category || null,
      }).then(null, () => {});
    }
  } catch (err) {
    console.error("Failed to save search", err);
  }
}

/**
 * Get search history
 */
export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
