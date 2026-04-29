import { createServerClient } from "./supabase-server";
import { NextRequest, NextResponse } from "next/server";

export interface CallerAuth {
  email: string;
  role: "admin" | "partner" | null;
  partnerSlug: string | null;
}

export async function getCallerAuth(req: NextRequest): Promise<CallerAuth | NextResponse> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_roles")
    .select("role, partner_slug")
    .eq("email", user.email)
    .maybeSingle();

  return {
    email: user.email,
    role: (data?.role as "admin" | "partner") ?? null,
    partnerSlug: data?.partner_slug ?? null,
  };
}
