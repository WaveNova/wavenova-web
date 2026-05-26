"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import type { Metrics } from "@/lib/database.types";

const StationMap = dynamic(() => import("./StationMap"), { ssr: false });

interface Props {
  metrics: Metrics | null;
}

export default function ImpactDashboard({ metrics }: Props) {
  const [liveMetrics, setLiveMetrics] = useState<Metrics | null>(metrics);

  useEffect(() => {
    supabase.from("metrics").select("*").limit(1).maybeSingle()
      .then(({ data }) => { if (data) setLiveMetrics(data); });
  }, []);

  const m = liveMetrics ?? { total_kg: 0, active_stations: 0, workers_employed: 0, households_served: 0 };

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

        {/* Full-width station map */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ height: 340 }}>
          <StationMap />
        </div>

        <div className="text-center">
          <a href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-white/30 text-white hover:bg-white/10 transition-colors">
            View Full Dashboard →
          </a>
        </div>
      </div>
    </section>
  );
}
