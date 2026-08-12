'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TaiwanEvent } from '../api/taiwan-events/route';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${mm}.${dd} (${days[d.getDay()]})`;
}

type CardProps = { event: TaiwanEvent; t: ReturnType<typeof useTranslations> };

function EventCard({ event, t }: CardProps) {
  const isOpen = !event.isPast && (event.spotsRemaining === null || event.spotsRemaining > 0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF',
      border: '1px solid rgba(10,22,40,.12)',
      borderRadius: 2,
      padding: 22,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 10.5,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
      }}>
        {isOpen ? (
          <span style={{
            padding: '4px 8px',
            borderRadius: 2,
            background: 'var(--navy-800)',
            color: '#F5F7F8',
          }}>
            {t('badgeOpen')}
          </span>
        ) : (
          <span style={{
            padding: '4px 8px',
            borderRadius: 2,
            border: '1px solid rgba(10,22,40,.2)',
            color: '#3F5468',
          }}>
            {event.name.match(/Cleanup \d+\.?\d*/)?.[0] ?? ''}
          </span>
        )}
        <span style={{ color: '#3F5468' }}>
          {formatDate(event.startAt)}{event.locationLabel ? ` · ${event.locationLabel}` : ''}
        </span>
      </div>

      <h3 style={{
        margin: '20px 0 0',
        fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
        fontWeight: 400,
        fontSize: 19,
        lineHeight: 1.35,
        color: 'var(--navy-800)',
      }}>
        {event.name}
      </h3>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 'auto',
        paddingTop: 18,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 11.5,
        letterSpacing: '0.05em',
        color: 'var(--navy-800)',
      }}>
        {event.spotsTotal !== null && (
          <span>
            {event.spotsTotal}{' '}
            <span style={{ color: '#3F5468' }}>{t('spots')}</span>
          </span>
        )}
        {isOpen && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--navy-800)', fontWeight: 500, borderBottom: '1px solid rgba(10,22,40,.3)', textDecoration: 'none' }}
          >
            {t('signUp')}
          </a>
        )}
      </div>
    </div>
  );
}

export default function TaiwanCleanups() {
  const t = useTranslations('taiwan');
  const [events, setEvents] = useState<TaiwanEvent[]>([]);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/taiwan-events')
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? []);
        setCalendarUrl(d.calendarUrl ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <section
      id="taiwan"
      style={{
        padding: 'clamp(64px,8vw,108px) clamp(20px,5vw,40px)',
        background: '#E8E2D4',
        color: 'var(--navy-800)',
        borderBottom: '1px solid rgba(126,151,172,.22)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <p style={{
          margin: '0 0 18px',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: 'var(--navy-800)',
        }}>
          {t('kicker')}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(20px,3vw,48px)',
          alignItems: 'end',
        }}>
          <h2 style={{
            margin: 0,
            fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
            fontWeight: 400,
            fontSize: 'clamp(27px,3.6vw,42px)',
            lineHeight: 1.14,
            letterSpacing: '-0.01em',
            color: 'var(--navy-800)',
          }}>
            {t('heading')}
          </h2>
          <p style={{
            margin: 0,
            maxWidth: '52ch',
            fontFamily: 'var(--font-instrument-sans), var(--font-dm-sans), sans-serif',
            fontSize: 16,
            lineHeight: 1.7,
            color: '#3F5468',
          }}>
            {t('body')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(265px, 1fr))',
          gap: 16,
          marginTop: 'clamp(36px,4.5vw,56px)',
        }}>
          {loaded && events.length === 0 && (
            <p style={{
              gridColumn: '1/-1',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 13,
              color: '#3F5468',
            }}>
              {t('empty')}
            </p>
          )}
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} t={t} />
          ))}
        </div>

        {events.length > 0 && calendarUrl && (
          <p style={{ marginTop: 24 }}>
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 12,
                letterSpacing: '0.06em',
                color: '#3F5468',
                textDecoration: 'underline',
              }}
            >
              {t('viewMore')}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
