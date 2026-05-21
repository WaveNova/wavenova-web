import { createServerClient } from "@/lib/supabase-server";
import Image from "next/image";
import { MapPin } from "lucide-react";
import Footer from "@/app/components/Footer";
import type { Project, Metrics } from "@/lib/database.types";

export const revalidate = 60;

const FALLBACK_METRICS: Metrics = { id: "1", total_kg: 47823, active_stations: 5, workers_employed: 18, households_served: 340, updated_at: new Date().toISOString() };

const STATUS_COLORS: Record<string, string> = {
  Operational: "#059669",
  "Just Launched": "#D97706",
  "Launching May": "#D97706",
};

async function getDashboardData() {
  try {
    const supabase = createServerClient();
    const [metricsRes, projectsRes] = await Promise.all([
      supabase.from("metrics").select("*").limit(1).single(),
      supabase.from("projects").select("*").order("created_at"),
    ]);
    return {
      metrics: metricsRes.data ?? FALLBACK_METRICS,
      projects: projectsRes.data ?? [],
    };
  } catch {
    return { metrics: FALLBACK_METRICS, projects: [] };
  }
}

export default async function DashboardPage() {
  const { metrics, projects } = await getDashboardData();

  const KPI_CARDS = [
    { label: "Total KG Removed", value: metrics.total_kg.toLocaleString(), icon: "♻️", color: "#24B5CB" },
    { label: "Active Stations", value: String(metrics.active_stations), icon: "📍", color: "#059669" },
    { label: "Workers Employed", value: String(metrics.workers_employed), icon: "👷", color: "#D97706" },
  ];

  return (
    <>
      <main className="min-h-screen bg-[#F8FAFC]">
        {/* Nav */}
        <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <a href="/">
            <Image src="/logo.png" alt="WaveNova" width={200} height={56} className="h-12 w-auto" />
          </a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B7280]">Updates every 60s</span>
            <a href="/#donate" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#24B5CB" }}>
              Donate
            </a>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-[var(--font-dm-serif)] text-4xl mb-1" style={{ color: "#1A7A8A" }}>
              Impact Dashboard
            </h1>
            <p className="text-[#6B7280]">
              Live data from all WaveNova stations · South Lombok, Indonesia
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {KPI_CARDS.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="font-[var(--font-dm-serif)] text-3xl mb-1" style={{ color: card.color }}>
                  {card.value}
                </div>
                <div className="text-[#6B7280] text-xs">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Station Overview */}
          <div className="mb-8">
            <h2 className="font-bold text-lg text-[#1F2937] mb-4">Station Overview</h2>
            <div className="space-y-4">
              {(projects.length > 0 ? projects : [{
                id: "1", slug: "selong-belanak", name: "Selong Belanak Station", partner_slug: "sbca", location: "South Lombok", status: "Operational" as const, category: "Sorting Stations" as const, kpis: ["12,400 KG", "4 workers"], raised: 3200, goal: 5000, image_url: "https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=400&q=60", since_year: "2021", description: null, lat: null, lng: null, created_at: ""
              }] as Project[]).map((project) => {
                const pct = Math.min(Math.round((project.raised / project.goal) * 100), 100);
                const statusColor = STATUS_COLORS[project.status] ?? "#6B7280";
                return (
                  <div key={project.id} className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-[#1F2937] text-sm">{project.name}</h3>
                        <span className="text-xs font-semibold flex-shrink-0" style={{ color: statusColor }}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#9CA3AF] text-xs mb-2">
                        <MapPin size={11} />
                        <span>{project.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(project.kpis as string[]).slice(0, 2).map((kpi: string) => (
                          <span key={kpi} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#EDF9FB", color: "#1A7A8A" }}>{kpi}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#E5E7EB]">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#24B5CB" }} />
                        </div>
                        <span className="text-xs text-[#6B7280] flex-shrink-0">{pct}% funded</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl p-8 text-center" style={{ background: "#EDF9FB" }}>
            <h2 className="font-[var(--font-dm-serif)] text-3xl mb-2" style={{ color: "#1A7A8A" }}>
              Support a Station
            </h2>
            <p className="text-[#4B5563] mb-5">Every donation is project-tagged and reflected in this dashboard.</p>
            <a href="/#donate" className="inline-flex px-8 py-3.5 rounded-xl text-white font-semibold" style={{ background: "#24B5CB" }}>
              Donate Now
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
