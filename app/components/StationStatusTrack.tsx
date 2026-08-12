'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

type PhaseNote = { zh: string; en: string; id?: string } | null;

type Station = {
  slug: string;
  name: string;
  phase: number;
  phase1_note: PhaseNote;
  phase2_pct: number | null;
  phase2_note: PhaseNote;
  phase3_complete: boolean;
  phase3_note: PhaseNote;
  annual_diverted_kg: number | null;
  annual_diverted_year: number | null;
};

type Props = {
  stations: Station[];
};

type TrackCellProps = {
  fill: number;
  note: string | null;
  extra?: React.ReactNode;
  bgId: string;
  animate: boolean;
  reducedMotion: boolean;
  isNotStarted?: boolean;
};

function TrackCell({ fill, note, extra, animate, reducedMotion, isNotStarted }: TrackCellProps) {
  const [width, setWidth] = useState(reducedMotion ? fill : 0);

  useEffect(() => {
    if (reducedMotion || isNotStarted) { setWidth(fill); return; }
    if (!animate) return;
    const t = setTimeout(() => setWidth(fill), 80);
    return () => clearTimeout(t);
  }, [animate, fill, reducedMotion, isNotStarted]);

  const isComplete = fill >= 100;
  const isInProgress = !isNotStarted && fill < 100;

  return (
    <div style={{
      padding: '18px 16px',
      borderLeft: '1px solid rgba(126,151,172,.22)',
      background: isNotStarted ? undefined : 'rgba(36,181,203,.07)',
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 14 }}>
        <span style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(126,151,172,.22)' }} />
        {!isNotStarted && (
          <span style={{
            position: 'absolute',
            left: 0,
            width: `${width}%`,
            height: 1,
            background: 'var(--teal-500)',
            transition: reducedMotion ? undefined : 'width 700ms ease-out',
          }} />
        )}
        <span style={{
          position: 'relative',
          width: 11,
          height: 11,
          borderRadius: '50%',
          background: isNotStarted
            ? 'rgba(126,151,172,.4)'
            : isComplete
              ? 'var(--teal-500)'
              : 'var(--navy-alt)',
          border: isInProgress ? '1.5px solid var(--teal-500)' : undefined,
          flexShrink: 0,
        }} />
      </div>
      {note && (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: '#7E97AC' }}>{note}</p>
      )}
      {extra}
    </div>
  );
}

export default function StationStatusTrack({ stations }: Props) {
  const t = useTranslations('stations');
  const locale = useLocale();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = trackRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function noteText(note: PhaseNote): string | null {
    if (!note) return null;
    return locale === 'zh' ? note.zh : note.en;
  }

  const phaseLabel = (station: Station): string => {
    if (station.phase === 3 && station.phase3_complete) return 'SBCA · Phase 3';
    if (station.phase === 2) return 'Phase 1 → Phase 2';
    if (station.phase === 1) return 'Phase 1 → Phase 2';
    return `Phase ${station.phase}`;
  };

  const borderLeft = '1px solid rgba(126,151,172,.22)';

  return (
    <section
      id="stations"
      style={{
        padding: 'clamp(64px,8vw,108px) clamp(20px,5vw,40px)',
        background: 'var(--navy-alt)',
        borderBottom: '1px solid rgba(126,151,172,.22)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' as const }}>
          <div>
            <p style={{
              margin: '0 0 18px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: 'var(--teal-500)',
            }}>
              {t('kicker')}
            </p>
            <h2 style={{
              margin: 0,
              fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
              fontWeight: 400,
              fontSize: 'clamp(27px,3.6vw,42px)',
              lineHeight: 1.14,
              letterSpacing: '-0.01em',
              color: '#F5F7F8',
            }}>
              {t('heading')}
            </h2>
          </div>

          <div style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap' as const,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10.5,
            letterSpacing: '0.07em',
            textTransform: 'uppercase' as const,
            color: '#7E97AC',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--teal-500)', flexShrink: 0 }} />
              {t('legendComplete')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid var(--teal-500)', flexShrink: 0 }} />
              {t('legendInProgress')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(126,151,172,.4)', flexShrink: 0 }} />
              {t('legendNotStarted')}
            </span>
          </div>
        </div>

        <div ref={trackRef} style={{ marginTop: 'clamp(36px,4.5vw,56px)', overflowX: 'auto' }}>
          <div style={{ minWidth: 740, borderTop: '1px solid rgba(126,151,172,.22)' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '210px repeat(3,1fr)', borderBottom: '1px solid rgba(126,151,172,.22)' }}>
              {[t('colVillage'), t('colPhase1'), t('colPhase2'), t('colPhase3')].map((col, i) => (
                <div key={col} style={{
                  padding: '12px 16px',
                  paddingLeft: i === 0 ? 0 : 16,
                  borderLeft: i > 0 ? borderLeft : undefined,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 10.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: '#7E97AC',
                }}>
                  {col}
                </div>
              ))}
            </div>

            {/* Station rows */}
            {stations.map((station, si) => {
              const isLast = si === stations.length - 1;
              const p3note = station.phase3_note ? noteText(station.phase3_note) : null;
              return (
                <div
                  key={station.slug}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '210px repeat(3,1fr)',
                    borderBottom: isLast ? undefined : borderLeft.replace('left', 'bottom'),
                  }}
                >
                  {/* Village name */}
                  <div style={{ padding: '18px 16px 18px 0' }}>
                    <p style={{
                      margin: 0,
                      fontFamily: "'DM Serif Display', serif",
                      fontWeight: 400,
                      fontSize: 16,
                      color: '#F5F7F8',
                    }}>
                      {station.name}
                    </p>
                    <p style={{
                      margin: '5px 0 0',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: 10.5,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase' as const,
                      color: 'var(--teal-500)',
                    }}>
                      {phaseLabel(station)}
                    </p>
                  </div>

                  {/* Phase 1 cell */}
                  <TrackCell
                    fill={100}
                    note={noteText(station.phase1_note)}
                    animate={visible}
                    reducedMotion={reducedMotion}
                    bgId={`${station.slug}-p1`}
                  />

                  {/* Phase 2 cell */}
                  <TrackCell
                    fill={station.phase === 3 ? 100 : (station.phase2_pct ?? 0)}
                    note={noteText(station.phase2_note)}
                    animate={visible}
                    reducedMotion={reducedMotion}
                    bgId={`${station.slug}-p2`}
                    extra={
                      station.annual_diverted_kg && station.phase === 3 ? (
                        <>
                          <p style={{
                            margin: '12px 0 0',
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: 11.5,
                            letterSpacing: '0.05em',
                            color: '#F5F7F8',
                          }}>
                            {station.annual_diverted_kg.toLocaleString('en-US')} kg ({station.annual_diverted_year})
                          </p>
                        </>
                      ) : null
                    }
                  />

                  {/* Phase 3 cell */}
                  <TrackCell
                    fill={station.phase3_complete ? 100 : 0}
                    note={p3note}
                    animate={visible}
                    reducedMotion={reducedMotion}
                    bgId={`${station.slug}-p3`}
                    isNotStarted={!station.phase3_complete && station.phase < 3}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
