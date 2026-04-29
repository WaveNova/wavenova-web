import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!auth.partnerSlug) return NextResponse.json({ projects: [] });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("partner_slug", auth.partnerSlug)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!auth.partnerSlug) return NextResponse.json({ error: "No partner assigned" }, { status: 403 });

  const body = await req.json();
  const { slug, name, location, category, description, image_url, goal, kpis, since_year } = body;
  if (!slug || !name || !location || !category || !image_url) {
    return NextResponse.json({ error: "slug, name, location, category, image_url required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("projects").insert({
    slug,
    name,
    partner_slug: auth.partnerSlug,
    location,
    category,
    status: "Operational",
    description: description || null,
    image_url,
    goal: goal ? parseFloat(goal) : 5000,
    kpis: kpis ?? [],
    since_year: since_year || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
