import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createServerClient();
  const [{ data: partners }, { data: roles }] = await Promise.all([
    supabase.from("partners").select("*").order("name"),
    supabase.from("user_roles").select("*").eq("role", "partner").order("created_at"),
  ]);

  const accessByPartner: Record<string, typeof roles> = {};
  for (const r of roles ?? []) {
    if (!r.partner_slug) continue;
    (accessByPartner[r.partner_slug] ??= []).push(r);
  }

  return NextResponse.json({
    partners: (partners ?? []).map((p) => ({ ...p, access: accessByPartner[p.slug] ?? [] })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug, name, description, logo_url, website } = await req.json();
  if (!slug || !name) return NextResponse.json({ error: "slug and name required" }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase.from("partners").insert({ slug, name, description: description || null, logo_url: logo_url || null, website: website || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
