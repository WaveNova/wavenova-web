'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

function useCountUp(target: number, enabled: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const dur = 1500;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      setValue(v);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, enabled]);

  return value;
}

type StatItem = {
  target: number;
  suffix?: string;
  label: string;
  sub: string;
  plus?: boolean;
};

function StatCell({ item, animate }: { item: StatItem; animate: boolean }) {
  const count = useCountUp(item.target, animate);
  return (
    <div style={{ padding: 'clamp(28px,3.4vw,40px) clamp(16px,2vw,28px)' }}>
      <p style={{
        margin: 0,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontWeight: 500,
        fontSize: 'clamp(26px,3.2vw,38px)',
        lineHeight: 1,
        letterSpacing: '-0.02em',
        color: '#F5F7F8',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {count.toLocaleString('en-US')}
        {item.plus && '+'}
        {item.suffix && (
          <span style={{ fontSize: '0.5em', color: '#7E97AC', marginLeft: 4 }}>{item.suffix}</span>
        )}
      </p>
      <p style={{ margin: '14px 0 0', fontSize: 14, fontWeight: 500, color: '#F5F7F8' }}>
        {item.label}
      </p>
      <p style={{
        margin: '6px 0 0',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 10.5,
        letterSpacing: '0.07em',
        textTransform: 'uppercase' as const,
        color: '#7E97AC',
      }}>
        {item.sub}
      </p>
    </div>
  );
}

type Props = {
  memberBusinesses: number;
  taiwanVolunteers: number;
};

export default function StatStrip({ memberBusinesses, taiwanVolunteers }: Props) {
  const t = useTranslations('statStrip');
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const animate = visible && !reducedMotion;

  const items: StatItem[] = [
    { target: 276731, suffix: 'kg', label: t('kgLabel'), sub: t('kgSource') },
    { target: memberBusinesses, label: t('bizLabel'), sub: t('bizSub') },
    { target: 5, label: t('stationsLabel'), sub: t('stationsList') },
    { target: taiwanVolunteers, label: t('volunteersLabel'), sub: t('volunteersSub'), plus: true },
  ];

  const borderLeft = '1px solid rgba(126,151,172,.22)';

  return (
    <section
      ref={ref}
      aria-label="Key figures"
      style={{ background: 'var(--navy-alt)', borderBottom: '1px solid rgba(126,151,172,.22)' }}
    >
      <div style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '0 clamp(20px,5vw,40px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
      }}>
        {items.map((item, i) => (
          <div
            key={item.label}
            style={i > 0 ? { borderLeft } : undefined}
          >
            <StatCell item={item} animate={animate} />
          </div>
        ))}
      </div>
    </section>
  );
}
