import { useTranslations } from 'next-intl';

export default function SupportBlock() {
  const t = useTranslations('support');

  const cards = [
    {
      title: t('esgTitle'),
      badge: t('esgBadge'),
      body: t('esgBody'),
      cta: t('esgCta'),
      href: 'mailto:hi@wavenova.org?subject=Corporate%20ESG%20Partnership',
      borderColor: 'var(--teal-500)',
      ctaStyle: {
        background: 'var(--teal-500)',
        color: 'var(--navy-800)',
        border: 'none',
      } as React.CSSProperties,
    },
    {
      title: t('donateTitle'),
      badge: t('donateBadge'),
      body: t('donateBody'),
      cta: t('donateCta'),
      href: 'mailto:hi@wavenova.org?subject=International%20Donation',
      borderColor: 'var(--teal-500)',
      ctaStyle: {
        background: 'transparent',
        color: 'var(--teal-500)',
        border: '1px solid var(--teal-500)',
      } as React.CSSProperties,
    },
    {
      title: t('memberTitle'),
      badge: t('memberBadge'),
      body: t('memberBody'),
      cta: t('memberCta'),
      href: 'mailto:hi@wavenova.org?subject=Membership%20Interest',
      borderColor: 'rgba(126,151,172,.22)',
      badgeColor: '#7E97AC',
      ctaStyle: {
        background: 'transparent',
        color: '#F5F7F8',
        border: '1px solid rgba(126,151,172,.5)',
      } as React.CSSProperties,
    },
  ];

  return (
    <section
      id="support"
      style={{
        padding: 'clamp(64px,8vw,108px) clamp(20px,5vw,40px)',
        background: 'var(--navy-alt)',
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

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))',
          gap: 16,
          marginTop: 'clamp(36px,4.5vw,56px)',
        }}>
          {cards.map((card) => (
            <div
              key={card.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${card.borderColor}`,
                borderRadius: 2,
                padding: 26,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
                  fontWeight: 400,
                  fontSize: 19,
                  color: '#F5F7F8',
                }}>
                  {card.title}
                </span>
                <span style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 10.5,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  color: card.badgeColor ?? 'var(--teal-500)',
                  whiteSpace: 'nowrap' as const,
                }}>
                  {card.badge}
                </span>
              </div>

              <p style={{ margin: '16px 0 28px', fontSize: 15, lineHeight: 1.7, color: '#7E97AC' }}>
                {card.body}
              </p>

              <a
                href={card.href}
                style={{
                  marginTop: 'auto',
                  alignSelf: 'flex-start',
                  padding: '11px 20px',
                  borderRadius: 2,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  ...card.ctaStyle,
                }}
              >
                {card.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
