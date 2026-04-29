"use client";

import { useEffect, useState } from "react";
import { Lock, ChevronDown, Copy, Check } from "lucide-react";
import type { Project } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

const PRESETS = [10, 25, 50, 100];

const IMPACT_MAP: Record<number, string> = {
  10: "Removes 5 KG of plastic from Lombok's coastline",
  25: "Covers one worker's daily wage at a sorting station",
  50: "Funds a full boat cleanup trip in Awang (3 boats)",
  100: "Supports one week of station operations",
};

const EQUIVALENCIES = [
  { amount: "$10", what: "Removes 5 KG of plastic from Lombok's coastline" },
  { amount: "$25", what: "Covers one worker's daily wage at a sorting station" },
  { amount: "$50", what: "Funds a full boat cleanup trip in Awang (3 boats collecting sea waste)" },
  { amount: "$100", what: "Supports one week of station operations including waste purchases at 2,000 IDR/kg" },
  { amount: "Custom", what: "Every dollar is project-tagged and publicly reported on the dashboard" },
];

type Frequency = "one-time" | "monthly";
type AuthState = "loading" | "signed-out" | "signed-in";

interface DonationResult {
  referenceCode: string;
  projectName: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  bankSwift: string;
}

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-2 text-[#24B5CB] hover:text-[#1A7A8A] transition-colors" title="Copy">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function SuccessScreen({ result, amount, onReset }: { result: DonationResult; amount: number; onReset: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-6 text-center py-10">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6" style={{ background: "#D4F0F5" }}>
        ✓
      </div>
      <h2 className="font-[var(--font-dm-serif)] text-4xl mb-2" style={{ color: "#1A7A8A" }}>
        Almost there!
      </h2>
      <p className="text-[#4B5563] mb-8">
        Complete your donation by transferring <strong>${amount.toFixed(0)} USD</strong> to the account below.
        Use your reference code in the payment notes so we can track it.
      </p>

      <div className="rounded-2xl p-5 mb-5 text-left" style={{ background: "#EDF9FB" }}>
        <p className="text-xs text-[#6B7280] font-medium mb-1 uppercase tracking-wider">Your Reference Code</p>
        <div className="flex items-center gap-2">
          <span className="font-[var(--font-dm-serif)] text-2xl" style={{ color: "#24B5CB" }}>{result.referenceCode}</span>
          <CopyButton text={result.referenceCode} />
        </div>
        <p className="text-xs text-[#6B7280] mt-1">Include this in your payment notes/description</p>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden mb-6 text-left">
        <div className="px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <p className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">Bank Transfer Details</p>
        </div>
        {[
          { label: "Bank", value: result.bankName },
          { label: "Account Number", value: result.bankAccount },
          { label: "Account Holder", value: result.bankHolder },
          { label: "Swift Code", value: result.bankSwift },
          { label: "Amount", value: `$${amount.toFixed(0)} USD` },
          { label: "Reference", value: result.referenceCode },
        ].map((row, i) => (
          <div key={row.label} className={`flex items-center justify-between px-5 py-3 text-sm ${i > 0 ? "border-t border-[#E5E7EB]" : ""}`}>
            <span className="text-[#6B7280]">{row.label}</span>
            <div className="flex items-center font-semibold text-[#1F2937]">
              {row.value}
              <CopyButton text={row.value} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[#6B7280] text-sm mb-8">
        A receipt with these details has been sent to your email. We&apos;ll confirm your donation within 1–2 business days.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/account" className="px-6 py-3 rounded-lg font-semibold text-white text-sm" style={{ background: "#24B5CB" }}>
          View My Impact
        </a>
        <button onClick={onReset} className="px-6 py-3 rounded-lg font-semibold text-sm border" style={{ borderColor: "#24B5CB", color: "#24B5CB" }}>
          Donate Again
        </button>
      </div>
    </div>
  );
}

function SignInGate({ sectionId }: { sectionId: string }) {
  const [magicEmail, setMagicEmail] = useState("");
  const [showMagicInput, setShowMagicInput] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/#" + sectionId)}`,
      },
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/#" + sectionId)}`,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); } else { setMagicSent(true); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-7">
      <h3 className="font-[var(--font-dm-serif)] text-2xl mb-1" style={{ color: "#1A7A8A" }}>
        Sign in to donate
      </h3>
      <p className="text-[#6B7280] text-sm mb-6">
        Track your ocean impact — your KG removed, jobs supported, and full giving history.
      </p>

      {/* Google button */}
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg border border-[#D1D5DB] bg-white text-sm font-semibold text-[#1F2937] hover:bg-gray-50 transition-colors mb-4"
      >
        <GoogleLogo />
        Continue with Google
      </button>

      {/* Magic link fallback */}
      {!showMagicInput && !magicSent && (
        <button
          onClick={() => setShowMagicInput(true)}
          className="w-full text-center text-sm text-[#9CA3AF] hover:text-[#24B5CB] transition-colors"
        >
          Or sign in with email magic link
        </button>
      )}

      {showMagicInput && !magicSent && (
        <form onSubmit={handleMagicLink} className="space-y-3 mt-1">
          <input
            type="email" value={magicEmail} onChange={(e) => setMagicEmail(e.target.value)}
            placeholder="your@email.com" required
            className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]"
          />
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: "#24B5CB" }}
          >
            {loading ? "Sending…" : "Send Magic Link"}
          </button>
        </form>
      )}

      {magicSent && (
        <div className="text-center mt-1">
          <p className="text-sm font-medium" style={{ color: "#24B5CB" }}>📧 Check your inbox</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Click the link in your email to sign in and donate.</p>
        </div>
      )}
    </div>
  );
}

