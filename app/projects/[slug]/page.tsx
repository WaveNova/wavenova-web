import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import type { Project, Fund, Partner, Activity } from "@/lib/database.types";
import Image from "next/image";
import { MapPin } from "lucide-react";
import Footer from "@/app/components/Footer";
import DonationSection from "@/app/components/DonationSection";

export const revalidate = 60;

async function getProject(slug: string): Promise<Project | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("projects").select("*").eq("slug", slug).single();
    return data;
  } catch {
    return null;
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

async function getActivities(projectSlug: string): Promise<Activity[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("project_slug", projectSlug)
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
    return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Operational: { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Just Launched": { bg: "bg-amber-100", text: "text-amber-800" },
  "Launching May": { bg: "bg-amber-100", text: "text-amber-800" },
};

// KPI tile background colours — cycles through 3 tints
const KPI_TINTS = [
  { bg: "#EDF9FB", color: "#1A7A8A" },
  { bg: "#E8F5E9", color: "#2E7D32" },
  { bg: "#FFF8E1", color: "#856200" },
];

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, funds] = await Promise.all([getProject(slug), getFunds(slug)]);
  if (!project) notFound();

  const [partner, activities] = await Promise.all([
    getPartner(project.partner_slug),
    getActivities(slug),
  ]);

  const status = STATUS_COLORS[project.status] ?? STATUS_COLORS["Operational"];

  const totalRaised = funds.reduce((s, f) => s + f.raised, 0);
  const totalGoal = funds.reduce((s, f) => s + f.goal, 0);
  const hasFunds = totalGoal > 0;
  const pct = hasFunds ? Math.min(Math.round((totalRaised / totalGoal) * 100), 100) : 0;

  return (
    <>
      <main className="min-h-screen bg-[#F8FAFC]">
        {/* Nav */}
        <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <a href="/">
            <Image src="/logo.png" alt="WaveNova" width={200} height={56} className="h-12 w-auto" />
          </a>
          <a
            href="#donate"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#24B5CB" }}
          >
            Donate Now
          </a>
        </nav>

        {/* Hero — cinematic height */}
        <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" style={{ objectPosition: project.image_position ?? "center" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-6 right-6 md:left-10 md:right-10">
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold inline-block mb-3 ${status.bg} ${status.text}`}>
              {project.status}
            </span>
            <h1 className="font-[var(--font-dm-serif)] text-4xl md:text-5xl text-white leading-tight">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 text-white/80 text-sm mt-2">
              <MapPin size={14} />
              <span>{project.location}{partner ? ` · ${partner.name}` : ""}</span>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        {project.kpis.length > 0 && (
          <div className="bg-white border-b border-[#E5E7EB]">
            <div className="max-w-5xl mx-auto px-6 py-4">
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {project.kpis.map((kpi, i) => {
                  const tint = KPI_TINTS[i % KPI_TINTS.length];
                  return (
                    <span
                      key={kpi}
                      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold"
                      style={{ background: tint.bg, color: tint.color }}
                    >
                      {kpi}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:items-start">

            {/* Left — main content */}
            <div className="md:col-span-2 space-y-8">

              {/* About */}
              <div className="bg-white rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-xl text-[#1F2937] mb-4">About This Project</h2>
                <p className="text-[#4B5563] leading-relaxed text-base">
                  {project.description ?? "This project is part of WaveNova's curated portfolio of grassroots environmental initiatives in South Lombok, Indonesia."}
                </p>
                {project.since_year && (
                  <p className="text-[#9CA3AF] text-sm mt-4">Operating since {project.since_year}</p>
                )}
              </div>

              {/* Activity timeline */}
              {activities.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <h2 className="font-bold text-xl text-[#1F2937] mb-6">Station Updates</h2>
                  <div className="relative pl-5">
                    {/* Vertical line */}
                    <div
                      className="absolute left-[7px] top-1 bottom-1 w-0.5 rounded-full"
                      style={{ background: "#E5E7EB" }}
                    />
                    <div className="space-y-6">
                      {activities.map((a) => (
                        <div key={a.id} className="relative flex items-start gap-4">
                          {/* Dot */}
                          <div
                            className="absolute -left-[18px] mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-white flex-shrink-0"
                            style={{ background: "#24B5CB" }}
                          />
                          <div className="min-w-0">
                            <p className="text-[#1F2937] text-sm leading-snug">{a.action_text}</p>
                            <p className="text-[#9CA3AF] text-xs mt-1">{timeAgo(a.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right — sticky sidebar */}
            <div className="space-y-5 md:sticky md:top-6">

              {/* Fundraising / donate card */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                {hasFunds ? (
                  <>
                    <div className="font-[var(--font-dm-serif)] text-4xl mb-1" style={{ color: "#24B5CB" }}>
                      ${totalRaised.toLocaleString()}
                    </div>
                    <p className="text-[#6B7280] text-sm mb-3">raised of ${totalGoal.toLocaleString()} goal</p>
                    <div className="h-2.5 rounded-full bg-[#E5E7EB] mb-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#24B5CB" }}
                      />
                    </div>
                    <p className="text-[#6B7280] text-xs mb-6">{pct}% funded</p>
                  </>
                ) : (
                  <p className="text-[#9CA3AF] text-sm mb-6">Fundraising coming soon.</p>
                )}
                <a
                  href="#donate"
                  className="block w-full text-center py-3.5 rounded-xl text-white font-semibold text-sm"
                  style={{ background: "#24B5CB" }}
                >
                  Donate to This Project
                </a>
                <p className="text-[#9CA3AF] text-xs text-center mt-3">
                  100% traceable · Bank transfer · WaveNova Yayasan
                </p>
                <p className="text-[#9CA3AF] text-xs text-center mt-1">
                  Majority goes direct to local operations
                </p>
              </div>

              {/* Active Funds breakdown */}
              {funds.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <h3 className="font-semibold text-sm text-[#1F2937] mb-4">Active Funds</h3>
                  <div className="space-y-5">
                    {funds.map((f) => {
                      const fpct = f.goal > 0 ? Math.min(Math.round((f.raised / f.goal) * 100), 100) : 0;
                      return (
                        <div key={f.id}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-sm text-[#1F2937]">{f.name}</p>
                            {f.status === "completed" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold whitespace-nowrap">
                                Completed
                              </span>
                            )}
                          </div>
                          {f.description && (
                            <p className="text-xs text-[#6B7280] mb-1.5">{f.description}</p>
                          )}
                          <div className="flex justify-between text-xs text-[#9CA3AF] mb-1">
                            <span>${f.raised.toLocaleString()} raised</span>
                            <span>${f.goal.toLocaleString()} goal · {fpct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#E5E7EB]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${fpct}%`,
                                background: f.status === "completed" ? "#059669" : "#24B5CB",
                              }}
                            />
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
                <dl className="space-y-2.5 text-sm">
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

              <a
                href="/#projects"
                className="block text-center text-sm font-medium hover:underline"
                style={{ color: "#24B5CB" }}
              >
                ← All Projects
              </a>
            </div>
          </div>
        </div>
      </main>
      <DonationSection id="donate" projects={[project]} defaultProjectSlug={slug} />
      <Footer />
    </>
  );
}
