import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { station_name, action_text, project_slug } = await req.json();
  if (!station_name || !action_text) {
    return NextResponse.json({ error: "station_name and action_text required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("activities").insert({ station_name, action_text, project_slug: project_slug ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
