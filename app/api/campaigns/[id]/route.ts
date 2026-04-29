import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = createServerClient();

  // Fetch campaign to check ownership for partners
  if (auth.role === "partner") {
    const { data: campaign } = await supabase.from("campaigns").select("project_slug").eq("id", id).maybeSingle();
    if (!campaign || campaign.project_slug !== auth.projectSlug) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const allowed = ["name", "description", "goal", "status"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase.from("campaigns").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
