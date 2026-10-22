"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { STORAGE_KEYS } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

interface ActivityItem {
  id: string;
  action: string;
  user_email: string;
  created_at: string;
  details?: Record<string, unknown>;
}

const generationData = [
  { day: "Mon", requests: 24, composites: 22, avgLatencyMs: 380 },
  { day: "Tue", requests: 38, composites: 35, avgLatencyMs: 410 },
  { day: "Wed", requests: 52, composites: 49, avgLatencyMs: 395 },
  { day: "Thu", requests: 46, composites: 44, avgLatencyMs: 420 },
  { day: "Fri", requests: 68, composites: 65, avgLatencyMs: 390 },
  { day: "Sat", requests: 84, composites: 81, avgLatencyMs: 370 },
  { day: "Sun", requests: 92, composites: 88, avgLatencyMs: 360 },
];

const modelDistribution = [
  { model: "SAM Seg", latency: 280, share: 30 },
  { model: "Depth Anything V2", latency: 340, share: 35 },
  { model: "ControlNet SD", latency: 620, share: 25 },
  { model: "Harmonizer", latency: 120, share: 10 },
];

export default function AdminDashboardPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(14);
  const [totalRevenue, setTotalRevenue] = useState<number>(8420);

  useEffect(() => {
    try {
      const rawAct = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
      if (rawAct) setActivities(JSON.parse(rawAct));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-heading text-[var(--color-forest-charcoal)]">
            SYSTEM TELEMETRY & OBSERVABILITY
          </h1>
          <p className="text-xs text-[var(--color-muted-taupe)]">
            Live neural inference metrics, user operations, and spatial furniture orders.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-sage-green)] font-medium">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Supabase Realtime Stream: Healthy</span>
        </div>
      </div>

      {/* 4 KPI Cards (Equal spacing) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted-taupe)]">
            <span>Total Generations</span>
            <Sparkles className="h-4 w-4 text-[var(--color-terracotta)]" />
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--color-forest-charcoal)]">
            1,482
          </div>
          <div className="text-[11px] text-[var(--color-sage-green)] font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>+18.4% this week</span>
          </div>
        </div>

        <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted-taupe)]">
            <span>Active Profiles</span>
            <Users className="h-4 w-4 text-[var(--color-sage-green)]" />
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--color-forest-charcoal)]">
            328
          </div>
          <div className="text-[11px] text-[var(--color-muted-taupe)]">
            0 locked profiles
          </div>
        </div>

        <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted-taupe)]">
            <span>IKEA Items Cataloged</span>
            <Layers className="h-4 w-4 text-[var(--color-forest-charcoal)]" />
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--color-forest-charcoal)]">
            36
          </div>
          <div className="text-[11px] text-[var(--color-sage-green)]">
            valexande/IKEA-Dataset synced
          </div>
        </div>

        <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted-taupe)]">
            <span>Spatial Orders Gross</span>
            <ShoppingBag className="h-4 w-4 text-[var(--color-terracotta)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-terracotta)]">
            {formatINR(totalRevenue)}
          </div>
          <div className="text-[11px] text-[var(--color-muted-taupe)]">
            {totalOrders} validated shipments
          </div>
        </div>
      </div>

      {/* Interactive Charts Section (2 Columns, Equal Spacing) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Visualizations Trend (7 cols) */}
        <div className="lg:col-span-7 pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading text-[var(--color-forest-charcoal)]">
                AI SPATIAL COMPOSITING VOLUME
              </h3>
              <p className="text-[11px] text-[var(--color-muted-taupe)]">
                Daily generation requests vs. finalized composites
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--color-muted-taupe)]">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6DFD2" vertical={false} />
                <XAxis dataKey="day" stroke="#8C7965" fontSize={11} tickLine={false} />
                <YAxis stroke="#8C7965" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F7F5F0",
                    borderColor: "rgba(48,53,45,0.2)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#78816A"
                  fill="#78816A"
                  fillOpacity={0.25}
                  name="Requests"
                />
                <Area
                  type="monotone"
                  dataKey="composites"
                  stroke="#B96E4B"
                  fill="#B96E4B"
                  fillOpacity={0.2}
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Model Latency Breakdown (5 cols) */}
        <div className="lg:col-span-5 pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading text-[var(--color-forest-charcoal)]">
                NEURAL LATENCY PROFILING (MS)
              </h3>
              <p className="text-[11px] text-[var(--color-muted-taupe)]">
                Execution speed per neural stage
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E6DFD2" />
                <XAxis type="number" stroke="#8C7965" fontSize={10} tickLine={false} unit="ms" />
                <YAxis type="category" dataKey="model" stroke="#30352D" fontSize={11} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F7F5F0",
                    borderColor: "rgba(48,53,45,0.2)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="latency" fill="#30352D" radius={[0, 4, 4, 0]} name="Latency ms" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Action Activity Stream */}
      <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--color-terracotta)]" />
            <h3 className="text-sm font-heading text-[var(--color-forest-charcoal)]">
              LIVE PLATFORM EVENT STREAM
            </h3>
          </div>
          <span className="text-[11px] font-accent text-[var(--color-muted-taupe)]">
            Auto-Refreshed
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--color-muted-taupe)]">
            No actions logged in current browser session yet. Interacting with the catalog, searches, or visualizer logs events here automatically.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] max-h-72 overflow-y-auto">
            {activities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--color-warm-ivory)] border border-[var(--border-subtle)] text-[var(--color-forest-charcoal)] font-semibold">
                    {act.action}
                  </span>
                  <span className="text-[var(--color-forest-charcoal)]">
                    {act.user_email}
                  </span>
                  {act.details && (
                    <span className="text-[11px] text-[var(--color-muted-taupe)] truncate max-w-xs">
                      {JSON.stringify(act.details)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-muted-taupe)] font-mono shrink-0">
                  {new Date(act.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
