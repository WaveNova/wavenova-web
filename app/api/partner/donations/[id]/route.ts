import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

// PATCH /api/partner/donations/[id] — allocate a confirmed donation to a fund
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { fund_id } = await req.json();

  const supabase = createServerClient();

  const { data: donation, error: fetchErr } = await supabase
    .from("donations")
    .select("id, status, amount_usd, project_slug, fund_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !donation) return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  if (donation.status !== "confirmed") return NextResponse.json({ error: "Only confirmed donations can be allocated" }, { status: 400 });

  // Partner access check
  if (auth.role === "partner") {
    const { data: proj } = await supabase.from("projects").select("partner_slug").eq("slug", donation.project_slug).maybeSingle();
    if (!proj || proj.partner_slug !== auth.partnerSlug) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Decrement previous fund if changing allocation
  const prevFundId = (donation as { fund_id?: string | null }).fund_id;
  if (prevFundId && prevFundId !== fund_id) {
    const { data: prevFund } = await supabase.from("funds").select("raised").eq("id", prevFundId).maybeSingle();
    if (prevFund) {
      await supabase.from("funds").update({ raised: Math.max(0, prevFund.raised - donation.amount_usd) }).eq("id", prevFundId);
    }
  }

  // Increment new fund
  if (fund_id && fund_id !== prevFundId) {
    const { data: newFund } = await supabase.from("funds").select("raised").eq("id", fund_id).maybeSingle();
    if (newFund) {
      await supabase.from("funds").update({ raised: newFund.raised + donation.amount_usd }).eq("id", fund_id);
    }
  }

  const { error } = await supabase.from("donations").update({ fund_id: fund_id ?? null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/projects/${donation.project_slug}`);
  return NextResponse.json({ success: true });
}
