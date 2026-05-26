"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return { count, ref };
}

type AuthState = "loading" | "signed-out" | "signed-in";

interface LiveStats {
  partners: number;
  projects: number;
  stations: number;
  workers: number;
}

export default function Hero() {
  const [totalKg, setTotalKg] = useState(0);
  const { count, ref } = useCountUp(totalKg);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [stats, setStats] = useState<LiveStats>({ partners: 0, projects: 0, stations: 0, workers: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session?.user ? "signed-in" : "signed-out");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthState(session?.user ? "signed-in" : "signed-out");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    Promise.all([
      supabase.from("partners").select("slug", { count: "exact", head: true }),
      supabase.from("projects").select("slug", { count: "exact", head: true }).neq("slug", "general"),
      supabase.from("metrics").select("total_kg, active_stations, workers_employed").limit(1).maybeSingle(),
    ]).then(([partnerRes, projectRes, metricsRes]) => {
      setTotalKg(metricsRes.data?.total_kg ?? 0);
      setStats({
        partners: partnerRes.count ?? 0,
        projects: projectRes.count ?? 0,
        stations: metricsRes.data?.active_stations ?? 0,
        workers: metricsRes.data?.workers_employed ?? 0,
      });
    });
  }, []);

  const scrollToDonate = () => {
    document.getElementById("donate")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1400&q=80')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(26,122,138,0.75)] via-[rgba(26,122,138,0.65)] to-[rgba(10,50,60,0.80)]" />

      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-10">
        <Image src="/logo.png" alt="WaveNova" width={440} height={128} className="h-28 w-auto brightness-0 invert" />
        <div className="hidden sm:flex items-center gap-3">
          {authState === "signed-in" ? (
            <a
              href="/account"
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: "#24B5CB" }}
            >
              My Impact →
            </a>
          ) : authState === "signed-out" ? (
            <button
              onClick={scrollToDonate}
              className="inline-flex items-center px-5 py-2.5 rounded-lg border border-white/60 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </button>
          ) : null}
          <button
            onClick={scrollToDonate}
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-white/15 border border-white/30 backdrop-blur-sm text-sm font-semibold hover:bg-white/25 transition-colors"
          >
            Donate Now
          </button>
        </div>
      </nav>

      <div ref={ref} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-widest text-white/70 mb-3">
            Total Plastic Removed
          </p>
          <div className="font-[var(--font-dm-serif)] text-7xl sm:text-8xl md:text-9xl leading-none tabular-nums">
            {count.toLocaleString()}
            <span className="text-3xl sm:text-4xl ml-2 text-white/80">KG</span>
          </div>
        </div>
        <h1 className="font-[var(--font-dm-serif)] text-4xl sm:text-5xl md:text-6xl mb-4 leading-tight">
          The Wave Starts Here
        </h1>
        <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          Connecting global donors to grassroots environmental projects in Lombok, Indonesia.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#projects" className="px-8 py-4 rounded-lg font-semibold text-base" style={{ background: "#24B5CB" }}>
            Explore Projects
          </a>
          <button
            onClick={scrollToDonate}
            className="px-8 py-4 rounded-lg font-semibold text-base border-2 border-white/80 hover:bg-white/10 transition-colors"
          >
            Donate Now
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10" style={{ background: "#1A7A8A" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: stats.partners, label: "Partners" },
            { value: stats.projects, label: "Projects" },
            { value: stats.stations, label: "Active Stations" },
            { value: stats.workers, label: "Workers Employed" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-bold text-lg sm:text-xl">{s.value}</div>
              <div className="text-white/70 text-xs sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
