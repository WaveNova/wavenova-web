'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Nav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: 'en' | 'zh') {
    if (next === locale) return;
    if (next === 'en') {
      // strip /zh prefix
      router.push(pathname.replace(/^\/zh/, '') || '/');
    } else {
      router.push('/zh' + (pathname === '/' ? '' : pathname));
    }
  }

  const links = [
    { href: '#playbook', label: t('method') },
    { href: '#stations', label: t('villages') },
    { href: '#taiwan',   label: t('cleanups') },
    { href: '#stations', label: t('impact') },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      flexWrap: 'wrap' as const,
      padding: 'clamp(14px,2vw,18px) clamp(16px,4vw,40px)',
      background: 'rgba(10,22,40,.72)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(126,151,172,.22)',
    }}>
      <Link href={locale === 'en' ? '/' : '/zh'} aria-label="WaveNova" style={{ display: 'flex', alignItems: 'center' }}>
        <Image
          src="/logo-horizontal-white.png"
          alt="WaveNova"
          width={116}
          height={30}
          priority
          style={{ height: 30, width: 'auto' }}
        />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.4vw,30px)', flexWrap: 'wrap' as const }}>
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            style={{ fontSize: 14, fontWeight: 500, color: '#7E97AC', textDecoration: 'none' }}
          >
            {l.label}
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div role="group" aria-label="Language" style={{
          display: 'flex',
          border: '1px solid rgba(126,151,172,.22)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => switchLocale('zh')}
            aria-pressed={locale === 'zh'}
            style={{
              padding: '6px 10px',
              border: 0,
              background: locale === 'zh' ? 'var(--teal-500)' : 'transparent',
              color: locale === 'zh' ? 'var(--navy-800)' : '#7E97AC',
              fontFamily: "'Noto Sans TC', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            繁
          </button>
          <button
            type="button"
            onClick={() => switchLocale('en')}
            aria-pressed={locale === 'en'}
            style={{
              padding: '6px 10px',
              border: 0,
              borderLeft: '1px solid rgba(126,151,172,.22)',
              background: locale === 'en' ? 'var(--teal-500)' : 'transparent',
              color: locale === 'en' ? 'var(--navy-800)' : '#7E97AC',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
              letterSpacing: '0.06em',
              cursor: 'pointer',
            }}
          >
            EN
          </button>
        </div>

        <a href="#support" style={{
          padding: '9px 18px',
          borderRadius: 2,
          background: 'var(--teal-500)',
          color: 'var(--navy-800)',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}>
          {t('support')}
        </a>
      </div>
    </nav>
  );
}
