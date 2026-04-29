"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Project, Activity } from "@/lib/database.types";

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function PartnerPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [noProject, setNoProject] = useState(false);

  const [actionText, setActionText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      try {
        const roleRes = await fetch("/api/auth/role", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const { role } = await roleRes.json();
        if (!role) { router.replace("/"); return; }
      } catch {
        router.replace("/");
        return;
      }

      setToken(session.access_token);
      setUserEmail(session.user.email ?? "");

      const res = await fetch("/api/partner/project", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        setActivities(data.activities ?? []);
      } else {
        setNoProject(true);
      }
      setLoading(false);
    });
  }, [router]);

  const postUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !project) return;
    setPosting(true);
    setPostError("");
    const res = await fetch("/api/partner/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ station_name: project.name, action_text: actionText }),
    });
    const data = await res.json();
    setPosting(false);
    if (data.success) {
      setActionText("");
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
      setActivities((prev) => [
        { id: Date.now().toString(), station_name: project.name, action_text: actionText, created_at: new Date().toISOString() },
        ...prev,
      ]);
    } else {
      setPostError(data.error ?? "Failed to post update");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
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
          <span className="text-sm font-semibold text-[#6B7280]">/ Partner Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B7280] hidden sm:block">{userEmail}</span>
          <button onClick={signOut} className="text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {noProject ? (
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-center">
            <p className="text-[#6B7280]">No project assigned to your account yet.</p>
            <p className="text-sm text-[#9CA3AF] mt-2">Contact the WaveNova admin to get access.</p>
          </div>
        ) : project ? (
          <div className="space-y-6">
            {/* Project card */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-[var(--font-dm-serif)] text-2xl text-[#1A7A8A]">{project.name}</h1>
                  <p className="text-sm text-[#6B7280]">{project.partner} · {project.location}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap">
                  {project.status}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#E5E7EB] mb-2">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (project.raised / project.goal) * 100)}%`, background: "#24B5CB" }} />
              </div>
              <p className="text-sm text-[#6B7280]">
                <span className="font-semibold text-[#1F2937]">${project.raised.toLocaleString()}</span> raised of ${project.goal.toLocaleString()} goal
              </p>
            </div>

            {/* Post update */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h2 className="font-semibold text-[#1F2937] mb-4">Post a Station Update</h2>
              <form onSubmit={postUpdate} className="space-y-3">
                <textarea
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="e.g. collected 340 KG this week, river barrier cleared 80 KG…"
                  required
                  rows={3}
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#24B5CB] resize-none"
                />
                {postError && <p className="text-red-600 text-sm">{postError}</p>}
                <button
                  type="submit"
                  disabled={posting}
                  className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: postSuccess ? "#059669" : "#24B5CB" }}
                >
                  {posting ? "Posting…" : postSuccess ? "Posted ✓" : "Post Update"}
                </button>
              </form>
            </div>

            {/* Recent activities */}
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
          </div>
        ) : (
          <Spinner />
        )}
      </div>
    </div>
  );
}
