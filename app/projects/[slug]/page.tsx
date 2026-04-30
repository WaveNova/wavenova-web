import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import type { Project, Fund, Partner, Activity } from "@/lib/database.types";
import Image from "next/image";
import { MapPin } from "lucide-react";
import Footer from "@/app/components/Footer";

export const revalidate = 60;

const FALLBACK_PROJECTS: Project[] = [
  { id: "1", slug: "selong-belanak", name: "Selong Belanak Station", partner_slug: "sbca", location: "South Lombok", status: "Operational", category: "Sorting Stations", kpis: ["5 years running", "12,400 KG", "4 workers"], raised: 3200, goal: 5000, image_url: "https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=800&q=70", since_year: "2021", description: "The original Blue Loop station — WaveNova's Chapter 1. SBCA has been collecting, sorting, and selling plastic waste from South Lombok's beaches for 5 years.", created_at: "" },
  { id: "2", slug: "mawun", name: "Mawun Station", partner_slug: "eco-mawun", location: "South Lombok", status: "Just Launched", category: "Sorting Stations", kpis: ["New station", "3 workers", "2026"], raised: 800, goal: 4000, image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70", since_year: "2026", description: "A brand-new sorting station at Mawun beach, operated by the Eco Mawun team.", created_at: "" },
  { id: "3", slug: "awang", name: "Awang Station", partner_slug: "eco-mawun", location: "South Lombok", status: "Launching May", category: "Sorting Stations", kpis: ["Beach cleanup May 6", "Sea waste", "Boats"], raised: 400, goal: 4500, image_url: "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?w=800&q=70", since_year: "2026", description: "Kicking off May 6, 2026 with a major beach cleanup, followed by setup of a sorting station in Awang.", created_at: "" },
  { id: "4", slug: "gili-gede", name: "Gili Gede Station", partner_slug: "gps-ggi", location: "West Lombok", status: "Launching May", category: "Sorting Stations", kpis: ["Island station", "Sea collection", "Early May"], raised: 600, goal: 5500, image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=70", since_year: "2026", description: "An island-based sorting station on Gili Gede, operated by GPS_ggi in partnership with Marina Del Ray.", created_at: "" },
  { id: "5", slug: "kuta-honest-impact", name: "Honest Impact — Kuta", partner_slug: "honest-made", location: "Central Lombok", status: "Operational", category: "Waste Management", kpis: ["Daily sweepers", "River barriers", "Residential"], raised: 4200, goal: 6000, image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=70", since_year: "2021", description: "The social arm of Honest Made — daily road sweepers, river barriers, and residential waste collection in Kuta.", created_at: "" },
];

async function getProject(slug: string): Promise<Project | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("projects").select("*").eq("slug", slug).single();
    return data;
  } catch {
    return FALLBACK_PROJECTS.find((p) => p.slug === slug) ?? null;
  }
}

async function getPartner(slug: string): Promise<Partner | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("partners").select("*").eq("slug", slug).maybeSingle();
    return data;
  } catch {
    return null;
  }
}

