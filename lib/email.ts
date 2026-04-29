import { Resend } from "resend";

const FROM = "WaveNova <hi@wavenova.org>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://wavenova.org";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getBankDetails() {
  return {
    name: process.env.WAVENOVA_BANK_NAME ?? "OCBC",
    account: process.env.WAVENOVA_BANK_ACCOUNT ?? "160800030803",
    holder: process.env.WAVENOVA_BANK_HOLDER ?? "Yayasan Wave Nova Ocean",
    swift: process.env.WAVENOVA_BANK_SWIFT ?? "NISPIDJA",
  };
}

export async function sendDonationReceipt({
  to,
  donorName,
  amount,
  projectName,
  referenceCode,
  frequency,
}: {
  to: string;
  donorName: string;
  amount: number;
  projectName: string;
  referenceCode: string;
  frequency: "one-time" | "monthly";
}) {
  const isMonthly = frequency === "monthly";
  const bank = getBankDetails();

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Your donation to ${projectName} — ${referenceCode}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:#1A7A8A;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;font-size:28px;margin:0 0 4px;">Thank you, ${donorName}!</h1>
      <p style="color:rgba(255,255,255,0.8);margin:0;font-size:16px;">Your donation is on its way to ${projectName}.</p>
    </div>
    <div style="padding:32px 40px;">
      <div style="background:#EDF9FB;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;">Donation Summary</p>
        <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#1A7A8A;">$${amount.toFixed(0)} USD${isMonthly ? "/month" : ""}</p>
        <p style="margin:0;color:#4B5563;font-size:14px;">${projectName} · ${isMonthly ? "Monthly recurring" : "One-time"}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#6B7280;">Reference: <strong style="color:#1F2937;">${referenceCode}</strong></p>
      </div>

      <h2 style="font-size:18px;color:#1F2937;margin:0 0 12px;">Bank Transfer Instructions</h2>
      <p style="color:#4B5563;font-size:14px;margin:0 0 16px;">Please transfer <strong>$${amount.toFixed(0)} USD</strong> to the following account and use your reference code in the payment notes:</p>

      <div style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#F9FAFB;">
            <td style="padding:12px 16px;color:#6B7280;width:40%;">Bank</td>
            <td style="padding:12px 16px;color:#1F2937;font-weight:600;">${bank.name}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6B7280;border-top:1px solid #E5E7EB;">Account Number</td>
            <td style="padding:12px 16px;color:#1F2937;font-weight:600;border-top:1px solid #E5E7EB;">${bank.account}</td>
          </tr>
          <tr style="background:#F9FAFB;">
            <td style="padding:12px 16px;color:#6B7280;border-top:1px solid #E5E7EB;">Account Holder</td>
            <td style="padding:12px 16px;color:#1F2937;font-weight:600;border-top:1px solid #E5E7EB;">${bank.holder}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6B7280;border-top:1px solid #E5E7EB;">Swift Code</td>
            <td style="padding:12px 16px;color:#1F2937;font-weight:600;border-top:1px solid #E5E7EB;">${bank.swift}</td>
          </tr>
          <tr style="background:#F9FAFB;">
            <td style="padding:12px 16px;color:#6B7280;border-top:1px solid #E5E7EB;">Reference / Notes</td>
            <td style="padding:12px 16px;color:#24B5CB;font-weight:700;border-top:1px solid #E5E7EB;">${referenceCode}</td>
          </tr>
        </table>
      </div>

      <p style="color:#6B7280;font-size:13px;margin:0 0 24px;">Once we receive your transfer, we'll send a confirmation email and your donation will appear on the impact dashboard within 1–2 business days.</p>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#24B5CB;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">View Impact Dashboard →</a>
      </div>

      <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0;">
        WaveNova Yayasan · Lombok, Indonesia · <a href="mailto:hi@wavenova.org" style="color:#24B5CB;">hi@wavenova.org</a><br>
        All donations are project-tagged and publicly reported. WaveNova Yayasan is an Indonesian nonprofit foundation and cannot issue tax receipts recognized by foreign governments.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}

export async function sendMagicLink({
  to,
  magicLink,
}: {
  to: string;
  magicLink: string;
}) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Your WaveNova login link",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:#1A7A8A;padding:28px 36px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;">Sign in to WaveNova</h1>
    </div>
    <div style="padding:32px 36px;text-align:center;">
      <p style="color:#4B5563;font-size:15px;margin:0 0 24px;">Click the button below to sign in and view your giving history.</p>
      <a href="${magicLink}" style="display:inline-block;background:#24B5CB;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Sign In →</a>
      <p style="color:#9CA3AF;font-size:12px;margin:24px 0 0;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}
