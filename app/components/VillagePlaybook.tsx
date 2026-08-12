import { useTranslations } from 'next-intl';

export default function VillagePlaybook() {
  const t = useTranslations('playbook');

  const phases = [
    {
      kicker: t('phase1Kicker'),
      heading: t('phase1Heading'),
      body: t('phase1Body'),
      cost: t('phase1Cost'),
      padRight: true,
    },
    {
      kicker: t('phase2Kicker'),
      heading: t('phase2Heading'),
      body: t('phase2Body'),
      cost: t('phase2Cost'),
      padRight: false,
    },
    {
      kicker: t('phase3Kicker'),
      heading: t('phase3Heading'),
      body: t('phase3Body'),
      cost: t('phase3Cost'),
      padRight: false,
    },
  ];

  return (
    <section
      id="playbook"
      style={{
        padding: 'clamp(64px,8vw,108px) clamp(20px,5vw,40px)',
        background: 'var(--navy-800)',
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
          maxWidth: '26ch',
          fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
          fontWeight: 400,
          fontSize: 'clamp(27px,3.6vw,42px)',
          lineHeight: 1.14,
          letterSpacing: '-0.01em',
          color: '#F5F7F8',
        }}>
          {t('heading')}
        </h2>
        <p style={{ margin: '16px 0 0', maxWidth: '54ch', fontSize: 16, color: '#7E97AC' }}>
          {t('sub')}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
          marginTop: 'clamp(40px,5vw,64px)',
          borderTop: '1px solid rgba(126,151,172,.22)',
        }}>
          {phases.map((phase, i) => (
            <div
              key={phase.kicker}
              style={{
                padding: `clamp(24px,3vw,34px) ${i === 2 ? '0' : 'clamp(20px,2.4vw,32px)'} clamp(24px,3vw,34px) ${i === 0 ? '0' : 'clamp(20px,2.4vw,32px)'}`,
                borderLeft: i > 0 ? '1px solid rgba(126,151,172,.22)' : undefined,
              }}
            >
              <p style={{
                margin: '0 0 20px',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: 'var(--teal-500)',
              }}>
                {phase.kicker}
              </p>
              <h3 style={{
                margin: '0 0 12px',
                fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
                fontWeight: 400,
                fontSize: 20,
                lineHeight: 1.25,
                color: '#F5F7F8',
              }}>
                {phase.heading}
              </h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#7E97AC' }}>
                {phase.body}
              </p>
              <p style={{
                margin: '20px 0 0',
                paddingTop: 14,
                borderTop: '1px solid rgba(126,151,172,.22)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11.5,
                letterSpacing: '0.06em',
                color: '#F5F7F8',
              }}>
                {phase.cost}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
