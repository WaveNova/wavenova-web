import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  PARTNER_TIER_ORDER,
  partnersByTier,
  type PartnerLogo,
  type PartnerTier,
} from '../../lib/partner-logos';

/**
 * Partner logo wall (PRD v1.20 §14) — three tiers, placed at the very bottom
 * of the page just before the Footer.
 *
 * Pure static data (`lib/partner-logos.ts`): no API call, no Supabase query.
 * Server Component — the marquee is CSS-only (`.wn-marquee`), so no
 * client-side JavaScript is shipped for it.
 *
 * Layout per tier:
 *   - cleanup (11 logos) → single seamless auto-scrolling row
 *   - founding / lombok (3 each) → static grid, they fit on one line
 */

const TIER_LABEL_KEY: Record<PartnerTier, string> = {
  founding: 'foundingTitle',
  cleanup: 'cleanupTitle',
  lombok: 'lombokTitle',
};

/** Logos scroll as one row, so each item needs a fixed, uniform footprint. */
const MARQUEE_ITEM_WIDTH = 150;
const MARQUEE_ITEM_GAP = 40;
const LOGO_BOX_HEIGHT = 72;

/**
 * Encode each path segment separately.
 *
 * `encodeURI` is not enough: it leaves `+` untouched, and the server then reads
 * `Logotype color + black.svg` as a space, so the file 404s. Verified against
 * the deployment — `...color%20+%20black.svg` → 404, `...color%20%2B%20black.svg`
 * → 200. `encodeURIComponent` escapes `+` (and spaces, and the em-dash) while
 * splitting on "/" keeps the separators intact.
 */
function encodeLogoPath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

function LogoImage({ partner }: { partner: PartnerLogo }) {
  // Next.js' image optimizer rejects SVG unless `dangerouslyAllowSVG` is set —
  // confirmed on the deployment, where every SVG returns 400
  // INVALID_IMAGE_OPTIMIZE_REQUEST while PNGs return 200. SVG is already
  // resolution-independent and tiny, so serve it directly instead of enabling
  // that flag globally for every image on the site.
  const isSvg = partner.logoPath.toLowerCase().endsWith('.svg');

  const img = (
    <Image
      src={encodeLogoPath(partner.logoPath)}
      alt={partner.name}
      width={MARQUEE_ITEM_WIDTH}
      height={LOGO_BOX_HEIGHT}
      unoptimized={isSvg}
      style={{
        // Crop tight to the artwork: scale to fit without letterboxing.
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
      }}
    />
  );

  if (!partner.darkChip) return img;

  // Dark tile for white-on-dark artwork, so its real colours survive.
  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      padding: '10px 14px',
      borderRadius: 4,
      background: 'var(--navy-800)',
      boxSizing: 'border-box',
    }}>
      {img}
    </span>
  );
}

function StaticGrid({ partners }: { partners: PartnerLogo[] }) {
  return (
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
            height: LOGO_BOX_HEIGHT,
          }}
        >
          <LogoImage partner={partner} />
        </li>
      ))}
    </ul>
  );
}

function Marquee({ partners }: { partners: PartnerLogo[] }) {
  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    width: MARQUEE_ITEM_WIDTH,
    height: LOGO_BOX_HEIGHT,
    // Uniform margin on every item (not `gap`) keeps both halves of the track
    // exactly equal, which is what makes the -50% loop seamless.
    marginRight: MARQUEE_ITEM_GAP,
  } as const;

  return (
    <div className="wn-marquee">
      <ul className="wn-marquee-track" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {partners.map((partner) => (
          <li key={partner.logoPath} style={itemStyle}>
            <LogoImage partner={partner} />
          </li>
        ))}
        {/* Second pass purely to make the loop seamless. Hidden from assistive
            tech so the same partners are not announced twice. */}
        {partners.map((partner) => (
          <li
            key={`dup-${partner.logoPath}`}
            style={itemStyle}
            className="wn-marquee-duplicate"
            aria-hidden="true"
          >
            <LogoImage partner={partner} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PartnerLogos() {
  const t = useTranslations('partners');

  return (
    <section
      id="partners"
      style={{
        padding: 'clamp(64px,8vw,108px) clamp(20px,5vw,40px)',
        // PRD v1.24 §14.6: the whole Partners block — kicker, heading and all
        // three tiers — shares one brand-tinted background, not just Cleanup.
        background: 'var(--teal-200)',
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

              {tier === 'cleanup'
                ? <Marquee partners={partners} />
                : <StaticGrid partners={partners} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
