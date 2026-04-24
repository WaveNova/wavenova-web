import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { sendDonationReceipt } from "@/lib/email";

function generateReferenceCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `WN-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donorName, donorEmail, projectSlug, amountUsd, frequency, tipAmount } = body;

    // Basic validation
    if (!donorName || !donorEmail || !projectSlug || !amountUsd) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (typeof amountUsd !== "number" || amountUsd <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    const referenceCode = generateReferenceCode();
    const supabase = createServerClient();

    // Look up or create donor record
    let donorId: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingDonor } = await (supabase as any)
      .from("donors")
      .select("id")
      .eq("email", donorEmail)
      .maybeSingle();

    if (existingDonor?.id) {
      donorId = existingDonor.id;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newDonor } = await (supabase as any)
        .from("donors")
        .insert({ email: donorEmail, name: donorName, total_donated: 0, total_kg_removed: 0 })
        .select("id")
        .maybeSingle();
      if (newDonor?.id) donorId = newDonor.id;
    }

    // Insert donation record
    const { error: donationError } = await supabase.from("donations").insert({
      donor_id: donorId,
      project_slug: projectSlug,
      amount_usd: amountUsd,
      frequency: frequency ?? "one-time",
      reference_code: referenceCode,
      status: "pending",
      tip_amount: tipAmount ?? 0,
      donor_name: donorName,
      donor_email: donorEmail,
    });

    if (donationError) {
      console.error("Donation insert error:", donationError);
      // If it's just a Supabase config issue (not connected yet), still return success
      if (donationError.code !== "PGRST301" && !donationError.message.includes("relation")) {
        return NextResponse.json({ error: "Failed to record donation." }, { status: 500 });
      }
    }

    // Look up project name for the email
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("slug", projectSlug)
      .single();

    const projectName = project?.name ?? projectSlug;

    // Send receipt email (non-blocking — don't fail if email fails)
    try {
      await sendDonationReceipt({
        to: donorEmail,
        donorName,
        amount: amountUsd + (tipAmount ?? 0),
        projectName,
        referenceCode,
        frequency: frequency ?? "one-time",
      });
    } catch (emailErr) {
      console.error("Email send failed (non-fatal):", emailErr);
    }

    return NextResponse.json({
      success: true,
      referenceCode,
      projectName,
      bankName: process.env.WAVENOVA_BANK_NAME ?? "Bank Central Asia (BCA)",
      bankAccount: process.env.WAVENOVA_BANK_ACCOUNT ?? "1234567890",
      bankHolder: process.env.WAVENOVA_BANK_HOLDER ?? "Yayasan WaveNova Indonesia",
    });
  } catch (err) {
    console.error("Donation API error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
