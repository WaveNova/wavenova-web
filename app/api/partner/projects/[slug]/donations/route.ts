import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const supabase = createServerClient();

  if (auth.role === "partner") {
    const { data: proj } = await supabase.from("projects").select("partner_slug").eq("slug", slug).maybeSingle();
    if (!proj || proj.partner_slug !== auth.partnerSlug) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: donations, error } = await supabase
    .from("donations")
    .select("id, amount_usd, donor_name, donor_email, created_at, fund_id, reference_code")
    .eq("project_slug", slug)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ donations: donations ?? [] });
}
