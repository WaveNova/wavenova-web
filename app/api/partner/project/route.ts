import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!auth.projectSlug) return NextResponse.json({ project: null, activities: [] });

  const supabase = createServerClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", auth.projectSlug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
  if (!auth.projectSlug) return NextResponse.json({ error: "No project assigned" }, { status: 403 });

  const body = await req.json();
  const allowed = ["description", "kpis", "image_url"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("projects").update(update).eq("slug", auth.projectSlug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