export default function DonationSection({ id, projects }: { id?: string; projects: Project[] }) {
  const sectionId = id ?? "donate";

  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userEmail, setUserEmail] = useState("");

  const [amount, setAmount] = useState(25);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("one-time");
  const [projectSlug, setProjectSlug] = useState("general");
  const [tip, setTip] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DonationResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? "");
        const name = (session.user.user_metadata?.full_name as string | undefined) ?? "";
        if (name) setDonorName(name);
        setAuthState("signed-in");
      } else {
        setAuthState("signed-out");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? "");
        const name = (session.user.user_metadata?.full_name as string | undefined) ?? "";
        if (name) setDonorName(name);
        setAuthState("signed-in");
      } else {
        setAuthState("signed-out");
        setUserEmail("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const effectiveAmount = custom ? parseFloat(custom) || 0 : amount;
  const totalAmount = effectiveAmount + (tip ? 2 : 0);

  const defaultOptions = [
    { id: "general", name: "WaveNova General Fund" },
    { id: "selong-belanak", name: "Selong Belanak — SBCA" },
    { id: "mawun", name: "Mawun — Eco Mawun" },
    { id: "awang", name: "Awang — Eco Mawun" },
    { id: "gili-gede", name: "Gili Gede — GPS_ggi" },
    { id: "kuta-honest-impact", name: "Kuta — Honest Impact" },
  ];
  const projectOptions = [
    { id: "general", name: "WaveNova General Fund" },
    ...projects.map((p) => ({ id: p.slug, name: p.name })),
  ];
  const options = projects.length > 0 ? projectOptions : defaultOptions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!donorName.trim()) { setError("Please enter your name."); return; }
    if (totalAmount <= 0) { setError("Please enter a valid amount."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: donorName.trim(),
          donorEmail: userEmail,
          projectSlug,
          amountUsd: effectiveAmount,
          frequency,
          tipAmount: tip ? 2 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); return; }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const equivalenciesPanel = (
    <div>
      <h3 className="font-bold text-lg text-[#1F2937] mb-5">What Your Donation Does</h3>
      <div className="space-y-4">
        {EQUIVALENCIES.map((eq) => (
          <div key={eq.amount} className="flex gap-4 items-start p-4 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="font-[var(--font-dm-serif)] text-2xl w-16 text-center flex-shrink-0 pt-0.5" style={{ color: "#24B5CB" }}>
              {eq.amount}
            </div>
            <p className="text-[#4B5563] text-sm leading-relaxed">{eq.what}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (result) {
    return (
      <section id={sectionId} className="py-20" style={{ background: "linear-gradient(to bottom, #EDF9FB, #fff)" }}>
        <SuccessScreen result={result} amount={totalAmount} onReset={() => { setResult(null); setCustom(""); setAmount(25); }} />
      </section>
    );
  }

  return (
    <section id={sectionId} className="py-20" style={{ background: "linear-gradient(to bottom, #EDF9FB, #fff)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-[var(--font-dm-serif)] text-4xl mb-2" style={{ color: "#1A7A8A" }}>
            Make Your Impact
          </h2>
          <p className="text-[#6B7280] text-lg">Every dollar is project-tagged and publicly reported.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {equivalenciesPanel}

          {/* Right panel — sign-in gate or donation form */}
          {authState === "loading" && (
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-7 flex items-center justify-center min-h-[200px]">
              <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24" fill="none" style={{ color: "#24B5CB" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}

          {authState === "signed-out" && <SignInGate sectionId={sectionId} />}

          {authState === "signed-in" && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-7 space-y-5">
              {/* Signed-in identity */}
              <div className="flex items-center gap-2 text-sm text-[#6B7280] bg-[#F0FDF4] rounded-lg px-3 py-2">
                <span className="text-green-600">✓</span>
                <span>Signed in as <strong className="text-[#1F2937]">{userEmail}</strong></span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Your Name</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Your name"
                  className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]"
                  required
                />
              </div>

              {/* Project selector */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Choose a Project</label>
                <div className="relative">
                  <select
                    value={projectSlug}
                    onChange={(e) => setProjectSlug(e.target.value)}
                    className="w-full appearance-none border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm text-[#1F2937] bg-white pr-10 focus:outline-none focus:border-[#24B5CB]"
                  >
                    {options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                </div>
              </div>

              {/* Frequency toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Frequency</label>
                <div className="flex rounded-lg border border-[#D1D5DB] overflow-hidden">
                  {(["one-time", "monthly"] as Frequency[]).map((f) => (
                    <button key={f} type="button" onClick={() => setFrequency(f)}
                      className="flex-1 py-2.5 text-sm font-medium transition-colors"
                      style={frequency === f ? { background: "#24B5CB", color: "#fff" } : { background: "#fff", color: "#4B5563" }}
                    >
                      {f === "one-time" ? "One-time" : "Monthly"}
                    </button>
                  ))}
                </div>
                {frequency === "monthly" && (
                  <p className="text-xs mt-1 font-medium" style={{ color: "#24B5CB" }}>$25/month = ~150 KG removed per year</p>
                )}
              </div>

              {/* Amount presets */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Amount (USD)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {PRESETS.map((p) => (
                    <button key={p} type="button" onClick={() => { setAmount(p); setCustom(""); }}
                      className="py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                      style={amount === p && !custom
                        ? { background: "#24B5CB", color: "#fff", borderColor: "#24B5CB" }
                        : { background: "#fff", color: "#4B5563", borderColor: "#D1D5DB" }}
                    >
                      ${p}
                    </button>
                  ))}
                </div>
                <input
                  type="number" placeholder="Custom amount" value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]"
                  min="1"
                />
                {effectiveAmount > 0 && (
                  <p className="text-xs text-[#6B7280] mt-1">
                    {IMPACT_MAP[custom ? parseFloat(custom) : amount] ?? "Every dollar is project-tagged and publicly reported"}
                  </p>
                )}
              </div>

              {/* Tip */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={tip} onChange={(e) => setTip(e.target.checked)} className="mt-0.5 accent-[#24B5CB]" />
                <span className="text-sm text-[#4B5563]">
                  Add $2 to support WaveNova operations
                  <span className="text-[#9CA3AF] text-xs ml-1">(content, reporting & admin — 10–15% of all donations)</span>
                </span>
              </label>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || totalAmount <= 0}
                className="w-full py-4 rounded-lg text-white font-semibold text-base transition-all disabled:opacity-60"
                style={{ background: loading ? "#1A7A8A" : "#24B5CB" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing...
                  </span>
                ) : `Get Bank Transfer Instructions — $${totalAmount.toFixed(0)}`}
              </button>

              <div className="flex items-center justify-center gap-2 text-[#9CA3AF] text-xs">
                <Lock size={12} />
                <span>Secure · WaveNova Yayasan · 100% traceable</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
