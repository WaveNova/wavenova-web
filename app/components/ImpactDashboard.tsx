"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Metrics } from "@/lib/database.types";

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
}

export default function ImpactDashboard({ metrics }: Props) {
  const [liveMetrics, setLiveMetrics] = useState<Metrics | null>(metrics);

  useEffect(() => {
    supabase.from("metrics").select("*").limit(1).maybeSingle()
      .then(({ data }) => { if (data) setLiveMetrics(data); });
  }, []);

  const m = liveMetrics ?? { total_kg: 47823, active_stations: 5, workers_employed: 18, households_served: 340 };

  const KPI_CARDS = [
    { label: "Total KG Removed", value: m.total_kg.toLocaleString(), icon: "♻️" },
    { label: "Active Stations", value: String(m.active_stations), icon: "📍" },
    { label: "Workers Employed", value: String(m.workers_employed), icon: "👷" },
  ];

  return (
    <section id="dashboard" className="py-20" style={{ background: "#1A7A8A" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-[var(--font-dm-serif)] text-4xl text-white mb-2">Live Impact Dashboard</h2>
          <p className="text-white/70 text-lg">Every dollar is project-tagged and publicly reported.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {KPI_CARDS.map((card) => (
            <div key={card.label} className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="font-[var(--font-dm-serif)] text-3xl text-white mb-1">{card.value}</div>
              <div className="text-white/60 text-xs">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Map — spans 2 cols */}
          <div className="md:col-span-2 rounded-2xl overflow-hidden min-h-[260px] relative" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "rgba(26,122,138,0.85)" }}>
              South Lombok Network
            </div>
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=115.85%2C-9.05%2C116.45%2C-8.60&layer=mapnik"
              className="w-full h-full min-h-[260px] border-0"
              title="South Lombok station map"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {["Selong Belanak", "Mawun", "Awang", "Gili Gede", "Kuta"].map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(26,122,138,0.85)", color: "#fff" }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Fund Allocation */}
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
