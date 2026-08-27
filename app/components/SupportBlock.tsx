'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import DonatePanel from './DonatePanel';

type BankInfo = { bank: string; account: string; holder: string; swift: string };

type Props = { bankInfo: BankInfo };

export default function SupportBlock({ bankInfo }: Props) {
  const t = useTranslations('support');
  const [donateOpen, setDonateOpen] = useState(false);

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
          {/* ESG card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--teal-500)',
            borderRadius: 2,
            padding: 26,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
                fontWeight: 400,
                fontSize: 19,
                color: '#F5F7F8',
              }}>
                {t('esgTitle')}
              </span>
              <span style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 10.5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--teal-500)',
                whiteSpace: 'nowrap' as const,
              }}>
                {t('esgBadge')}
              </span>
            </div>
            <p style={{ margin: '16px 0 28px', fontSize: 15, lineHeight: 1.7, color: '#7E97AC' }}>
              {t('esgBody')}
            </p>
            <a
              href="mailto:hi@wavenova.org?subject=Corporate%20ESG%20Partnership"
              style={{
                marginTop: 'auto',
                alignSelf: 'flex-start',
                padding: '11px 20px',
                borderRadius: 2,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                background: 'var(--teal-500)',
                color: 'var(--navy-800)',
                border: 'none',
              }}
            >
              {t('esgCta')}
            </a>
          </div>

          {/* Donate card — opens DonatePanel */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--teal-500)',
            borderRadius: 2,
            padding: 26,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
                fontWeight: 400,
                fontSize: 19,
                color: '#F5F7F8',
              }}>
                {t('donateTitle')}
              </span>
              <span style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 10.5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--teal-500)',
                whiteSpace: 'nowrap' as const,
              }}>
                {t('donateBadge')}
              </span>
            </div>
            <p style={{ margin: '16px 0 28px', fontSize: 15, lineHeight: 1.7, color: '#7E97AC' }}>
              {t('donateBody')}
            </p>
            <button
              type="button"
              onClick={() => setDonateOpen(true)}
              style={{
                marginTop: 'auto',
                alignSelf: 'flex-start',
                padding: '11px 20px',
                borderRadius: 2,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--teal-500)',
                border: '1px solid var(--teal-500)',
              }}
            >
              {t('donateCta')}
            </button>
          </div>

          {/* Subscription / Zeczec card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--teal-500)',
            borderRadius: 2,
            padding: 26,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
                fontWeight: 400,
                fontSize: 19,
                color: '#F5F7F8',
              }}>
                {t('memberTitle')}
              </span>
              <span style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 10.5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--teal-500)',
                whiteSpace: 'nowrap' as const,
              }}>
                {t('memberBadge')}
              </span>
            </div>
            <p style={{ margin: '16px 0 28px', fontSize: 15, lineHeight: 1.7, color: '#7E97AC' }}>
              {t('memberBody')}
            </p>
            <a
              href="https://www.zeczec.com/projects/wavenova"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 'auto',
                alignSelf: 'flex-start',
                padding: '11px 20px',
                borderRadius: 2,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                background: 'transparent',
                color: 'var(--teal-500)',
                border: '1px solid var(--teal-500)',
              }}
            >
              {t('memberCta')}
            </a>
          </div>
        </div>
      </div>

      {/* Donate panel modal — rendered outside grid for clean stacking */}
      <DonatePanel
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        bankInfo={bankInfo}
      />
    </section>
  );
}
