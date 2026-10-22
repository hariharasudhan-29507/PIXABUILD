"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Filter,
  Trash2,
  Download,
  RefreshCw,
  Cpu,
  ShoppingCart,
  UserCheck,
  Package,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/supabase";

interface ActivityLogItem {
  id: string;
  action: string;
  user_id: string;
  user_email: string;
  details: Record<string, unknown>;
  created_at: string;
}

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: "act-1718000001",
    action: "AI_INFERENCE_SAM_SEGMENT",
    user_id: "usr-102",
    user_email: "elena.lindqvist@ikea.design",
    details: { photo_id: "ph-copenhagen-01", resolution: "1920x1080", latency_ms: 312 },
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: "act-1718000002",
    action: "AI_INFERENCE_DEPTH_ANYTHING",
    user_id: "usr-102",
    user_email: "elena.lindqvist@ikea.design",
    details: { model: "depth-anything-v2-large", floor_depth_min: 0.12, latency_ms: 450 },
    created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  },
  {
    id: "act-1718000003",
    action: "CHECKOUT_COMPLETED",
    user_id: "usr-103",
    user_email: "marcus.karlsson@interior.se",
    details: { orderId: "SE-883192", total: 789.0, itemsCount: 1 },
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "act-1718000004",
    action: "ADMIN_CATALOG_ITEM_ADDED",
    user_id: "admin-super-01",
    user_email: "admin",
    details: { name: "STOCKHOLM 2026 Velvet Armchair", price: 429 },
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "act-1718000005",
    action: "USER_LOGIN_SUCCESS",
    user_id: "admin-super-01",
    user_email: "admin",
    details: { method: "credentials", ip: "127.0.0.1", user_agent: "Mozilla/5.0" },
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "act-1718000006",
    action: "ROOM_PHOTO_UPLOADED",
    user_id: "usr-102",
    user_email: "elena.lindqvist@ikea.design",
    details: { file_name: "nordic_living_room.jpg", size_bytes: 284102 },
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0) {
          setLogs(parsed);
          return;
        }
      }
      setLogs(INITIAL_LOGS);
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(INITIAL_LOGS));
    } catch {
      setLogs(INITIAL_LOGS);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    if (confirm("Are you sure you want to clear the activity log?")) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify([]));
      setLogs([]);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pixabuild-activity-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(l.details).toLowerCase().includes(search.toLowerCase());

    if (filterType === "all") return matchesSearch;
    if (filterType === "ai") return matchesSearch && l.action.startsWith("AI_");
    if (filterType === "checkout") return matchesSearch && (l.action.includes("CHECKOUT") || l.action.includes("ORDER"));
    if (filterType === "admin") return matchesSearch && l.action.startsWith("ADMIN_");
    if (filterType === "user") return matchesSearch && (l.action.includes("USER") || l.action.includes("LOGIN"));
    return matchesSearch;
  });

  const getActionIcon = (action: string) => {
    if (action.startsWith("AI_")) return <Cpu className="w-3.5 h-3.5 text-blue-600" />;
    if (action.includes("CHECKOUT") || action.includes("ORDER")) return <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />;
    if (action.startsWith("ADMIN_")) return <Layers className="w-3.5 h-3.5 text-[#B96E4B]" />;
    return <UserCheck className="w-3.5 h-3.5 text-[#78816A]" />;
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("AI_")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (action.includes("CHECKOUT") || action.includes("ORDER")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (action.startsWith("ADMIN_")) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-stone-50 text-stone-700 border-stone-200";
  };

  const uniqueActors = new Set(logs.map((l) => l.user_email)).size;
  const aiInferenceCount = logs.filter((l) => l.action.startsWith("AI_")).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
            Audit & Telemetry
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#30352D] mt-0.5">
            SYSTEM ACTIVITY & TELEMETRY STREAM
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E6DFD2] rounded text-xs text-[#30352D] hover:bg-[#F7F5F0]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E6DFD2] rounded text-xs text-[#30352D] hover:bg-[#F7F5F0]"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Stream
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="pixa-card bg-[#FFFFFF] p-4">
          <span className="text-[10px] font-accent uppercase tracking-wider text-[#8C7965]">
            Telemetry Records
          </span>
          <div className="font-serif text-2xl text-[#30352D] mt-1">{logs.length}</div>
          <span className="text-[11px] text-[#78816A]">Buffered client & server events</span>
        </div>
        <div className="pixa-card bg-[#FFFFFF] p-4">
          <span className="text-[10px] font-accent uppercase tracking-wider text-[#8C7965]">
            Active Actors
          </span>
          <div className="font-serif text-2xl text-[#30352D] mt-1">{uniqueActors}</div>
          <span className="text-[11px] text-[#8C7965]">Distinct user & admin identities</span>
        </div>
        <div className="pixa-card bg-[#FFFFFF] p-4">
          <span className="text-[10px] font-accent uppercase tracking-wider text-[#8C7965]">
            AI Pipeline Dispatches
          </span>
          <div className="font-serif text-2xl text-blue-700 mt-1">{aiInferenceCount}</div>
          <span className="text-[11px] text-blue-600">SAM / Depth / ControlNet runs</span>
        </div>
        <div className="pixa-card bg-[#FFFFFF] p-4">
          <span className="text-[10px] font-accent uppercase tracking-wider text-[#8C7965]">
            Pipeline Health
          </span>
          <div className="font-serif text-2xl text-emerald-700 mt-1">99.8%</div>
          <span className="text-[11px] text-emerald-700">Zero unhandled exceptions</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="pixa-card bg-[#FFFFFF] p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7965]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action names, emails, payload parameters..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F5F0] border border-[#E6DFD2] rounded-md focus:outline-none focus:border-[#30352D]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All Events" },
            { id: "ai", label: "AI Pipeline" },
            { id: "checkout", label: "Commerce" },
            { id: "admin", label: "Admin Changes" },
            { id: "user", label: "Auth / Users" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === tab.id
                  ? "bg-[#30352D] text-white"
                  : "bg-[#F7F5F0] text-[#30352D] hover:bg-[#E6DFD2]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="pixa-card bg-[#FFFFFF] divide-y divide-[#E6DFD2]">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8C7965]">
            No activity records match your filter criteria.
          </div>
        ) : (
          filteredLogs.map((item) => {
            const isExpanded = expandedLogId === item.id;
            return (
              <div key={item.id} className="p-4 hover:bg-[#F7F5F0]/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded bg-[#F7F5F0] border border-[#E6DFD2]">
                      {getActionIcon(item.action)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionColor(
                            item.action
                          )}`}
                        >
                          {item.action}
                        </span>
                        <span className="text-xs font-medium text-[#30352D]">{item.user_email}</span>
                      </div>
                      <div className="text-[11px] text-[#8C7965] mt-1 font-mono">
                        {new Date(item.created_at).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "medium",
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                    className="flex items-center gap-1 text-xs text-[#8C7965] hover:text-[#30352D] font-medium"
                  >
                    <span>{isExpanded ? "Hide Details" : "View Payload"}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-3 rounded bg-[#30352D] text-[#E6DFD2] font-mono text-[11px] overflow-x-auto">
                    <pre>{JSON.stringify(item.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
