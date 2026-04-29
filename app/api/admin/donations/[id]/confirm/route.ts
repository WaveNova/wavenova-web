import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = createServerClient();

  const { data: donation, error: fetchErr } = await supabase
    .from("donations")
    .select("id, status, amount_usd, donor_email, project_slug")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !donation) return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  if (donation.status === "confirmed") return NextResponse.json({ error: "Already confirmed" }, { status: 409 });

  const { error: e1 } = await supabase
    .from("donations")
    .update({ status: "confirmed" })
    .eq("id", id);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: donor } = await supabase
    .from("donors")
    .select("id, total_donated, total_kg_removed")
    .eq("email", donation.donor_email)
    .maybeSingle();

  if (donor) {
    const { error: e2 } = await supabase
      .from("donors")
      .update({
        total_donated: donor.total_donated + donation.amount_usd,
        total_kg_removed: donor.total_kg_removed + donation.amount_usd * 0.5,
      })
      .eq("id", donor.id);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("slug, raised")
    .eq("slug", donation.project_slug)
    .maybeSingle();

  if (project) {
    const { error: e3 } = await supabase
      .from("projects")
      .update({ raised: project.raised + donation.amount_usd })
      .eq("slug", donation.project_slug);
    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
