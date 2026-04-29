import { NextRequest, NextResponse } from "next/server";
import { getCallerAuth } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase-server";

async function checkAccess(auth: { role: string | null; partnerSlug: string | null }, slug: string, supabase: ReturnType<typeof import("@/lib/supabase-server").createServerClient>) {
  if (auth.role === "admin") return true;
  const { data } = await supabase.from("projects").select("partner_slug").eq("slug", slug).maybeSingle();
  return data?.partner_slug === auth.partnerSlug;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const supabase = createServerClient();

  if (!(await checkAccess(auth, slug, supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: project }, { data: activities }] = await Promise.all([
    supabase.from("projects").select("*").eq("slug", slug).maybeSingle(),
    supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  return NextResponse.json({ project, activities: activities ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await getCallerAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const supabase = createServerClient();

  if (!(await checkAccess(auth, slug, supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = auth.role === "admin"
    ? ["name", "description", "kpis", "image_url", "goal", "status", "raised", "location", "since_year"]
    : ["description", "kpis", "image_url", "goal"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { error } = await supabase.from("projects").update(update).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
