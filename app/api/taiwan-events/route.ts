import { NextResponse } from 'next/server';

export const revalidate = 3600; // re-fetch from Luma once per hour

type LumaEvent = {
  api_id: string;
  name: string;
  start_at: string;
  end_at: string;
  url: string;
  cover_url?: string | null;
  geo_address_info?: { city?: string; region?: string } | null;
  ticket_info?: {
    spots_total?: number | null;
    spots_remaining?: number | null;
    is_free?: boolean;
  } | null;
};

export type TaiwanEvent = {
  id: string;
  name: string;
  startAt: string;
  url: string;
  locationLabel: string;
  spotsTotal: number | null;
  spotsRemaining: number | null;
  isPast: boolean;
};

export async function GET() {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ events: [] }, { status: 200 });
  }

  const calendarApiId = process.env.LUMA_CALENDAR_ID ?? 'cal-vR9ilrlftFoUiDt';

  try {
    // Try upcoming events first
    const upcomingRes = await fetch(
      `https://api.lu.ma/public/v1/calendar/list-events?calendar_api_id=${calendarApiId}&pagination_limit=10`,
      {
        headers: { 'x-luma-api-key': apiKey },
        next: { revalidate: 3600 },
      }
    );

    if (!upcomingRes.ok) {
      console.error('[taiwan-events] Luma API error:', upcomingRes.status, await upcomingRes.text());
      return NextResponse.json({ events: [] });
    }

    const data = await upcomingRes.json();
    const allEntries: { event: LumaEvent }[] = data?.entries ?? [];
    const now = new Date();

    const upcoming = allEntries
      .filter((e) => new Date(e.event.start_at) > now)
      .slice(0, 3);

    const source = upcoming.length > 0
      ? upcoming
      : allEntries
          .filter((e) => new Date(e.event.start_at) <= now)
          .sort((a, b) => new Date(b.event.start_at).getTime() - new Date(a.event.start_at).getTime())
          .slice(0, 3);

    const events: TaiwanEvent[] = source.map(({ event }) => {
      const geo = event.geo_address_info;
      const locationLabel = [geo?.city, geo?.region].filter(Boolean).join(' · ') || '';
      return {
        id: event.api_id,
        name: event.name,
        startAt: event.start_at,
        url: event.url,
        locationLabel,
        spotsTotal: event.ticket_info?.spots_total ?? null,
        spotsRemaining: event.ticket_info?.spots_remaining ?? null,
        isPast: new Date(event.start_at) <= now,
      };
    });

    return NextResponse.json({ events });
  } catch (err) {
    console.error('[taiwan-events] fetch error:', err);
    return NextResponse.json({ events: [] });
  }
}
