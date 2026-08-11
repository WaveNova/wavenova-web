import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section
      id="top"
      style={{
        padding: 'clamp(72px,10vw,132px) clamp(20px,5vw,40px) clamp(56px,7vw,88px)',
        background: 'var(--navy-800)',
        borderBottom: '1px solid rgba(126,151,172,.22)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <p style={{
          margin: '0 0 clamp(20px,3vw,32px)',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: 'var(--teal-500)',
        }}>
          {t('kicker')}
        </p>

        <h1 style={{
          margin: 0,
          maxWidth: '20ch',
          fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
          fontWeight: 400,
          fontSize: 'clamp(40px,7.2vw,82px)',
          lineHeight: 1.03,
          letterSpacing: '-0.015em',
          color: '#F5F7F8',
        }}>
          {t('heading')}
        </h1>

        <p style={{
          margin: 'clamp(24px,3vw,32px) 0 0',
          maxWidth: '58ch',
          fontFamily: 'var(--font-instrument-sans), var(--font-dm-sans), sans-serif',
          fontSize: 'clamp(16px,1.4vw,19px)',
          lineHeight: 1.65,
          color: '#7E97AC',
        }}>
          {t('body')}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginTop: 'clamp(28px,3.6vw,40px)' }}>
          <a
            href="#playbook"
            style={{
              padding: '14px 26px',
              borderRadius: 2,
              background: 'var(--teal-500)',
              color: 'var(--navy-800)',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {t('ctaPrimary')}
          </a>
          <a
            href="#support"
            style={{
              padding: '14px 26px',
              borderRadius: 2,
              border: '1px solid rgba(126,151,172,.5)',
              color: '#F5F7F8',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {t('ctaSecondary')}
          </a>
        </div>

        <div style={{
          display: 'flex',
          gap: 'clamp(16px,3vw,36px)',
          flexWrap: 'wrap' as const,
          marginTop: 'clamp(40px,5vw,64px)',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: '#7E97AC',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal-500)', flexShrink: 0 }} />
            {t('tagIndonesia')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8E2D4', flexShrink: 0 }} />
            {t('tagTaiwan')}
          </span>
        </div>
      </div>
    </section>
  );
}
