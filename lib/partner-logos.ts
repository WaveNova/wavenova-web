/**
 * Partner logo wall — static front-end data (PRD v1.19 §14).
 *
 * Deliberately NOT in Supabase: the list changes rarely and has no admin UI,
 * so a database would be extra complexity. This is also unrelated to the
 * existing `partners` table (`partner_slug`), which models per-village site
 * operators — a different concept that must not be merged with this.
 *
 * Logo files live in `public/partners/<tier folder>/`. Classification follows
 * the actual folder structure, not the filename-prefix scheme the PRD text
 * originally described.
 */

export type PartnerTier = 'founding' | 'cleanup' | 'lombok';

export type PartnerLogo = {
  /** Display/alt name. */
  name: string;
  tier: PartnerTier;
  /** Path under `public/`. May contain spaces/CJK — encode before use in src. */
  logoPath: string;
  /**
   * Logo artwork is white-only (no dark content), so it would be invisible on
   * the light panel. Rendered inverted to stay legible. Verified per-file by
   * measuring opaque-pixel luminance, not guessed from the filename.
   */
  invert?: boolean;
};

export const PARTNER_LOGOS: PartnerLogo[] = [
  // ── Founding partners (early major sponsors) ──────────────────────────────
  {
    name: 'ABConvert',
    tier: 'founding',
    logoPath: '/partners/foundingPartners/ABConvert — Branding/Logotype color + black.svg',
  },
  {
    name: 'River',
    tier: 'founding',
    logoPath: '/partners/foundingPartners/River/1-Full Logotype, Blue Black.png',
  },
  {
    name: 'Scallop',
    tier: 'founding',
    logoPath: '/partners/foundingPartners/Scallop/logotype_primary_color.png',
  },

  // ── Cleanup partners (Taiwan beach-cleanup collaborators) ─────────────────
  {
    name: 'Hood Coffee',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/HoodCoffeeLogo.png',
  },
  {
    name: 'Revival',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/REVIVAL_RGB_logo_transparent.png',
    invert: true,
  },
  {
    name: '冰茶專賣 Iced Tea Shop',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/冰茶專賣Logo.png',
  },
  {
    name: '日日盎然 Verdant Apothecary',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/日日盎然.PNG',
  },
  {
    name: '水行戶外 AQUA.TRAVEL_TW',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/水行戶外.png',
  },
  {
    name: '潮澎湖 TP BAY',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/潮澎湖logo.png',
  },
  {
    name: '逢甲大學學生會',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/逢甲大學學生會.PNG',
  },
  {
    name: '碳佐麻里 餐飲系列',
    tier: 'cleanup',
    // Same brand also ships a white-only variant (碳佐麻里logo_white.PNG).
    // Only this dark version is used — two tiles for one brand would read as a
    // duplicate, and the white one is invisible on the light panel.
    logoPath: '/partners/cleanupPartners/碳佐麻里 餐飲系列＿logo.png',
  },
  {
    name: 'Yoshi Taipei',
    tier: 'cleanup',
    // Folder is named "TaiwanExchange" but the artwork reads "Yoshi Taipei".
    logoPath: '/partners/cleanupPartners/TaiwanExchange/LogoNoBackground.png',
  },
  {
    name: '朝陽科大',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/朝陽科大 logo.PNG',
  },
  {
    name: 'Frui Seed Club',
    tier: 'cleanup',
    logoPath: '/partners/cleanupPartners/Frui Seed Club Logo.PNG',
  },

  // ── Lombok partners (Indonesia site-side collaborators) ───────────────────
  {
    name: 'Selong Belanak Community Association (SBCA)',
    tier: 'lombok',
    logoPath: '/partners/lombokPartners/SBCA LOGO_DRAFT_V4.PNG',
  },
  {
    name: 'Eco Desa',
    tier: 'lombok',
    logoPath: '/partners/lombokPartners/671229981_18112315591718772_2029505731610451272_n.jpg',
  },
  {
    name: 'Honest Made',
    tier: 'lombok',
    // File is named .jpeg but is actually a PNG with a real alpha channel.
    logoPath: '/partners/lombokPartners/Logo_White_woBG.jpeg',
    invert: true,
  },
];

export const PARTNER_TIER_ORDER: PartnerTier[] = ['founding', 'cleanup', 'lombok'];

export function partnersByTier(tier: PartnerTier): PartnerLogo[] {
  return PARTNER_LOGOS.filter((p) => p.tier === tier);
}
