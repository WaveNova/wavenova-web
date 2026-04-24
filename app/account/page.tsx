"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Donation } from "@/lib/database.types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Footer from "@/app/components/Footer";

// Impact rate constants — swap for per-project rates in future phases
const KG_PER_USD = 12;
const WORK_DAYS_PER_USD = 0.5;

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function SignInScreen() {
  const [email, setEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [showMagicInput, setShowMagicInput] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/account")}` },
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/account")}` },
    });
    setMagicLoading(false);
    if (error) { setError(error.message); } else { setMagicSent(true); }
  };

  return (
    <>
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <a href="/"><Image src="/logo.png" alt="WaveNova" width={140} height={40} className="h-9 w-auto mx-auto mb-6" /></a>
            <h1 className="font-[var(--font-dm-serif)] text-3xl mb-2" style={{ color: "#1A7A8A" }}>Track Your Impact</h1>
            <p className="text-[#6B7280]">Sign in to see your KG removed, jobs supported, and giving history.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8">
            {magicSent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: "#D4F0F5" }}>📧</div>
                <h2 className="font-bold text-xl text-[#1F2937] mb-2">Check your email</h2>
                <p className="text-[#6B7280] text-sm">We sent a magic link to your inbox. Click it to sign in.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg border border-[#D1D5DB] bg-white text-sm font-semibold text-[#1F2937] hover:bg-gray-50 transition-colors"
                >
                  <GoogleLogo />
                  Continue with Google
                </button>

                {!showMagicInput ? (
                  <button onClick={() => setShowMagicInput(true)} className="w-full text-center text-sm text-[#9CA3AF] hover:text-[#24B5CB] transition-colors">
                    Or sign in with email magic link
                  </button>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com" required
                      className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#24B5CB]"
                    />
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <button type="submit" disabled={magicLoading}
                      className="w-full py-3.5 rounded-lg text-white font-semibold text-sm disabled:opacity-60"
                      style={{ background: "#24B5CB" }}
                    >
                      {magicLoading ? "Sending…" : "Send Magic Link"}
                    </button>
                    <p className="text-[#9CA3AF] text-xs text-center">No password needed — we&apos;ll email you a sign-in link.</p>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700" },
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return; }
      setUser({ email: session.user.email ?? "" });

      const { data } = await supabase
        .from("donations")
        .select("*")
        .eq("donor_email", session.user.email ?? "")
        .order("created_at", { ascending: false });
      setDonations(data ?? []);
      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none" style={{ color: "#24B5CB" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (!user) return <SignInScreen />;

  // Impact calculations — confirmed donations only
  const confirmedTotal = donations
    .filter((d) => d.status === "confirmed")
    .reduce((s, d) => s + d.amount_usd, 0);
  const kgRemoved = Math.round(confirmedTotal * KG_PER_USD);
  const workDays = Math.round(confirmedTotal * WORK_DAYS_PER_USD * 10) / 10;

  const hasPending = donations.some((d) => d.status === "pending");

  return (
    <>
      <main className="min-h-screen bg-[#F8FAFC]">
        <nav className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <a href="/"><Image src="/logo.png" alt="WaveNova" width={140} height={40} className="h-9 w-auto" /></a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6B7280] hidden sm:block">{user.email}</span>
            <button onClick={signOut} className="text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors">Sign out</button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* Impact hero section — foundation for future gamification */}
          <section id="impact-stats">
            <h1 className="font-[var(--font-dm-serif)] text-4xl mb-1" style={{ color: "#1A7A8A" }}>
              Your Impact, So Far
            </h1>
            <p className="text-[#6B7280] text-sm mb-6">
              {hasPending
                ? "Based on confirmed donations only — pending will count once we verify your transfer."
                : confirmedTotal > 0
                ? "Every confirmed dollar below created real change on the ground in Lombok."
                : "Make your first donation to start tracking your impact."}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-3">
              {/* KG removed */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-center">
                <div className="text-3xl mb-3">🗑️</div>
                <div className="font-[var(--font-dm-serif)] text-5xl sm:text-6xl mb-1" style={{ color: "#24B5CB" }}>
                  {kgRemoved.toLocaleString()}
                </div>
                <p className="text-[#4B5563] text-sm font-semibold">kg of plastic removed</p>
                <p className="text-[#9CA3AF] text-xs mt-1">from Lombok's coastline & ocean</p>
              </div>

              {/* Work days */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-center">
                <div className="text-3xl mb-3">👷</div>
                <div className="font-[var(--font-dm-serif)] text-5xl sm:text-6xl mb-1" style={{ color: "#1A7A8A" }}>
                  {workDays.toLocaleString()}
                </div>
                <p className="text-[#4B5563] text-sm font-semibold">days of fair-wage work</p>
                <p className="text-[#9CA3AF] text-xs mt-1">created for local workers</p>
              </div>
            </div>

            <p className="text-center text-xs text-[#9CA3AF]">
              ~{KG_PER_USD} kg removed · ~{WORK_DAYS_PER_USD} work-days funded per USD donated
            </p>
          </section>

          {/* Giving history */}
          <h2 className="font-bold text-lg text-[#1F2937] mb-4 mt-10">Giving History</h2>
          {donations.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <p className="text-[#6B7280] mb-4">No donations yet.</p>
              <a href="/#donate" className="inline-flex px-6 py-3 rounded-lg text-white text-sm font-semibold" style={{ background: "#24B5CB" }}>
                Make Your First Donation
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280]">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280]">Project</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280]">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] hidden sm:table-cell">Reference</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d, i) => {
                    const s = STATUS_COLORS[d.status] ?? STATUS_COLORS["pending"];
                    return (
                      <tr key={d.id} className={`border-b border-[#E5E7EB] last:border-0 ${i % 2 === 1 ? "bg-[#F9FAFB]" : ""}`}>
                        <td className="px-5 py-3 text-[#6B7280]">{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-[#1F2937] font-medium capitalize">{d.project_slug.replace(/-/g, " ")}</td>
                        <td className="px-5 py-3 text-[#1F2937] font-semibold">${(d.amount_usd + d.tip_amount).toFixed(0)}</td>
                        <td className="px-5 py-3 font-mono text-xs text-[#6B7280] hidden sm:table-cell">{d.reference_code}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.bg} ${s.text}`}>
                            {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Donate more CTA */}
          {donations.length > 0 && (
            <div className="mt-10 text-center">
              <a
                href="/#donate"
                className="inline-flex px-8 py-4 rounded-lg text-white font-semibold"
                style={{ background: "#24B5CB" }}
              >
                Keep growing your impact →
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
