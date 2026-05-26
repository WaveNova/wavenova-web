"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import ImageUpload from "@/app/components/ImageUpload";
import LocationPicker from "@/app/components/LocationPicker";
import type { Project, Activity, Fund, Donation } from "@/lib/database.types";

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
  const [funds, setFunds] = useState<Fund[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionText, setActionText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);

  const [editDesc, setEditDesc] = useState("");
  const [editKpis, setEditKpis] = useState<string[]>([]);
  const [editImage, setEditImage] = useState("");
  const [editPosition, setEditPosition] = useState("center");
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [saveProjectSuccess, setSaveProjectSuccess] = useState(false);
  const [saveProjectError, setSaveProjectError] = useState("");

  const [newFundName, setNewFundName] = useState("");
  const [newFundGoal, setNewFundGoal] = useState("");
  const [newFundDesc, setNewFundDesc] = useState("");
  const [creatingFund, setCreatingFund] = useState(false);
  const [fundError, setFundError] = useState("");

  const [editingFund, setEditingFund] = useState<string | null>(null);
  const [fundEdits, setFundEdits] = useState<Record<string, { name: string; goal: string; description: string; status: string }>>({});
  const [savingFund, setSavingFund] = useState<string | null>(null);

  const [allocating, setAllocating] = useState<string | null>(null);

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

      const [projRes, fundsRes, donationsRes] = await Promise.all([
        fetch(`/api/partner/projects/${slug}`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch(`/api/funds/by-project/${slug}`),
        fetch(`/api/partner/projects/${slug}/donations`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);
      const projData = await projRes.json();
      const fundsData = await fundsRes.json();
      const donationsData = await donationsRes.json();

      if (projData.error) { router.replace("/partner"); return; }

      setProject(projData.project);
      setActivities(projData.activities ?? []);
      setEditDesc(projData.project?.description ?? "");
      setEditKpis(projData.project?.kpis ?? []);
      setEditImage(projData.project?.image_url ?? "");
      setEditPosition(projData.project?.image_position ?? "center");
      setEditLat(projData.project?.lat ?? null);
      setEditLng(projData.project?.lng ?? null);

      const fs = fundsData.funds ?? [];
      setFunds(fs);
      const edits: typeof fundEdits = {};
      for (const f of fs) edits[f.id] = { name: f.name, goal: String(f.goal), description: f.description ?? "", status: f.status };
      setFundEdits(edits);

      setDonations(donationsData.donations ?? []);
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
      body: JSON.stringify({ station_name: project.name, action_text: actionText, project_slug: project.slug }),
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
      body: JSON.stringify({ description: editDesc, kpis: editKpis, image_url: editImage, image_position: editPosition, lat: editLat, lng: editLng }),
    });
    const data = await res.json();
    setSavingProject(false);
    if (data.success) {
      setProject((prev) => prev ? { ...prev, description: editDesc, kpis: editKpis, image_url: editImage } : prev);
      setSaveProjectSuccess(true); setTimeout(() => setSaveProjectSuccess(false), 3000);
    } else setSaveProjectError(data.error ?? "Save failed");
  };

  const createFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !project) return;
    setCreatingFund(true); setFundError("");
    const res = await fetch("/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ project_slug: project.slug, name: newFundName, goal: newFundGoal, description: newFundDesc || null }),
    });
    const data = await res.json();
    setCreatingFund(false);
    if (data.success && data.fund) {
      setFunds((prev) => [...prev, data.fund]);
      setFundEdits((prev) => ({ ...prev, [data.fund.id]: { name: data.fund.name, goal: String(data.fund.goal), description: data.fund.description ?? "", status: data.fund.status } }));
      setNewFundName(""); setNewFundGoal(""); setNewFundDesc("");
    } else setFundError(data.error ?? "Failed");
  };

  const saveFund = async (id: string) => {
    if (!token) return;
    setSavingFund(id);
    const e = fundEdits[id];
    const res = await fetch(`/api/funds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: e.name, goal: parseFloat(e.goal), description: e.description || null, status: e.status }),
    });
    const data = await res.json();
    setSavingFund(null);
    if (data.success) {
      setFunds((prev) => prev.map((f) => f.id === id ? { ...f, name: e.name, goal: parseFloat(e.goal), description: e.description || null, status: e.status as Fund["status"] } : f));
      setEditingFund(null);
    }
  };

  const allocateDonation = async (donationId: string, fundId: string | null) => {
    if (!token) return;
    setAllocating(donationId);
    const res = await fetch(`/api/partner/donations/${donationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fund_id: fundId }),
    });
    const data = await res.json();
    setAllocating(null);
    if (data.success) {
      setDonations((prev) => prev.map((d) => d.id === donationId ? { ...d, fund_id: fundId } : d));
      // Update fund raised totals locally
      if (fundId) {
        setFunds((prev) => prev.map((f) => {
          const d = donations.find((x) => x.id === donationId);
          if (!d) return f;
          if (f.id === fundId) return { ...f, raised: f.raised + d.amount_usd };
          if (f.id === d.fund_id) return { ...f, raised: Math.max(0, f.raised - d.amount_usd) };
          return f;
        }));
      }
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
          <a href="/"><Image src="/logo.png" alt="WaveNova" width={200} height={56} className="h-12 w-auto" /></a>
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-[var(--font-dm-serif)] text-2xl text-[#1A7A8A]">{project.name}</h1>
                  <p className="text-sm text-[#6B7280]">{project.location}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap">{project.status}</span>
              </div>
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
                  <label className="block text-xs font-semibold text-[#6B7280] mb-2">Impact Metrics</label>
                  <KpiEditor kpis={editKpis} onChange={setEditKpis} />
                </div>
                <div>
                  <ImageUpload label="Project Image" value={editImage} onChange={setEditImage} />
                  {editImage && (
                    <div className="mt-2">
                      <label className="block text-xs font-semibold text-[#6B7280] mb-1">Image Focus Area</label>
                      <div className="relative w-full h-28 rounded-lg overflow-hidden mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={editImage} alt="preview" className="w-full h-full object-cover" style={{ objectPosition: editPosition }} />
                      </div>
                      <div className="flex gap-2">
                        {(["top", "center", "bottom"] as const).map((pos) => (
                          <button key={pos} type="button" onClick={() => setEditPosition(pos)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize"
                            style={editPosition === pos
                              ? { background: "#24B5CB", color: "#fff", borderColor: "#24B5CB" }
                              : { background: "#fff", color: "#6B7280", borderColor: "#D1D5DB" }}>
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] mb-1">Station Location</label>
                  <LocationPicker
                    defaultLat={editLat}
                    defaultLng={editLng}
                    onChange={({ lat, lng }) => { setEditLat(lat); setEditLng(lng); }}
                  />
                </div>
                {saveProjectError && <p className="text-red-600 text-sm">{saveProjectError}</p>}
                <button type="submit" disabled={savingProject}
                  className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: saveProjectSuccess ? "#059669" : "#24B5CB" }}>
                  {savingProject ? "Saving…" : saveProjectSuccess ? "Saved ✓" : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Funds */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h2 className="font-semibold text-[#1F2937] mb-1">Fundraising Funds</h2>
              <p className="text-xs text-[#9CA3AF] mb-4">Each fund represents a specific need or goal for this project.</p>
              {funds.length > 0 && (
                <div className="space-y-3 mb-5">
                  {funds.map((f) => {
                    const fpct = f.goal > 0 ? Math.min(Math.round((f.raised / f.goal) * 100), 100) : 0;
                    const isEditing = editingFund === f.id;
                    return (
                      <div key={f.id} className="border border-[#E5E7EB] rounded-xl p-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            <input value={fundEdits[f.id]?.name ?? ""} onChange={(e) => setFundEdits((p) => ({ ...p, [f.id]: { ...p[f.id], name: e.target.value } }))}
                              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" placeholder="Fund name" />
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-xs text-[#6B7280]">Goal ($)</label>
                                <input type="number" value={fundEdits[f.id]?.goal ?? ""} onChange={(e) => setFundEdits((p) => ({ ...p, [f.id]: { ...p[f.id], goal: e.target.value } }))}
                                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
                              </div>
                              <div>
                                <label className="text-xs text-[#6B7280]">Status</label>
                                <select value={fundEdits[f.id]?.status ?? "active"} onChange={(e) => setFundEdits((p) => ({ ...p, [f.id]: { ...p[f.id], status: e.target.value } }))}
                                  className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]">
                                  <option value="active">Active</option>
                                  <option value="completed">Completed</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </div>
                            </div>
                            <textarea value={fundEdits[f.id]?.description ?? ""} onChange={(e) => setFundEdits((p) => ({ ...p, [f.id]: { ...p[f.id], description: e.target.value } }))}
                              rows={2} placeholder="Description (optional)"
                              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB] resize-none" />
                            <div className="flex gap-2">
                              <button onClick={() => saveFund(f.id)} disabled={savingFund === f.id}
                                className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#24B5CB" }}>
                                {savingFund === f.id ? "Saving…" : "Save"}
                              </button>
                              <button onClick={() => setEditingFund(null)} className="px-4 py-1.5 rounded-lg text-sm text-[#6B7280] border border-[#D1D5DB]">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-[#1F2937]">{f.name}</p>
                              {f.description && <p className="text-xs text-[#6B7280] mt-0.5">{f.description}</p>}
                              <p className="text-xs text-[#9CA3AF] mt-1">${f.raised.toLocaleString()} / ${f.goal.toLocaleString()} · {fpct}%</p>
                              <div className="mt-1.5 h-1 rounded-full bg-[#E5E7EB]">
                                <div className="h-full rounded-full" style={{ width: `${fpct}%`, background: "#24B5CB" }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-[#F3F4F6] text-[#6B7280]"}`}>{f.status}</span>
                              <button onClick={() => setEditingFund(f.id)} className="text-xs font-medium hover:underline" style={{ color: "#24B5CB" }}>Edit</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <h3 className="text-sm font-semibold text-[#1F2937] mb-3">New Fund</h3>
              <form onSubmit={createFund} className="space-y-3">
                <input value={newFundName} onChange={(e) => setNewFundName(e.target.value)} required placeholder="Fund name (e.g. Facility Upgrade)"
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
                <input type="number" value={newFundGoal} onChange={(e) => setNewFundGoal(e.target.value)} required placeholder="Goal ($)" min="1"
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
                <textarea value={newFundDesc} onChange={(e) => setNewFundDesc(e.target.value)} rows={2} placeholder="Description (optional)"
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB] resize-none" />
                {fundError && <p className="text-red-600 text-sm">{fundError}</p>}
                <button type="submit" disabled={creatingFund}
                  className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#24B5CB" }}>
                  {creatingFund ? "Creating…" : "Create Fund"}
                </button>
              </form>
            </div>

            {/* Confirmed Donations */}
            {donations.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <h2 className="font-semibold text-[#1F2937] mb-1">Confirmed Donations</h2>
                <p className="text-xs text-[#9CA3AF] mb-4">Allocate each donation to a fund so its progress is tracked.</p>
                <div className="space-y-3">
                  {donations.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 border border-[#E5E7EB] rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1F2937]">${d.amount_usd.toLocaleString()}</p>
                        <p className="text-xs text-[#9CA3AF]">{d.donor_name ?? "Anonymous"} · {timeAgo(d.created_at)}</p>
                      </div>
                      <select
                        value={d.fund_id ?? ""}
                        disabled={allocating === d.id}
                        onChange={(e) => allocateDonation(d.id, e.target.value || null)}
                        className="border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#24B5CB] max-w-[160px]"
                      >
                        <option value="">Unallocated</option>
                        {funds.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
