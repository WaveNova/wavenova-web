"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/#donate";

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data }) => {
        const token = data.session?.access_token;
        if (token) {
          try {
            const res = await fetch("/api/auth/role", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const { role } = await res.json();
            if (role === "admin") { router.replace("/admin"); return; }
            if (role === "partner") { router.replace("/partner"); return; }
          } catch {
            // fall through to default redirect
          }
        }
        router.replace(next);
      });
    } else {
      // Implicit flow — SDK auto-detects token from URL hash
      supabase.auth.getSession().then(() => {
        router.replace(next);
      });
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none" style={{ color: "#24B5CB" }}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none" style={{ color: "#24B5CB" }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
