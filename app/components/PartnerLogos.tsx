import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  PARTNER_TIER_ORDER,
  partnersByTier,
  type PartnerTier,
} from '../../lib/partner-logos';

/**
 * Partner logo wall (PRD v1.19 §14) — three tiers, grayscale with colour on
 * hover, placed at the very bottom of the page just before the Footer.
 *
 * Pure static data (`lib/partner-logos.ts`): no API call, no Supabase query.
 * Server Component — the hover treatment is CSS-only (`.wn-partner-logo`),
 * so no client-side JavaScript is needed.
 */

const TIER_LABEL_KEY: Record<PartnerTier, string> = {
  founding: 'foundingTitle',
  cleanup: 'cleanupTitle',
  lombok: 'lombokTitle',
};

export default function PartnerLogos() {
  const t = useTranslations('partners');

  return (
    <section
      id="partners"
      style={{
        padding: 'clamp(64px,8vw,108px) clamp(20px,5vw,40px)',
        background: '#FFFFFF',
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
          color: 'var(--teal-600)',
        }}>
          {t('kicker')}
        </p>

        <h2 style={{
          margin: 0,
          maxWidth: '24ch',
          fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
          fontWeight: 400,
          fontSize: 'clamp(27px,3.6vw,42px)',
          lineHeight: 1.14,
          letterSpacing: '-0.01em',
          color: 'var(--navy-800)',
        }}>
          {t('heading')}
        </h2>

        {PARTNER_TIER_ORDER.map((tier) => {
          const partners = partnersByTier(tier);
          if (partners.length === 0) return null;

          return (
            <div key={tier} style={{ marginTop: 'clamp(36px,4.5vw,56px)' }}>
              <h3 style={{
                margin: '0 0 20px',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: '#3F5468',
              }}>
                {t(TIER_LABEL_KEY[tier])}
              </h3>

              <ul style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 'clamp(16px,2.5vw,32px)',
                margin: 0,
                padding: 0,
                listStyle: 'none',
                alignItems: 'center',
              }}>
                {partners.map((partner) => (
                  <li
                    key={partner.logoPath}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 72,
                    }}
                  >
                    <Image
                      // Paths contain spaces and CJK characters; encode so the
                      // generated URL stays valid.
                      src={encodeURI(partner.logoPath)}
                      alt={partner.name}
                      width={150}
                      height={72}
                      className={
                        partner.invert
                          ? 'wn-partner-logo wn-partner-logo-invert'
                          : 'wn-partner-logo'
                      }
                      style={{
                        // Crop tight to the artwork: scale to fit the cell
                        // without letterboxing or stretching.
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
