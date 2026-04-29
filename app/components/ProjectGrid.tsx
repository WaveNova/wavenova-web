"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Project, ProjectCategory } from "@/lib/database.types";

type FilterValue = "All" | ProjectCategory;

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "All" },
  { label: "Sorting Stations", value: "Sorting Stations" },
  { label: "Waste Management", value: "Waste Management" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Operational: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Just Launched": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Launching May": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
};

const FALLBACK_PROJECTS: Project[] = [
  { id: "1", slug: "selong-belanak", name: "Selong Belanak Station", partner_slug: "sbca", location: "South Lombok", status: "Operational", category: "Sorting Stations", kpis: ["5 years running", "12,400 KG", "4 workers"], raised: 3200, goal: 5000, image_url: "https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=800&q=70", since_year: "2021", description: null, created_at: "" },
  { id: "2", slug: "mawun", name: "Mawun Station", partner_slug: "eco-mawun", location: "South Lombok", status: "Just Launched", category: "Sorting Stations", kpis: ["New station", "3 workers", "2026"], raised: 800, goal: 4000, image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70", since_year: "2026", description: null, created_at: "" },
  { id: "3", slug: "awang", name: "Awang Station", partner_slug: "eco-mawun", location: "South Lombok", status: "Launching May", category: "Sorting Stations", kpis: ["Beach cleanup May 6", "Sea waste", "Boats"], raised: 400, goal: 4500, image_url: "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?w=800&q=70", since_year: "2026", description: null, created_at: "" },
  { id: "4", slug: "gili-gede", name: "Gili Gede Station", partner_slug: "gps-ggi", location: "West Lombok", status: "Launching May", category: "Sorting Stations", kpis: ["Island station", "Sea collection", "Early May"], raised: 600, goal: 5500, image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=70", since_year: "2026", description: null, created_at: "" },
  { id: "5", slug: "kuta-honest-impact", name: "Honest Impact — Kuta", partner_slug: "honest-made", location: "Central Lombok", status: "Operational", category: "Waste Management", kpis: ["Daily sweepers", "River barriers", "Residential"], raised: 4200, goal: 6000, image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=70", since_year: "2021", description: null, created_at: "" },
];

function ProjectCard({ project }: { project: Project }) {
  const pct = Math.min(Math.round((project.raised / project.goal) * 100), 100);
  const status = STATUS_STYLES[project.status] ?? STATUS_STYLES["Operational"];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-shadow">
      <div className="relative h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" loading="lazy" />
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} pulse-dot`} />
          {project.status}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-[#1F2937] leading-tight mb-1">{project.name}</h3>
        <div className="flex items-center gap-1 text-[#6B7280] text-sm mb-4">
          <MapPin size={13} />
          <span>{project.location}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.kpis.map((kpi) => (
            <span key={kpi} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: "#EDF9FB", color: "#1A7A8A" }}>
              {kpi}
            </span>
          ))}
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-semibold text-[#1F2937]">${project.raised.toLocaleString()}</span>
            <span className="text-[#6B7280]">of ${project.goal.toLocaleString()} goal</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#E5E7EB]">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#24B5CB" }} />
          </div>
        </div>
        <a href={`/projects/${project.slug}`} className="flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: "#24B5CB" }}>
          Learn More →
        </a>
      </div>
    </div>
  );
}

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<FilterValue>("All");
  const data = projects.length > 0 ? projects : FALLBACK_PROJECTS;
  const filtered = active === "All" ? data : data.filter((p) => p.category === active);

  return (
    <section id="projects" className="py-20" style={{ background: "#F8FAFC" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="font-[var(--font-dm-serif)] text-4xl mb-2" style={{ color: "#1A7A8A" }}>
            Our Projects
          </h2>
          <p className="text-[#6B7280] text-lg">Handpicked. Measurable. Traceable.</p>
        </div>
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 justify-center flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActive(f.value)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border"
              style={active === f.value
                ? { background: "#24B5CB", color: "#fff", borderColor: "#24B5CB" }
                : { background: "#fff", color: "#4B5563", borderColor: "#D1D5DB" }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </div>
    </section>
  );
}
