'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

type Props = {
  open: boolean;
  onClose: () => void;
  bankInfo: { bank: string; account: string; holder: string; swift: string };
};

type Field = { label: string; value: string };

function CopyRow({ label, value, copyLabel, copiedLabel }: Field & { copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      padding: '14px 0',
      borderBottom: '1px solid rgba(126,151,172,.22)',
    }}>
      <div>
        <p style={{
          margin: 0,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 10.5,
          letterSpacing: '0.07em',
          textTransform: 'uppercase' as const,
          color: 'var(--on-dark-muted)',
        }}>
          {label}
        </p>
        <p style={{
          margin: '4px 0 0',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 15,
          letterSpacing: '0.03em',
          color: '#F5F7F8',
        }}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        style={{
          flexShrink: 0,
          padding: '6px 12px',
          borderRadius: 2,
          border: '1px solid rgba(126,151,172,.35)',
          background: copied ? 'var(--teal-500)' : 'transparent',
          color: copied ? 'var(--navy-800)' : 'var(--on-dark-muted)',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 11,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          transition: 'background 150ms ease, color 150ms ease',
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

export default function DonatePanel({ open, onClose, bankInfo }: Props) {
  const t = useTranslations('donate');
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync open/close with <dialog>
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      onClose();
    }
  }

  const fields: Field[] = [
    { label: t('bank'),    value: bankInfo.bank },
    { label: t('account'), value: bankInfo.account },
    { label: t('holder'),  value: bankInfo.holder },
    { label: t('swift'),   value: bankInfo.swift },
  ];

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onClose={onClose}
      style={{
        border: 'none',
        borderRadius: 4,
        padding: 0,
        maxWidth: 480,
        width: '90vw',
        background: 'var(--navy-700)',
        color: '#F5F7F8',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ padding: 'clamp(24px,4vw,36px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{
            margin: 0,
            fontFamily: "'DM Serif Display', 'Noto Serif TC', serif",
            fontWeight: 400,
            fontSize: 22,
            color: '#F5F7F8',
          }}>
            {t('heading')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            style={{
              padding: '4px 8px',
              border: 0,
              background: 'transparent',
              color: 'var(--on-dark-muted)',
              fontSize: 20,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 8 }}>
          {fields.map((f) => (
            <CopyRow
              key={f.label}
              label={f.label}
              value={f.value}
              copyLabel={t('copy')}
              copiedLabel={t('copied')}
            />
          ))}
        </div>

        <p style={{
          margin: '20px 0 0',
          fontFamily: 'var(--font-instrument-sans), var(--font-dm-sans), sans-serif',
          fontSize: 13,
          lineHeight: 1.7,
          color: 'var(--on-dark-muted)',
        }}>
          {t('note')}
        </p>
      </div>

      {/* Dialog backdrop styles */}
      <style>{`
        dialog::backdrop {
          background: rgba(5,13,24,.72);
          backdrop-filter: blur(4px);
        }
      `}</style>
    </dialog>
  );
}
