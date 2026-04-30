import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ project_slug: string }> }) {
  const { project_slug } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("funds")
    .select("*")
    .eq("project_slug", project_slug)
    .neq("status", "archived")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ funds: data ?? [] });
}
