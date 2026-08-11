import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer style={{
      padding: 'clamp(52px,6vw,80px) clamp(20px,5vw,40px) 32px',
      background: 'var(--navy-800)',
      borderTop: '1px solid rgba(126,151,172,.22)',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 'clamp(28px,4vw,56px)',
        }}>
          {/* Brand column */}
          <div>
            <Image
              src="/logo-horizontal-white.png"
              alt="WaveNova"
              width={132}
              height={34}
              style={{ height: 34, width: 'auto' }}
            />
            <p style={{
              margin: '16px 0 0',
              maxWidth: '34ch',
              fontFamily: 'var(--font-instrument-sans), var(--font-dm-sans), sans-serif',
              fontSize: 14,
              lineHeight: 1.7,
              color: '#7E97AC',
            }}>
              {t('tagline')}
            </p>
          </div>

          {/* Organisation */}
          <div>
            <p style={{
              margin: '0 0 16px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 10.5,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#7E97AC',
            }}>
              {t('orgHeading')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
              <a href="#playbook" style={{ color: '#F5F7F8', textDecoration: 'none' }}>{t('orgMethod')}</a>
              <a href="#stations" style={{ color: '#F5F7F8', textDecoration: 'none' }}>{t('orgVillages')}</a>
              <a href="#stations" style={{ color: '#F5F7F8', textDecoration: 'none' }}>{t('orgImpact')}</a>
            </div>
          </div>

          {/* Get involved */}
          <div>
            <p style={{
              margin: '0 0 16px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 10.5,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#7E97AC',
            }}>
              {t('involvedHeading')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
              <a href="#taiwan"  style={{ color: '#F5F7F8', textDecoration: 'none' }}>{t('involvedCleanup')}</a>
              <a href="#support" style={{ color: '#F5F7F8', textDecoration: 'none' }}>{t('involvedCorporate')}</a>
              <a href="#support" style={{ color: '#F5F7F8', textDecoration: 'none' }}>{t('involvedDonate')}</a>
              <a href="#support" style={{ color: '#F5F7F8', textDecoration: 'none' }}>{t('involvedVolunteer')}</a>
            </div>
          </div>

          {/* Connect */}
          <div>
            <p style={{
              margin: '0 0 16px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 10.5,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#7E97AC',
            }}>
              Connect
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
              <a href="mailto:hi@wavenova.org" style={{ color: '#F5F7F8', textDecoration: 'none' }}>hi@wavenova.org</a>
              <a href="https://instagram.com/wavenova.ocean" target="_blank" rel="noopener noreferrer" style={{ color: '#F5F7F8', textDecoration: 'none' }}>IG @wavenova.ocean</a>
              <span style={{ color: '#7E97AC' }}>South Lombok · Taipei</span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap' as const,
          marginTop: 'clamp(40px,5vw,64px)',
          paddingTop: 20,
          borderTop: '1px solid rgba(126,151,172,.22)',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          color: '#7E97AC',
        }}>
          <span>{t('copyright')}</span>
          <span>{t('entity')}</span>
        </div>
      </div>
    </footer>
  );
}
