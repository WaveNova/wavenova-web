import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Uniform success body — same whether the email is new or already exists.
// This prevents enumeration: a visitor cannot determine from the response
// whether a given email was already subscribed.
const OK = { ok: true, message: 'subscribed' };

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 });
  }

  const supabase = createServerClient();

  const { error } = await supabase
    .from('email_signups')
    .insert({ email, source: 'homepage_subscription_card' });

  if (error) {
    // 23505 = unique_violation (duplicate email) — treat as success
    if (error.code === '23505') {
      return NextResponse.json(OK);
    }
    console.error('[email-signups] insert error:', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json(OK);
}
