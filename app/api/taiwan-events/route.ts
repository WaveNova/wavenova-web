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

const BASE = 'https://api.lu.ma/public/v1';

function lumaHeaders(key: string) {
  return { 'x-luma-api-key': key };
}

function toTaiwanEvent(event: LumaEvent, now: Date): TaiwanEvent {
  const geo = event.geo_address_info;
  return {
    id: event.api_id,
    name: event.name,
    startAt: event.start_at,
    url: event.url,
    locationLabel: [geo?.city, geo?.region].filter(Boolean).join(' · ') || '',
    spotsTotal: event.ticket_info?.spots_total ?? null,
    spotsRemaining: event.ticket_info?.spots_remaining ?? null,
    isPast: new Date(event.start_at) <= now,
  };
}

// Two targeted requests instead of fetching an unordered batch and filtering
// client-side. Luma's default order is not guaranteed by time, so fetching
// the first N items can miss the truly upcoming events entirely.
async function fetchEvents(
  calendarId: string,
  apiKey: string,
  direction: 'upcoming' | 'past',
  now: Date,
): Promise<LumaEvent[]> {
  const nowIso = now.toISOString();
  const params = new URLSearchParams({
    calendar_api_id: calendarId,
    sort_column: 'start_at',
    sort_direction: direction === 'upcoming' ? 'asc' : 'desc',
    pagination_limit: '3',
    ...(direction === 'upcoming' ? { after: nowIso } : { before: nowIso }),
  });

  const res = await fetch(`${BASE}/calendar/list-events?${params}`, {
    headers: lumaHeaders(apiKey),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`[taiwan-events] list-events(${direction}) ${res.status}:`, await res.text());
    return [];
  }

  const data = await res.json();
  return (data?.entries ?? []).map((e: { event: LumaEvent }) => e.event);
}

// Fetch the calendar's own public URL so TaiwanCleanups can link to it.
// Fails gracefully — returns null if the endpoint isn't available on the
// legacy host (api.lu.ma), so the "view all" link simply won't render.
async function fetchCalendarUrl(calendarId: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE}/calendar/get?calendar_api_id=${calendarId}`,
      { headers: lumaHeaders(apiKey), next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Response shape may be { calendar: { url } } or { url } depending on version
    return (data?.calendar?.url ?? data?.url ?? null) as string | null;
  } catch {
    return null;
  }
}

export async function GET() {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ events: [], calendarUrl: null });
  }

  const calendarId = process.env.LUMA_CALENDAR_ID ?? 'cal-vR9ilrlftFoUiDt';
  const now = new Date();

  try {
    // Upcoming events and calendar URL fetched in parallel
    const [upcomingEvents, calendarUrl] = await Promise.all([
      fetchEvents(calendarId, apiKey, 'upcoming', now),
      fetchCalendarUrl(calendarId, apiKey),
    ]);

    // If no upcoming events, fall back to the 3 most recent past events
    const source =
      upcomingEvents.length > 0
        ? upcomingEvents
        : await fetchEvents(calendarId, apiKey, 'past', now);

    const events: TaiwanEvent[] = source.map((e) => toTaiwanEvent(e, now));

    return NextResponse.json({ events, calendarUrl });
  } catch (err) {
    console.error('[taiwan-events] fetch error:', err);
    return NextResponse.json({ events: [], calendarUrl: null });
  }
}