async function getFunds(slug: string): Promise<Fund[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("funds")
      .select("*")
      .eq("project_slug", slug)
      .neq("status", "archived")
      .order("created_at", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

async function getActivities(stationName: string): Promise<Activity[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("station_name", stationName)
      .order("created_at", { ascending: false })
      .limit(8);
    return data ?? [];
  } catch {
    return [];
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export async function generateStaticParams() {
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("projects").select("slug");
    return (data ?? []).map((p) => ({ slug: p.slug }));
  } catch {
    return FALLBACK_PROJECTS.map((p) => ({ slug: p.slug }));
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Operational: { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Just Launched": { bg: "bg-amber-100", text: "text-amber-800" },
  "Launching May": { bg: "bg-amber-100", text: "text-amber-800" },
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, funds] = await Promise.all([getProject(slug), getFunds(slug)]);
  if (!project) notFound();

  const [partner, activities] = await Promise.all([
    getPartner(project.partner_slug),
    getActivities(project.name),
  ]);

  const status = STATUS_COLORS[project.status] ?? STATUS_COLORS["Operational"];

  // Aggregate fund totals for main progress bar
  const totalRaised = funds.reduce((s, f) => s + f.raised, 0);
  const totalGoal = funds.reduce((s, f) => s + f.goal, 0);
  const hasFunds = totalGoal > 0;
  const pct = hasFunds ? Math.min(Math.round((totalRaised / totalGoal) * 100), 100) : 0;

  return (
    <>
      <main className="min-h-screen bg-[#F8FAFC]">
        {/* Nav */}
        <nav className="bg-white border-b border-[#E5E7EB] px-6 py-2 flex items-center justify-between">
          <a href="/">
            <Image src="/logo.png" alt="WaveNova" width={200} height={56} className="h-12 w-auto" />
          </a>
          <a href="/#donate" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#24B5CB" }}>
            Donate Now
          </a>
        </nav>

        {/* Hero image */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold inline-block mb-2 ${status.bg} ${status.text}`}>
              {project.status}
            </span>
            <h1 className="font-[var(--font-dm-serif)] text-3xl md:text-4xl text-white">{project.name}</h1>
            <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
              <MapPin size={14} />
              <span>{project.location}{partner ? ` · ${partner.name}` : ""}</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-xl text-[#1F2937] mb-3">About This Project</h2>
                <p className="text-[#4B5563] leading-relaxed">
                  {project.description ?? "This project is part of WaveNova's curated portfolio of grassroots environmental initiatives in South Lombok, Indonesia."}
                </p>
                {project.since_year && (
                  <p className="text-[#9CA3AF] text-sm mt-3">Operating since {project.since_year}</p>
                )}
              </div>

              {/* KPIs */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-xl text-[#1F2937] mb-4">Impact Metrics</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {project.kpis.map((kpi) => (
                    <div key={kpi} className="rounded-xl p-4 text-center" style={{ background: "#EDF9FB" }}>
                      <p className="font-semibold text-sm" style={{ color: "#1A7A8A" }}>{kpi}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* How funds are used */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-xl text-[#1F2937] mb-4">How Funds Are Used</h2>
                <div className="space-y-3">
                  {[
                    { label: "Direct to local operations (workers, waste purchases, logistics)", pct: 87, color: "#059669" },
                    { label: "WaveNova management (content, reporting, admin)", pct: 10, color: "#24B5CB" },
                    { label: "Payment processing", pct: 3, color: "#9CA3AF" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#4B5563]">{item.label}</span>
                        <span className="font-semibold" style={{ color: item.color }}>{item.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#E5E7EB]">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Latest Updates */}
              {activities.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <h2 className="font-bold text-xl text-[#1F2937] mb-4">Latest Updates</h2>
                  <div className="space-y-4">
                    {activities.map((a) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "#24B5CB" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[#1F2937] text-sm leading-snug">{a.action_text}</p>
                          <p className="text-[#9CA3AF] text-xs mt-0.5">{timeAgo(a.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Fundraising progress */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                {hasFunds ? (
                  <>
                    <div className="font-[var(--font-dm-serif)] text-3xl mb-1" style={{ color: "#24B5CB" }}>
                      ${totalRaised.toLocaleString()}
                    </div>
                    <p className="text-[#6B7280] text-sm mb-3">raised of ${totalGoal.toLocaleString()} goal</p>
                    <div className="h-2 rounded-full bg-[#E5E7EB] mb-3">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#24B5CB" }} />
                    </div>
                    <p className="text-[#6B7280] text-xs mb-5">{pct}% funded</p>
                  </>
                ) : (
                  <p className="text-[#9CA3AF] text-sm mb-5">Fundraising coming soon.</p>
                )}
                <a
                  href={`/#donate?project=${slug}`}
                  className="block w-full text-center py-3.5 rounded-xl text-white font-semibold text-sm"
                  style={{ background: "#24B5CB" }}
                >
                  Donate to This Project
                </a>
                <p className="text-[#9CA3AF] text-xs text-center mt-3">
                  100% traceable · Bank transfer · WaveNova Yayasan
                </p>
              </div>

              {/* Active Funds */}
              {funds.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <h3 className="font-semibold text-sm text-[#1F2937] mb-1">Where your donation goes</h3>
                  <p className="text-xs text-[#9CA3AF] mb-4">Active funds for this project</p>
                  <div className="space-y-4">
                    {funds.map((f) => {
                      const fpct = f.goal > 0 ? Math.min(Math.round((f.raised / f.goal) * 100), 100) : 0;
                      return (
                        <div key={f.id}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-sm text-[#1F2937]">{f.name}</p>
                            {f.status === "completed" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold whitespace-nowrap">Completed</span>
                            )}
                          </div>
                          {f.description && <p className="text-xs text-[#6B7280] mb-1.5">{f.description}</p>}
                          <div className="flex justify-between text-xs text-[#9CA3AF] mb-1">
                            <span>${f.raised.toLocaleString()} raised</span>
                            <span>${f.goal.toLocaleString()} goal · {fpct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#E5E7EB]">
                            <div className="h-full rounded-full" style={{ width: `${fpct}%`, background: f.status === "completed" ? "#059669" : "#24B5CB" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Project details */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <h3 className="font-semibold text-sm text-[#1F2937] mb-3">Project Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#6B7280]">Partner</dt>
                    <dd className="font-medium text-[#1F2937]">{partner?.name ?? project.partner_slug}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6B7280]">Location</dt>
                    <dd className="font-medium text-[#1F2937]">{project.location}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6B7280]">Category</dt>
                    <dd className="font-medium text-[#1F2937]">{project.category}</dd>
                  </div>
                  {project.since_year && (
                    <div className="flex justify-between">
                      <dt className="text-[#6B7280]">Since</dt>
                      <dd className="font-medium text-[#1F2937]">{project.since_year}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <a href="/#projects" className="block text-center text-sm font-medium hover:underline" style={{ color: "#24B5CB" }}>
                ← All Projects
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
