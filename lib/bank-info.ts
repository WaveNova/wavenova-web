// Shared bank account details for WaveNova Yayasan.
// Both app/api/donations/route.ts and the public donate panel read from here.
// If the account changes, update in one place only.
export const BANK_INFO = {
  bank:    process.env.WAVENOVA_BANK_NAME    ?? 'OCBC',
  account: process.env.WAVENOVA_BANK_ACCOUNT ?? '160800030803',
  holder:  process.env.WAVENOVA_BANK_HOLDER  ?? 'Yayasan Wave Nova Ocean',
  swift:   process.env.WAVENOVA_BANK_SWIFT   ?? 'NISPIDJA',
} as const;
