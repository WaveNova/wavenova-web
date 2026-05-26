"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Project, ProjectCategory, Fund } from "@/lib/database.types";

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


type FundTotals = Record<string, { raised: number; goal: number }>;

function ProjectCard({ project, fundTotals }: { project: Project; fundTotals: FundTotals }) {
  const totals = fundTotals[project.slug];
  const hasFunds = totals && totals.goal > 0;
  const pct = hasFunds ? Math.min(Math.round((totals.raised / totals.goal) * 100), 100) : 0;
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
        {hasFunds ? (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold text-[#1F2937]">${totals.raised.toLocaleString()}</span>
              <span className="text-[#6B7280]">of ${totals.goal.toLocaleString()} goal</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#E5E7EB]">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#24B5CB" }} />
            </div>
          </div>
        ) : (
          <div className="mb-4 h-8 flex items-center">
            <span className="text-xs text-[#9CA3AF]">Funds coming soon</span>
          </div>
        )}
        <a href={`/projects/${project.slug}`} className="flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: "#24B5CB" }}>
          Learn More →
        </a>
      </div>
    </div>
  );
}

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<FilterValue>("All");
  const [liveProjects, setLiveProjects] = useState<Project[]>(projects);
  const [fundTotals, setFundTotals] = useState<FundTotals>({});

  useEffect(() => {
    Promise.all([
      supabase.from("projects").select("*").neq("slug", "general").order("created_at", { ascending: true }),
      supabase.from("funds").select("project_slug, raised, goal").eq("status", "active"),
    ]).then(([projRes, fundsRes]) => {
      if (projRes.data && projRes.data.length > 0) setLiveProjects(projRes.data);
      const totals: FundTotals = {};
      for (const f of (fundsRes.data ?? []) as Pick<Fund, "project_slug" | "raised" | "goal">[]) {
        if (!totals[f.project_slug]) totals[f.project_slug] = { raised: 0, goal: 0 };
        totals[f.project_slug].raised += f.raised;
        totals[f.project_slug].goal += f.goal;
      }
      setFundTotals(totals);
    });
  }, []);

  const filtered = active === "All" ? liveProjects : liveProjects.filter((p) => p.category === active);

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
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <p className="text-lg mb-1">No projects yet</p>
            <p className="text-sm">Partner stations are being onboarded — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} fundTotals={fundTotals} />)}
          </div>
        )}
      </div>
    </section>
  );
}
