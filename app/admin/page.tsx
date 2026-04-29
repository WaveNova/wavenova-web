"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Donation, Project, UserRole, Campaign, Partner } from "@/lib/database.types";

type Tab = "Donations" | "Projects" | "Metrics" | "Partners";

interface MetricsForm {
  total_kg: string;
  active_stations: string;
  workers_employed: string;
  households_served: string;
}

function authFetch(token: string) {
  return (path: string, opts?: RequestInit) =>
    fetch(path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts?.headers ?? {}),
      },
    });
}

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

const DONATION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700" },
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
};

// ─── Donations Tab ────────────────────────────────────────────────────────────

function DonationsTab({ token }: { token: string }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState("");
  const api = authFetch(token);

  useEffect(() => {
    api("/api/admin/donations")
      .then((r) => r.json())
      .then(({ donations: d }) => { setDonations(d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const confirm = async (id: string) => {
    setConfirming(id);
    setError("");
    const res = await api(`/api/admin/donations/${id}/confirm`, { method: "POST" });
    const data = await res.json();
    setConfirming(null);
    if (data.success) {
      setDonations((prev) => prev.map((d) => d.id === id ? { ...d, status: "confirmed" as const } : d));
    } else {
      setError(data.error ?? "Failed to confirm");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {donations.length === 0 ? (
        <p className="text-[#6B7280] py-8 text-center">No donations yet.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Donor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] hidden md:table-cell">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] hidden lg:table-cell">Ref</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {donations.map((d, i) => {
                const s = DONATION_STATUS_COLORS[d.status] ?? DONATION_STATUS_COLORS["pending"];
                return (
                  <tr key={d.id} className={`border-b border-[#E5E7EB] last:border-0 ${i % 2 === 1 ? "bg-[#F9FAFB]" : ""}`}>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="text-[#1F2937] font-medium">{d.donor_name ?? "—"}</div>
                      <div className="text-xs text-[#9CA3AF]">{d.donor_email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#1F2937] font-semibold whitespace-nowrap">${(d.amount_usd + d.tip_amount).toFixed(0)}</td>
                    <td className="px-4 py-3 text-[#6B7280] capitalize hidden md:table-cell">{d.project_slug.replace(/-/g, " ")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF] hidden lg:table-cell">{d.reference_code}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.bg} ${s.text}`}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.status === "pending" && (
                        <button
                          onClick={() => confirm(d.id)}
                          disabled={confirming === d.id}
                          className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold disabled:opacity-60"
                          style={{ background: "#059669" }}
                        >
                          {confirming === d.id ? "…" : "Confirm"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Projects Tab ─────────────────────────────────────────────────────────────

const PROJECT_STATUS_OPTIONS = ["Operational", "Just Launched", "Launching May"];

function KpiEditor({ kpis, onChange }: { kpis: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !kpis.includes(v)) { onChange([...kpis, v]); setInput(""); }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {kpis.map((k) => (
          <span key={k} className="flex items-center gap-1 text-xs bg-[#EDF9FB] text-[#1A7A8A] px-2.5 py-1 rounded-full font-medium">
            {k}
            <button type="button" onClick={() => onChange(kpis.filter((x) => x !== k))} className="hover:text-red-500 ml-0.5 leading-none">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="New KPI…"
          className="flex-1 border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]"
        />
        <button type="button" onClick={add}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
          style={{ background: "#24B5CB" }}
        >Add</button>
      </div>
    </div>
  );
}

const CAMPAIGN_STATUS_OPTIONS: Campaign["status"][] = ["active", "completed", "archived"];

function ProjectCampaigns({ projectSlug, token }: { projectSlug: string; token: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", goal: "", status: "active" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", goal: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const api = authFetch(token);

  useEffect(() => {
    fetch(`/api/campaigns/by-project/${projectSlug}`)
      .then((r) => r.json())
      .then(({ campaigns: c }) => { setCampaigns(c ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectSlug]);

  const startEdit = (c: Campaign) => {
    setEditId(c.id);
    setEditForm({ name: c.name, description: c.description ?? "", goal: String(c.goal), status: c.status });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSavingEdit(true);
    setError("");
    const res = await api(`/api/campaigns/${editId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: editForm.name, description: editForm.description, goal: parseFloat(editForm.goal), status: editForm.status }),
    });
    const data = await res.json();
    setSavingEdit(false);
    if (data.success) {
      setCampaigns((prev) => prev.map((c) => c.id === editId ? { ...c, ...editForm, goal: parseFloat(editForm.goal), status: editForm.status as Campaign["status"] } : c));
      setEditId(null);
    } else setError(data.error ?? "Save failed");
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await api("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({ project_slug: projectSlug, name: newForm.name, goal: parseFloat(newForm.goal) }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.campaign) {
      setCampaigns((prev) => [...prev, data.campaign]);
      setNewForm({ name: "", goal: "" });
    } else setError(data.error ?? "Create failed");
  };

  if (loading) return <p className="text-xs text-[#9CA3AF] py-2">Loading campaigns…</p>;

  return (
    <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
      <h4 className="text-sm font-semibold text-[#1F2937] mb-3">Campaigns</h4>
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <div className="space-y-2 mb-4">
        {campaigns.length === 0 && <p className="text-xs text-[#9CA3AF]">No campaigns yet.</p>}
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-xl border border-[#E5E7EB] p-3">
            {editId === c.id ? (
              <div className="space-y-2">
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Name" className="w-full border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
                <input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)" className="w-full border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
                <div className="flex gap-2">
                  <input type="number" min="0" value={editForm.goal} onChange={(e) => setEditForm((f) => ({ ...f, goal: e.target.value }))}
                    placeholder="Goal $" className="w-28 border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
                  <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]">
                    {CAMPAIGN_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={saveEdit} disabled={savingEdit}
                    className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60" style={{ background: "#24B5CB" }}>
                    {savingEdit ? "…" : "Save"}
                  </button>
                  <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B7280] border border-[#E5E7EB]">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#1F2937] truncate">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.status === "completed" ? "bg-emerald-50 text-emerald-700" : c.status === "archived" ? "bg-gray-100 text-gray-500" : "bg-[#EDF9FB] text-[#1A7A8A]"}`}>{c.status}</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">${c.raised.toLocaleString()} / ${c.goal.toLocaleString()} · {Math.min(100, Math.round((c.raised / c.goal) * 100))}%</p>
                </div>
                <button onClick={() => startEdit(c)} className="text-xs text-[#24B5CB] hover:underline shrink-0 font-medium">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={create} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-[#6B7280] mb-1 block">New campaign name</label>
          <input required value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. May Equipment Run"
            className="w-full border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
        </div>
        <div>
          <label className="text-xs text-[#6B7280] mb-1 block">Goal&nbsp;$</label>
          <input required type="number" min="1" value={newForm.goal} onChange={(e) => setNewForm((f) => ({ ...f, goal: e.target.value }))}
            placeholder="2000"
            className="w-24 border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
        </div>
        <button type="submit" disabled={creating}
          className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: "#24B5CB" }}>
          {creating ? "…" : "+ Add"}
        </button>
      </form>
    </div>
  );
}

function ProjectCard({ project, token }: { project: Project; token: string }) {
  const [raised, setRaised] = useState(String(project.raised));
  const [status, setStatus] = useState(project.status as string);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickSaved, setQuickSaved] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState(project.description ?? "");
  const [kpis, setKpis] = useState<string[]>(project.kpis ?? []);
  const [imageUrl, setImageUrl] = useState(project.image_url ?? "");
  const [goal, setGoal] = useState(String(project.goal));
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);
  const [contentError, setContentError] = useState("");

  const api = authFetch(token);

  const saveQuick = async () => {
    setQuickSaving(true);
    const res = await api(`/api/admin/projects/${project.slug}`, {
      method: "PATCH",
      body: JSON.stringify({ raised: parseFloat(raised), status }),
    });
    setQuickSaving(false);
    if ((await res.json()).success) { setQuickSaved(true); setTimeout(() => setQuickSaved(false), 2000); }
  };

  const saveContent = async () => {
    setContentSaving(true);
    setContentError("");
    const res = await api(`/api/admin/projects/${project.slug}`, {
      method: "PATCH",
      body: JSON.stringify({ description, kpis, image_url: imageUrl, goal: parseFloat(goal) }),
    });
    const data = await res.json();
    setContentSaving(false);
    if (data.success) { setContentSaved(true); setTimeout(() => setContentSaved(false), 2500); }
    else setContentError(data.error ?? "Save failed");
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-5">
        {/* Quick row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[#1F2937]">{project.name}</h3>
            <p className="text-xs text-[#9CA3AF]">{project.partner_slug} · {project.location}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#6B7280]">Raised&nbsp;$</label>
              <input type="number" min="0" value={raised}
                onChange={(e) => setRaised(e.target.value)}
                className="w-24 border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#6B7280]">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#24B5CB]">
                {PROJECT_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={saveQuick} disabled={quickSaving}
              className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              style={{ background: quickSaved ? "#059669" : "#24B5CB" }}>
              {quickSaving ? "Saving…" : quickSaved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-[#E5E7EB]">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (project.raised / project.goal) * 100)}%`, background: "#24B5CB" }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-[#9CA3AF]">${project.raised.toLocaleString()} / ${project.goal.toLocaleString()} goal</p>
          <button onClick={() => setExpanded((x) => !x)}
            className="text-xs font-medium transition-colors"
            style={{ color: "#24B5CB" }}>
            {expanded ? "Hide ▲" : "Edit Content ▼"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#E5E7EB] px-5 pb-5 pt-4 space-y-4 bg-[#F9FAFB]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB] resize-none bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Goal&nbsp;$</label>
              <input type="number" min="0" value={goal} onChange={(e) => setGoal(e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB] bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Image URL</label>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB] bg-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#6B7280] mb-2">KPIs</label>
              <KpiEditor kpis={kpis} onChange={setKpis} />
            </div>
          </div>
          {contentError && <p className="text-red-600 text-xs">{contentError}</p>}
          <button onClick={saveContent} disabled={contentSaving}
            className="px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: contentSaved ? "#059669" : "#24B5CB" }}>
            {contentSaving ? "Saving…" : contentSaved ? "Content Saved ✓" : "Save Content"}
          </button>

          <ProjectCampaigns projectSlug={project.slug} token={token} />
        </div>
      )}
    </div>
  );
}

const PROJECT_CATEGORY_OPTIONS_ADMIN = ["Sorting Stations", "Waste Management"];
const PROJECT_STATUS_OPTIONS_ADMIN = ["Operational", "Just Launched", "Launching May"];

function ProjectsTab({ token }: { token: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ slug: "", name: "", partner_slug: "", location: "", category: "Sorting Stations", status: "Operational", image_url: "", goal: "", description: "", since_year: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const api = authFetch(token);

  const load = () => {
    Promise.all([
      api("/api/admin/projects").then((r) => r.json()),
      api("/api/admin/partner-orgs").then((r) => r.json()),
    ]).then(([projData, partnerData]) => {
      setProjects(projData.projects ?? []);
      setPartners(partnerData.partners ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [token]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError("");
    const res = await api("/api/admin/projects", {
      method: "POST",
      body: JSON.stringify({ ...newForm, goal: newForm.goal ? parseFloat(newForm.goal) : 5000 }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.success) {
      setNewForm({ slug: "", name: "", partner_slug: "", location: "", category: "Sorting Stations", status: "Operational", image_url: "", goal: "", description: "", since_year: "" });
      setShowNew(false); load();
    } else setCreateError(data.error ?? "Failed");
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowNew((x) => !x)}
          className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ background: "#24B5CB" }}>
          {showNew ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <h3 className="font-semibold text-[#1F2937] mb-4">New Project</h3>
          <form onSubmit={create} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Name *</label>
                <input required value={newForm.name}
                  onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Slug *</label>
                <input required value={newForm.slug} onChange={(e) => setNewForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Partner *</label>
                <select required value={newForm.partner_slug} onChange={(e) => setNewForm((f) => ({ ...f, partner_slug: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]">
                  <option value="">— select partner —</option>
                  {partners.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Location *</label>
                <input required value={newForm.location} onChange={(e) => setNewForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Category *</label>
                <select value={newForm.category} onChange={(e) => setNewForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]">
                  {PROJECT_CATEGORY_OPTIONS_ADMIN.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Status</label>
                <select value={newForm.status} onChange={(e) => setNewForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]">
                  {PROJECT_STATUS_OPTIONS_ADMIN.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#6B7280] mb-1">Image URL *</label>
                <input required type="url" value={newForm.image_url} onChange={(e) => setNewForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://…"
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Goal ($)</label>
                <input type="number" min="0" value={newForm.goal} onChange={(e) => setNewForm((f) => ({ ...f, goal: e.target.value }))} placeholder="5000"
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Operating Since</label>
                <input value={newForm.since_year} onChange={(e) => setNewForm((f) => ({ ...f, since_year: e.target.value }))} placeholder="2026"
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#6B7280] mb-1">Description</label>
                <textarea value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB] resize-none" />
              </div>
            </div>
            {createError && <p className="text-red-600 text-sm">{createError}</p>}
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: "#24B5CB" }}>
              {creating ? "Creating…" : "Create Project"}
            </button>
          </form>
        </div>
      )}

      {projects.map((p) => <ProjectCard key={p.slug} project={p} token={token} />)}
    </div>
  );
}

// ─── Metrics Tab ──────────────────────────────────────────────────────────────

const METRIC_FIELDS = [
  { key: "total_kg" as const, label: "Total KG Removed" },
  { key: "active_stations" as const, label: "Active Stations" },
  { key: "workers_employed" as const, label: "Workers Employed" },
  { key: "households_served" as const, label: "Households Served" },
];

function MetricsTab({ token }: { token: string }) {
  const [form, setForm] = useState<MetricsForm>({ total_kg: "", active_stations: "", workers_employed: "", households_served: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const api = authFetch(token);

  useEffect(() => {
    api("/api/admin/metrics")
      .then((r) => r.json())
      .then(({ metrics }) => {
        if (metrics) {
          setForm({
            total_kg: String(metrics.total_kg),
            active_stations: String(metrics.active_stations),
            workers_employed: String(metrics.workers_employed),
            households_served: String(metrics.households_served),
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const save = async () => {
    setSaving(true);
    setError("");
    const res = await api("/api/admin/metrics", {
      method: "PATCH",
      body: JSON.stringify({
        total_kg: parseFloat(form.total_kg),
        active_stations: parseInt(form.active_stations),
        workers_employed: parseInt(form.workers_employed),
        households_served: parseInt(form.households_served),
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else setError(data.error ?? "Save failed");
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] max-w-md">
      <h3 className="font-semibold text-[#1F2937] mb-4">Global Impact Metrics</h3>
      <div className="space-y-4">
        {METRIC_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm text-[#6B7280] mb-1">{f.label}</label>
            <input
              type="number" min="0"
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]"
            />
          </div>
        ))}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-60"
          style={{ background: saved ? "#059669" : "#24B5CB" }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Metrics"}
        </button>
      </div>
    </div>
  );
}

// ─── Partners Tab ─────────────────────────────────────────────────────────────

type PartnerWithAccess = Partner & { access: UserRole[] };

function PartnerOrgCard({ partnerOrg, token, onRefresh }: { partnerOrg: PartnerWithAccess; token: string; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editForm, setEditForm] = useState({ name: partnerOrg.name, description: partnerOrg.description ?? "", logo_url: partnerOrg.logo_url ?? "", website: partnerOrg.website ?? "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const api = authFetch(token);

  const saveOrg = async () => {
    setSaving(true); setError("");
    const res = await api(`/api/admin/partner-orgs/${partnerOrg.slug}`, { method: "PATCH", body: JSON.stringify(editForm) });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); onRefresh(); }
    else setError(data.error ?? "Save failed");
  };

  const addEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEmail(true); setError("");
    const res = await api(`/api/admin/partner-orgs/${partnerOrg.slug}/access`, { method: "POST", body: JSON.stringify({ email: newEmail }) });
    const data = await res.json();
    setAddingEmail(false);
    if (data.success) { setNewEmail(""); onRefresh(); }
    else setError(data.error ?? "Failed to add");
  };

  const removeEmail = async (email: string) => {
    setRemovingEmail(email);
    await api(`/api/admin/partner-orgs/${partnerOrg.slug}/access`, { method: "DELETE", body: JSON.stringify({ email }) });
    setRemovingEmail(null);
    onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#1F2937]">{partnerOrg.name}</h3>
            <p className="text-xs text-[#9CA3AF] font-mono">{partnerOrg.slug}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B7280]">{partnerOrg.access.length} user{partnerOrg.access.length !== 1 ? "s" : ""}</span>
            <button onClick={() => setExpanded((x) => !x)} className="text-xs font-medium" style={{ color: "#24B5CB" }}>
              {expanded ? "Collapse ▲" : "Manage ▼"}
            </button>
          </div>
        </div>
        {partnerOrg.description && <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">{partnerOrg.description}</p>}
      </div>

      {expanded && (
        <div className="border-t border-[#E5E7EB] px-5 pb-5 pt-4 bg-[#F9FAFB] space-y-5">
          {/* Edit org info */}
          <div>
            <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Org Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Website</label>
                <input value={editForm.website} onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…"
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Logo URL</label>
                <input value={editForm.logo_url} onChange={(e) => setEditForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://…"
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Description</label>
                <input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#24B5CB]" />
              </div>
            </div>
            {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
            <button onClick={saveOrg} disabled={saving}
              className="mt-3 px-4 py-1.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: saved ? "#059669" : "#24B5CB" }}>
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
            </button>
          </div>

          {/* Access */}
          <div>
            <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Portal Access</h4>
            {partnerOrg.access.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {partnerOrg.access.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#E5E7EB]">
                    <span className="text-sm text-[#1F2937]">{a.email}</span>
                    <button onClick={() => removeEmail(a.email)} disabled={removingEmail === a.email}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 font-medium">
                      {removingEmail === a.email ? "…" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9CA3AF] mb-3">No access assigned yet.</p>
            )}
            <form onSubmit={addEmail} className="flex gap-2">
              <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@partner.com"
                className="flex-1 border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#24B5CB]" />
              <button type="submit" disabled={addingEmail}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: "#24B5CB" }}>
                {addingEmail ? "…" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PartnersTab({ token }: { token: string }) {
  const [partners, setPartners] = useState<PartnerWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ slug: "", name: "", description: "", logo_url: "", website: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const api = authFetch(token);

  const load = () => {
    api("/api/admin/partner-orgs")
      .then((r) => r.json())
      .then(({ partners: p }) => { setPartners(p ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [token]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError("");
    const res = await api("/api/admin/partner-orgs", { method: "POST", body: JSON.stringify(newForm) });
    const data = await res.json();
    setCreating(false);
    if (data.success) { setNewForm({ slug: "", name: "", description: "", logo_url: "", website: "" }); setShowNew(false); load(); }
    else setCreateError(data.error ?? "Failed");
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">{partners.length} partner org{partners.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowNew((x) => !x)}
          className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ background: "#24B5CB" }}>
          {showNew ? "Cancel" : "+ New Partner"}
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <h3 className="font-semibold text-[#1F2937] mb-4">New Partner Org</h3>
          <form onSubmit={create} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Name *</label>
                <input required value={newForm.name}
                  onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Slug *</label>
                <input required value={newForm.slug} onChange={(e) => setNewForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Description</label>
                <input value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Website</label>
                <input value={newForm.website} onChange={(e) => setNewForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…"
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#24B5CB]" />
              </div>
            </div>
            {createError && <p className="text-red-600 text-sm">{createError}</p>}
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: "#24B5CB" }}>
              {creating ? "Creating…" : "Create Partner"}
            </button>
          </form>
        </div>
      )}

      {partners.length === 0 && !showNew ? (
        <p className="text-[#6B7280] text-sm text-center py-4">No partner orgs yet. Create one above.</p>
      ) : (
        partners.map((p) => <PartnerOrgCard key={p.slug} partnerOrg={p} token={token} onRefresh={load} />)
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: Tab[] = ["Donations", "Projects", "Metrics", "Partners"];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Donations");
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      try {
        const res = await fetch("/api/auth/role", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const { role } = await res.json();
        if (role !== "admin") { router.replace("/"); return; }
      } catch {
        router.replace("/");
        return;
      }
      setToken(session.access_token);
      setUserEmail(session.user.email ?? "");
    });
  }, [router]);

  useEffect(() => {
    if (!token) return;
    authFetch(token)("/api/admin/projects")
      .then((r) => r.json())
      .then(({ projects: p }) => setProjects(p ?? []));
  }, [token]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!token) {
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
          <span className="text-sm font-semibold text-[#6B7280]">/ Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B7280] hidden sm:block">{userEmail}</span>
          <button onClick={signOut} className="text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex rounded-xl border border-[#E5E7EB] overflow-hidden mb-8 bg-white">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-sm font-medium transition-colors"
              style={tab === t ? { background: "#24B5CB", color: "#fff" } : { background: "#fff", color: "#4B5563" }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Donations" && <DonationsTab token={token} />}
        {tab === "Projects" && <ProjectsTab token={token} />}
        {tab === "Metrics" && <MetricsTab token={token} />}
        {tab === "Partners" && <PartnersTab token={token} />}
      </div>
    </div>
  );
}
