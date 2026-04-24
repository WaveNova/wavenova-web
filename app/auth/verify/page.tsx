"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Suspense } from "react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // Supabase magic link drops token_hash + type as query params
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!tokenHash || type !== "magiclink") {
      setStatus("error");
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: "magiclink" })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
        } else {
          setStatus("success");
          setTimeout(() => router.push("/account"), 1200);
        }
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-10 text-center">
        <Image src="/logo.png" alt="WaveNova" width={140} height={40} className="h-9 w-auto mx-auto mb-8" />

        {status === "loading" && (
          <>
            <svg className="animate-spin h-10 w-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none" style={{ color: "#24B5CB" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-[#4B5563]">Signing you in…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: "#D4F0F5" }}>✓</div>
            <h2 className="font-[var(--font-dm-serif)] text-2xl mb-2" style={{ color: "#1A7A8A" }}>Signed in!</h2>
            <p className="text-[#6B7280] text-sm">Redirecting to your account…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 bg-red-50">✗</div>
            <h2 className="font-bold text-xl text-[#1F2937] mb-2">Link expired or invalid</h2>
            <p className="text-[#6B7280] text-sm mb-6">Magic links expire after 1 hour. Request a new one from your account page.</p>
            <a href="/" className="inline-flex px-6 py-3 rounded-lg text-white text-sm font-semibold" style={{ background: "#24B5CB" }}>
              Back to Home
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none" style={{ color: "#24B5CB" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
