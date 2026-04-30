"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import ImageUpload from "@/app/components/ImageUpload";
import type { Project, Activity, Campaign } from "@/lib/database.types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function KpiEditor({ kpis, onChange }: { kpis: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !kpis.includes(v)) { onChange([...kpis, v]); setInput(""); }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {kpis.map((k) => (
          <span key={k} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#EDF9FB", color: "#1A7A8A" }}>
            {k}
            <button type="button" onClick={() => onChange(kpis.filter((x) => x !== k))} className="ml-0.5 text-[#9CA3AF] hover:text-red-500">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add a metric (e.g. 12,400 KG)"
          className="flex-1 border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
        <button type="button" onClick={add} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: "#24B5CB" }}>Add</button>
      </div>
    </div>
  );
}

export default function PartnerProjectPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionText, setActionText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);

  const [editDesc, setEditDesc] = useState("");
  const [editKpis, setEditKpis] = useState<string[]>([]);
  const [editImage, setEditImage] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [savingProject, setSavingProject] = useState(false);
  const [saveProjectSuccess, setSaveProjectSuccess] = useState(false);
  const [saveProjectError, setSaveProjectError] = useState("");

  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignGoal, setNewCampaignGoal] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState("");

  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [campaignEdits, setCampaignEdits] = useState<Record<string, { name: string; goal: string; description: string; status: string }>>({});
  const [savingCampaign, setSavingCampaign] = useState<string | null>(null);

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

      const [projRes, campRes] = await Promise.all([
        fetch(`/api/partner/projects/${slug}`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch(`/api/campaigns/by-project/${slug}`),
      ]);
      const projData = await projRes.json();
      const campData = await campRes.json();

      if (projData.error) { router.replace("/partner"); return; }

      setProject(projData.project);
      setActivities(projData.activities ?? []);
      setEditDesc(projData.project?.description ?? "");
      setEditKpis(projData.project?.kpis ?? []);
      setEditImage(projData.project?.image_url ?? "");
      setEditGoal(String(projData.project?.goal ?? ""));

      const cams = campData.campaigns ?? [];
      setCampaigns(cams);
      const edits: typeof campaignEdits = {};
      for (const c of cams) edits[c.id] = { name: c.name, goal: String(c.goal), description: c.description ?? "", status: c.status };
      setCampaignEdits(edits);
      setLoading(false);
    });
  }, [router, slug]);

  const signOut = async () => { await supabase.auth.signOut(); router.push("/"); };

  const postUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !project) return;
    setPosting(true); setPostError("");
    const res = await fetch("/api/partner/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ station_name: project.name, action_text: actionText }),
    });
    const data = await res.json();
    setPosting(false);
    if (data.success) {
      setActionText(""); setPostSuccess(true); setTimeout(() => setPostSuccess(false), 3000);
      setActivities((prev) => [{ id: Date.now().toString(), station_name: project.name, action_text: actionText, created_at: new Date().toISOString() }, ...prev]);
    } else setPostError(data.error ?? "Failed");
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProject(true); setSaveProjectError(""); setSaveProjectSuccess(false);
    const res = await fetch(`/api/partner/projects/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description: editDesc, kpis: editKpis, image_url: editImage, goal: parseFloat(editGoal) }),
    });
    const data = await res.json();
    setSavingProject(false);
    if (data.success) {
      setProject((prev) => prev ? { ...prev, description: editDesc, kpis: editKpis, image_url: editImage, goal: parseFloat(editGoal) } : prev);
      setSaveProjectSuccess(true); setTimeout(() => setSaveProjectSuccess(false), 3000);
    } else setSaveProjectError(data.error ?? "Save failed");
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !project) return;
    setCreatingCampaign(true); setCampaignError("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ project_slug: project.slug, name: newCampaignName, goal: newCampaignGoal, description: newCampaignDesc || null }),
    });
    const data = await res.json();
    setCreatingCampaign(false);
    if (data.success && data.campaign) {
      setCampaigns((prev) => [...prev, data.campaign]);
      setCampaignEdits((prev) => ({ ...prev, [data.campaign.id]: { name: data.campaign.name, goal: String(data.campaign.goal), description: data.campaign.description ?? "", status: data.campaign.status } }));
      setNewCampaignName(""); setNewCampaignGoal(""); setNewCampaignDesc("");
    } else setCampaignError(data.error ?? "Failed");
  };

  const saveCampaign = async (id: string) => {
    if (!token) return;
    setSavingCampaign(id);
    const e = campaignEdits[id];
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: e.name, goal: parseFloat(e.goal), description: e.description || null, status: e.status }),
    });
    const data = await res.json();
    setSavingCampaign(null);
    if (data.success) {
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, name: e.name, goal: parseFloat(e.goal), description: e.description || null, status: e.status as Campaign["status"] } : c));
      setEditingCampaign(null);
    }
  };

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
          <a href="/partner" className="text-sm font-semibold text-[#6B7280] hover:text-[#1F2937]">/ Partner Portal</a>
          <span className="text-sm text-[#9CA3AF]">/ {project?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B7280] hidden sm:block">{userEmail}</span>
          <button onClick={signOut} className="text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {project && (
          <>
            {/* Project overview */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-[var(--font-dm-serif)] text-2xl text-[#1A7A8A]">{project.name}</h1>
                  <p className="text-sm text-[#6B7280]">{project.location}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap">{project.status}</span>
              </div>
              <div className="h-2 rounded-full bg-[#E5E7EB] mb-2">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (project.raised / project.goal) * 100)}%`, background: "#24B5CB" }} />
              </div>
              <p className="text-sm text-[#6B7280]">
                <span className="font-semibold text-[#1F2937]">${project.raised.toLocaleString()}</span> raised of ${project.goal.toLocaleString()} goal
              </p>
            </div>

            {/* Edit project content */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h2 className="font-semibold text-[#1F2937] mb-4">Edit Project Content</h2>
              <form onSubmit={saveProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] mb-1">About This Project</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} placeholder="Describe your project…"
                    className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#24B5CB] resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] mb-2">Impact Metrics (KPIs)</label>
                  <KpiEditor kpis={editKpis} onChange={setEditKpis} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B7280] mb-1">Funding Goal ($)</label>
                    <input type="number" min="0" value={editGoal} onChange={(e) => setEditGoal(e.target.value)}
                      className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
                  </div>
                  <div>
                    <ImageUpload
                      label="Project Image"
                      value={editImage}
                      onChange={setEditImage}
                    />
                  </div>
                </div>
                {saveProjectError && <p className="text-red-600 text-sm">{saveProjectError}</p>}
                <button type="submit" disabled={savingProject}
                  className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: saveProjectSuccess ? "#059669" : "#24B5CB" }}>
                  {savingProject ? "Saving…" : saveProjectSuccess ? "Saved ✓" : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Campaigns */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h2 className="font-semibold text-[#1F2937] mb-4">Fundraising Campaigns</h2>
              {campaigns.length > 0 && (
                <div className="space-y-3 mb-5">
                  {campaigns.map((c) => {
                    const cpct = Math.min(Math.round((c.raised / c.goal) * 100), 100);
                    const isEditing = editingCampaign === c.id;
                    return (
                      <div key={c.id} className="border border-[#E5E7EB] rounded-xl p-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            <input value={campaignEdits[c.id]?.name ?? ""} onChange={(e) => setCampaignEdits((p) => ({ ...p, [c.id]: { ...p[c.id], name: e.target.value } }))}
                              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" placeholder="Campaign name" />
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-xs text-[#6B7280]">Goal ($)</label>
                                <input type="number" value={campaignEdits[c.id]?.goal ?? ""} onChange={(e) => setCampaignEdits((p) => ({ ...p, [c.id]: { ...p[c.id], goal: e.target.value } }))}
                                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
                              </div>
                              <div>
                                <label className="text-xs text-[#6B7280]">Status</label>
                                <select value={campaignEdits[c.id]?.status ?? "active"} onChange={(e) => setCampaignEdits((p) => ({ ...p, [c.id]: { ...p[c.id], status: e.target.value } }))}
                                  className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]">
                                  <option value="active">Active</option>
                                  <option value="completed">Completed</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </div>
                            </div>
                            <textarea value={campaignEdits[c.id]?.description ?? ""} onChange={(e) => setCampaignEdits((p) => ({ ...p, [c.id]: { ...p[c.id], description: e.target.value } }))}
                              rows={2} placeholder="Description (optional)"
                              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB] resize-none" />
                            <div className="flex gap-2">
                              <button onClick={() => saveCampaign(c.id)} disabled={savingCampaign === c.id}
                                className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#24B5CB" }}>
                                {savingCampaign === c.id ? "Saving…" : "Save"}
                              </button>
                              <button onClick={() => setEditingCampaign(null)} className="px-4 py-1.5 rounded-lg text-sm text-[#6B7280] border border-[#D1D5DB]">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-[#1F2937]">{c.name}</p>
                              {c.description && <p className="text-xs text-[#6B7280] mt-0.5">{c.description}</p>}
                              <p className="text-xs text-[#9CA3AF] mt-1">${c.raised.toLocaleString()} / ${c.goal.toLocaleString()} · {cpct}%</p>
                              <div className="mt-1.5 h-1 rounded-full bg-[#E5E7EB]">
                                <div className="h-full rounded-full" style={{ width: `${cpct}%`, background: "#24B5CB" }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-[#F3F4F6] text-[#6B7280]"}`}>{c.status}</span>
                              <button onClick={() => setEditingCampaign(c.id)} className="text-xs font-medium hover:underline" style={{ color: "#24B5CB" }}>Edit</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <h3 className="text-sm font-semibold text-[#1F2937] mb-3">New Campaign</h3>
              <form onSubmit={createCampaign} className="space-y-3">
                <input value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} required placeholder="Campaign name (e.g. Facility Upgrade Phase 2)"
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
                <input type="number" value={newCampaignGoal} onChange={(e) => setNewCampaignGoal(e.target.value)} required placeholder="Goal ($)" min="1"
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
                <textarea value={newCampaignDesc} onChange={(e) => setNewCampaignDesc(e.target.value)} rows={2} placeholder="Description (optional)"
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB] resize-none" />
                {campaignError && <p className="text-red-600 text-sm">{campaignError}</p>}
                <button type="submit" disabled={creatingCampaign}
                  className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#24B5CB" }}>
                  {creatingCampaign ? "Creating…" : "Create Campaign"}
                </button>
              </form>
            </div>

            {/* Post update */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h2 className="font-semibold text-[#1F2937] mb-4">Post a Station Update</h2>
              <form onSubmit={postUpdate} className="space-y-3">
                <textarea value={actionText} onChange={(e) => setActionText(e.target.value)} placeholder="e.g. collected 340 KG this week…" required rows={3}
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#24B5CB] resize-none" />
                {postError && <p className="text-red-600 text-sm">{postError}</p>}
                <button type="submit" disabled={posting}
                  className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: postSuccess ? "#059669" : "#24B5CB" }}>
                  {posting ? "Posting…" : postSuccess ? "Posted ✓" : "Post Update"}
                </button>
              </form>
            </div>

            {activities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <h2 className="font-semibold text-[#1F2937] mb-4">Recent Updates</h2>
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#24B5CB" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1F2937]">{a.action_text}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{timeAgo(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
