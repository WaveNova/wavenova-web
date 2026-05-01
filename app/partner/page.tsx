"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import ImageUpload from "@/app/components/ImageUpload";
import type { Project, Fund } from "@/lib/database.types";

type FundTotals = Record<string, { raised: number; goal: number }>;

const PROJECT_CATEGORY_OPTIONS = ["Sorting Stations", "Waste Management"];

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24" fill="none" style={{ color: "#24B5CB" }}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Operational: "bg-emerald-50 text-emerald-700",
  "Just Launched": "bg-amber-50 text-amber-700",
  "Launching May": "bg-amber-50 text-amber-700",
};

export default function PartnerPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [fundTotals, setFundTotals] = useState<FundTotals>({});
  const [loading, setLoading] = useState(true);
  const [noPartner, setNoPartner] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ slug: "", name: "", location: "", category: "Sorting Stations", image_url: "", description: "", since_year: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      try {
        const roleRes = await fetch("/api/auth/role", { headers: { Authorization: `Bearer ${session.access_token}` } });
        const { role } = await roleRes.json();
        if (!role) { router.replace("/"); return; }
      } catch { router.replace("/"); return; }

      setToken(session.access_token);
      setUserEmail(session.user.email ?? "");

      const res = await fetch("/api/partner/projects", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      if (data.error === "No partner assigned") {
        setNoPartner(true);
      } else {
        const loadedProjects: Project[] = data.projects ?? [];
        setProjects(loadedProjects);
        if (loadedProjects.length > 0) {
          const slugs = loadedProjects.map((p) => p.slug);
          const { data: fundsData } = await supabase
            .from("funds")
            .select("project_slug, raised, goal")
            .eq("status", "active")
            .in("project_slug", slugs);
          const totals: FundTotals = {};
          for (const f of (fundsData ?? []) as Pick<Fund, "project_slug" | "raised" | "goal">[]) {
            if (!totals[f.project_slug]) totals[f.project_slug] = { raised: 0, goal: 0 };
            totals[f.project_slug].raised += f.raised;
            totals[f.project_slug].goal += f.goal;
          }
          setFundTotals(totals);
        }
      }
      setLoading(false);
    });
  }, [router]);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true); setCreateError("");
    const res = await fetch("/api/partner/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...newForm }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.success) {
      setNewForm({ slug: "", name: "", location: "", category: "Sorting Stations", image_url: "", description: "", since_year: "" });
      setShowNew(false);
      const updated = await fetch("/api/partner/projects", { headers: { Authorization: `Bearer ${token}` } });
      const ud = await updated.json();
      const refreshed: Project[] = ud.projects ?? [];
      setProjects(refreshed);
      if (refreshed.length > 0) {
        const { data: fundsData } = await supabase
          .from("funds")
          .select("project_slug, raised, goal")
          .eq("status", "active")
          .in("project_slug", refreshed.map((p) => p.slug));
        const totals: FundTotals = {};
        for (const f of (fundsData ?? []) as Pick<Fund, "project_slug" | "raised" | "goal">[]) {
          if (!totals[f.project_slug]) totals[f.project_slug] = { raised: 0, goal: 0 };
          totals[f.project_slug].raised += f.raised;
          totals[f.project_slug].goal += f.goal;
        }
        setFundTotals(totals);
      }
    } else { setCreateError(data.error ?? "Failed to create"); }
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push("/"); };

  if (!token || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none" style={{ color: "#24B5CB" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/"><Image src="/logo.png" alt="WaveNova" width={120} height={36} className="h-8 w-auto" /></a>
          <span className="text-sm font-semibold text-[#6B7280]">/ Partner Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B7280] hidden sm:block">{userEmail}</span>
          <button onClick={signOut} className="text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {noPartner ? (
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-center">
            <p className="text-[#6B7280]">No partner org assigned to your account yet.</p>
            <p className="text-sm text-[#9CA3AF] mt-2">Contact the WaveNova admin to get access.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-[var(--font-dm-serif)] text-2xl text-[#1A7A8A]">Your Projects</h1>
              <button
                onClick={() => setShowNew((x) => !x)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ background: "#24B5CB" }}
              >
                {showNew ? "Cancel" : "+ New Project"}
              </button>
            </div>

            {showNew && (
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] mb-6">
                <h2 className="font-semibold text-[#1F2937] mb-4">New Project</h2>
                <form onSubmit={createProject} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#6B7280] mb-1">Project Name *</label>
                      <input required value={newForm.name}
                        onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))}
                        className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7280] mb-1">Slug (URL) *</label>
                      <input required value={newForm.slug} onChange={(e) => setNewForm((f) => ({ ...f, slug: e.target.value }))}
                        className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB] font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7280] mb-1">Location *</label>
                      <input required value={newForm.location} onChange={(e) => setNewForm((f) => ({ ...f, location: e.target.value }))}
                        className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7280] mb-1">Category *</label>
                      <select value={newForm.category} onChange={(e) => setNewForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]">
                        {PROJECT_CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <ImageUpload
                        label="Project Image"
                        required
                        value={newForm.image_url}
                        onChange={(url) => setNewForm((f) => ({ ...f, image_url: url }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7280] mb-1">Operating Since</label>
                      <input value={newForm.since_year} onChange={(e) => setNewForm((f) => ({ ...f, since_year: e.target.value }))}
                        placeholder="2026"
                        className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[#6B7280] mb-1">Description</label>
                      <textarea value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))} rows={2}
                        className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB] resize-none" />
                    </div>
                  </div>
                  {createError && <p className="text-red-600 text-sm">{createError}</p>}
                  <button type="submit" disabled={creating}
                    className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                    style={{ background: "#24B5CB" }}>
                    {creating ? "Creating…" : "Create Project"}
                  </button>
                </form>
              </div>
            )}

            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-center">
                <p className="text-[#6B7280]">No projects yet.</p>
                <p className="text-sm text-[#9CA3AF] mt-1">Create your first project above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => {
                  const totals = fundTotals[p.slug];
                  const hasFunds = totals && totals.goal > 0;
                  const pct = hasFunds ? Math.min(100, Math.round((totals.raised / totals.goal) * 100)) : 0;
                  return (
                    <a key={p.slug} href={`/partner/projects/${p.slug}`}
                      className="block bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[#1F2937]">{p.name}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[p.status] ?? "bg-gray-50 text-gray-600"}`}>{p.status}</span>
                          </div>
                          <p className="text-sm text-[#6B7280] mt-0.5">{p.location} · {p.category}</p>
                          {hasFunds ? (
                            <>
                              <div className="mt-2 h-1.5 rounded-full bg-[#E5E7EB]">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#24B5CB" }} />
                              </div>
                              <p className="text-xs text-[#9CA3AF] mt-1">${totals.raised.toLocaleString()} / ${totals.goal.toLocaleString()} across all funds</p>
                            </>
                          ) : (
                            <p className="text-xs text-[#9CA3AF] mt-2">No active funds yet</p>
                          )}
                        </div>
                        <span className="text-sm font-medium shrink-0" style={{ color: "#24B5CB" }}>Manage →</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
