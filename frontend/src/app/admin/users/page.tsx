"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Lock,
  Unlock,
  Shield,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Search
} from "lucide-react";
import { z } from "zod";
import { supabase, STORAGE_KEYS, recordActivity, UserSession, DEFAULT_ADMIN } from "@/lib/supabase";

const userCreateSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["user", "admin"]),
});

const INITIAL_USERS: UserSession[] = [
  {
    user_id: "usr-101",
    email: "admin",
    first_name: "Master",
    last_name: "Admin",
    role: "admin",
    status: "active",
  },
  {
    user_id: "usr-102",
    email: "elena.lindqvist@ikea.design",
    first_name: "Elena",
    last_name: "Lindqvist",
    role: "user",
    status: "active",
  },
  {
    user_id: "usr-103",
    email: "marcus.karlsson@interior.se",
    first_name: "Marcus",
    last_name: "Karlsson",
    role: "user",
    status: "active",
  },
  {
    user_id: "usr-104",
    email: "clara.becker@berlin.de",
    first_name: "Clara",
    last_name: "Becker",
    role: "user",
    status: "locked",
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSession[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user" as "user" | "admin",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const mapped: UserSession[] = data.map((u: Record<string, unknown>) => ({
            user_id: String(u.user_id),
            email: String(u.email),
            first_name: String(u.first_name || "Member"),
            last_name: String(u.last_name || ""),
            role: (u.role as "user" | "admin") || "user",
            status: (u.status as "active" | "locked") || "active",
          }));
          if (!mapped.some((u) => u.email === "admin")) {
            mapped.unshift(DEFAULT_ADMIN);
          }
          setUsers(mapped);
          localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(mapped));
          return;
        }
      } catch (err) {
        console.warn("Supabase fetch users notice:", err);
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
        if (raw) {
          setUsers(JSON.parse(raw));
        } else {
          setUsers(INITIAL_USERS);
          localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(INITIAL_USERS));
        }
      } catch {
        setUsers(INITIAL_USERS);
      }
    }

    loadUsers();
  }, []);

  const saveUsers = (updated: UserSession[]) => {
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(updated));
  };

  const toggleLock = async (userId: string) => {
    const target = users.find((u) => u.user_id === userId);
    if (!target) return;
    if (target.email === "admin") {
      alert("Super Admin account cannot be locked.");
      return;
    }

    const newStatus = target.status === "active" ? "locked" : "active";
    const updated = users.map((u) => (u.user_id === userId ? { ...u, status: newStatus as "active" | "locked" } : u));
    saveUsers(updated);
    recordActivity("USER_STATUS_TOGGLED", { user_id: userId, email: target.email, newStatus });

    try {
      await supabase.from("users").update({ status: newStatus }).eq("user_id", userId);
    } catch {}
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const res = userCreateSchema.safeParse(newForm);
    if (!res.success) {
      const errMap: Record<string, string> = {};
      for (const err of res.error.issues) {
        if (err.path[0]) errMap[err.path[0] as string] = err.message;
      }
      setErrors(errMap);
      return;
    }

    const newUser: UserSession = {
      user_id: "usr-" + Math.floor(1000 + Math.random() * 9000),
      email: newForm.email,
      first_name: newForm.firstName,
      last_name: newForm.lastName,
      role: newForm.role,
      status: "active",
    };

    try {
      const { data } = await supabase
        .from("users")
        .insert({
          first_name: newForm.firstName,
          last_name: newForm.lastName,
          email: newForm.email,
          password_hash: "admin_created",
          status: "active",
        })
        .select()
        .single();

      if (data?.user_id) {
        newUser.user_id = data.user_id;
      }
    } catch (e) {
      console.warn("Supabase user create notice:", e);
    }

    const updated = [newUser, ...users];
    saveUsers(updated);
    recordActivity("USER_CREATED_BY_ADMIN", { email: newForm.email, role: newForm.role });
    setModalOpen(false);
    setNewForm({ firstName: "", lastName: "", email: "", role: "user" });
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-heading text-[var(--color-forest-charcoal)]">
            USER ACCESS & ACCOUNT CONTROL
          </h1>
          <p className="text-xs text-[var(--color-muted-taupe)]">
            Lock, unlock, and manage platform permissions directly in the database.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Provision New Account</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-taupe)]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by name or email..."
          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] pl-9 pr-3 py-2 text-xs"
        />
      </div>

      {/* Users Table */}
      <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--color-warm-ivory)] text-[var(--color-muted-taupe)] font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((u) => {
                const isLocked = u.status === "locked";
                return (
                  <tr key={u.user_id} className="hover:bg-[var(--color-warm-ivory)]/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--color-forest-charcoal)]">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--color-forest-charcoal)]">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.role === "admin"
                          ? "bg-[var(--color-terracotta)] text-white"
                          : "bg-[var(--color-warm-ivory)] text-[var(--color-forest-charcoal)] border border-[var(--border-subtle)]"
                      }`}>
                        {u.role === "admin" && <Shield className="h-2.5 w-2.5" />}
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isLocked
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {isLocked ? "LOCKED" : "ACTIVE"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.email !== "admin" && (
                        <button
                          onClick={() => toggleLock(u.user_id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-all ${
                            isLocked
                              ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                              : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Unlock className="h-3 w-3" />
                              <span>Unlock User</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              <span>Lock User</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="pixa-card bg-[var(--color-sand-beige)] max-w-md w-full space-y-4 shadow-xl border-[var(--border-strong)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-heading text-[var(--color-forest-charcoal)]">
                PROVISION PLATFORM USER
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xs text-[var(--color-muted-taupe)] hover:text-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-forest-charcoal)] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newForm.firstName}
                    onChange={(e) => setNewForm({ ...newForm, firstName: e.target.value })}
                    className="w-full rounded border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                  />
                  {errors.firstName && <p className="text-[10px] text-red-600 mt-0.5">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-forest-charcoal)] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newForm.lastName}
                    onChange={(e) => setNewForm({ ...newForm, lastName: e.target.value })}
                    className="w-full rounded border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                  />
                  {errors.lastName && <p className="text-[10px] text-red-600 mt-0.5">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-forest-charcoal)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  className="w-full rounded border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                />
                {errors.email && <p className="text-[10px] text-red-600 mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-forest-charcoal)] mb-1">
                  Role Permission
                </label>
                <select
                  value={newForm.role}
                  onChange={(e) => setNewForm({ ...newForm, role: e.target.value as "user" | "admin" })}
                  className="w-full rounded border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full Telemetry & User Control)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-1.5 px-4"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
