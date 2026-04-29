import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

// Deprecated: use /api/partner/projects/[slug] instead.
// Kept for backward compat; returns the first project for the partner.
export async function GET(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!auth.partnerSlug) return NextResponse.json({ project: null, activities: [] });

  const supabase = createServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("partner_slug", auth.partnerSlug)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("station_name", project?.name ?? "")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ project, activities: activities ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!auth.partnerSlug) return NextResponse.json({ error: "No partner assigned" }, { status: 403 });

  const body = await req.json();
  const allowed = ["description", "kpis", "image_url"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const supabase = createServerClient();
  const { data: project } = await supabase.from("projects").select("slug").eq("partner_slug", auth.partnerSlug).limit(1).maybeSingle();
  if (!project) return NextResponse.json({ error: "No project found" }, { status: 404 });

  const { error } = await supabase.from("projects").update(update).eq("slug", project.slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
