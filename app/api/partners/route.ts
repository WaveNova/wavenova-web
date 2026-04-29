import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerClient();
  const [{ data: partners }, { data: projects }] = await Promise.all([
    supabase.from("partners").select("*").order("name"),
    supabase.from("projects").select("partner_slug"),
  ]);

  const counts: Record<string, number> = {};
  for (const p of projects ?? []) {
    counts[p.partner_slug] = (counts[p.partner_slug] ?? 0) + 1;
  }

  return NextResponse.json({
    partners: (partners ?? []).map((p) => ({ ...p, project_count: counts[p.slug] ?? 0 })),
  });
}
