import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { project_slug, name, description, goal } = await req.json();
  if (!project_slug || !name || !goal) {
    return NextResponse.json({ error: "project_slug, name, and goal required" }, { status: 400 });
  }

  if (auth.role === "partner") {
    const supabase = createServerClient();
    const { data: proj } = await supabase.from("projects").select("partner_slug").eq("slug", project_slug).maybeSingle();
    if (!proj || proj.partner_slug !== auth.partnerSlug) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("funds")
    .insert({ project_slug, name, description: description || null, goal: parseFloat(goal) })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, fund: data });
}
