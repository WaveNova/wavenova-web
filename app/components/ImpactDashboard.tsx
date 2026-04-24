"use client";

import type { Metrics, Activity } from "@/lib/database.types";

const ALLOCATION = [
  { label: "Project Operations", pct: 87, color: "#059669" },
  { label: "WaveNova Management", pct: 10, color: "#24B5CB" },
  { label: "Payment Processing", pct: 3, color: "#9CA3AF" },
];

function DonutChart() {
  const radius = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = ALLOCATION.map((a) => {
    const dash = (a.pct / 100) * circumference;
    const gap = circumference - dash;
    const seg = { ...a, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E5E7EB" strokeWidth="20" />
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none" stroke={s.color} strokeWidth="20"
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize="11">85–90%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">to projects</text>
      </svg>
      <div className="space-y-2 w-full max-w-[180px]">
        {ALLOCATION.map((a) => (
          <div key={a.label} className="flex items-center gap-2 text-xs text-white/80">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
            <span className="flex-1">{a.label}</span>
            <span className="font-semibold text-white">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  metrics: Metrics | null;
  activities: Activity[];
}

export default function ImpactDashboard({ metrics, activities }: Props) {
  const m = metrics ?? { total_kg: 47823, active_stations: 5, workers_employed: 18, households_served: 340 };
  const feed = activities.length > 0 ? activities : [
    { id: "1", station_name: "Selong Belanak", action_text: "purchased 420 KG this week", created_at: "" },
    { id: "2", station_name: "Honest Impact", action_text: "river barrier intercepted 180 KG", created_at: "" },
    { id: "3", station_name: "Mawun", action_text: "first station collection — 95 KG", created_at: "" },
    { id: "4", station_name: "SBCA upgrade", action_text: "facility upgrade 60% funded", created_at: "" },
  ];

  const KPI_CARDS = [
    { label: "Total KG Removed", value: m.total_kg.toLocaleString(), icon: "♻️" },
    { label: "Active Stations", value: String(m.active_stations), icon: "📍" },
    { label: "Workers Employed", value: String(m.workers_employed), icon: "👷" },
    { label: "Households Served", value: String(m.households_served), icon: "🏠" },
  ];

  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const timeAgo = (iso: string) => {
    if (!iso) return "Recently";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <section id="dashboard" className="py-20" style={{ background: "#1A7A8A" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-[var(--font-dm-serif)] text-4xl text-white mb-2">Live Impact Dashboard</h2>
          <p className="text-white/70 text-lg">Every dollar is project-tagged and publicly reported.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {KPI_CARDS.map((card) => (
            <div key={card.label} className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="font-[var(--font-dm-serif)] text-3xl text-white mb-1">{card.value}</div>
              <div className="text-white/60 text-xs">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl p-5 flex flex-col justify-between min-h-[220px]" style={{ background: "rgba(255,255,255,0.08)" }}>
            <h4 className="text-white font-semibold mb-3 text-sm">South Lombok Network</h4>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/40 text-sm">
                <div className="text-4xl mb-2">🗺️</div>
                <p>Interactive map</p>
                <p className="text-xs mt-1">5 stations across South Lombok</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Selong Belanak", "Mawun", "Awang", "Gili Gede", "Kuta"].map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(36,181,203,0.25)", color: "#3CC5D9" }}>{s}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)" }}>
            <h4 className="text-white font-semibold mb-4 text-sm">Recent Activity</h4>
            <div className="space-y-3">
              {feed.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "#24B5CB", color: "#fff" }}>
                    {initials(item.station_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-xs leading-snug">
                      <strong>{item.station_name}</strong> {item.action_text}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5 flex flex-col items-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <h4 className="text-white font-semibold mb-4 text-sm self-start">Fund Allocation</h4>
            <DonutChart />
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-white/30 text-white hover:bg-white/10 transition-colors">
            View Full Dashboard →
          </a>
        </div>
      </div>
    </section>
  );
}
