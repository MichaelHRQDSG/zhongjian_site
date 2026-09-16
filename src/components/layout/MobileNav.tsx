'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon, NAV_ITEMS } from '@/components/shared/data';
import { tokens } from '@/lib/tokens';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const primary = tokens.primary;
  const accent = tokens.accent;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? '关闭菜单' : '打开菜单'}
        className="gxa-mobile-menu-btn"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'none',
          background: 'transparent',
          border: '1px solid #D0D6E0',
          borderRadius: 4,
          width: 42,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0F2E5F',
          cursor: 'pointer',
        }}
      >
        <Icon name={open ? 'check' : 'menu'} size={18} />
      </button>

      {open && (
        <div
          className="gxa-mobile-drawer"
          style={{
            position: 'fixed',
            inset: 0,
            top: 0,
            zIndex: 80,
            background: 'rgba(10,30,66,.45)',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 'min(320px, 88vw)',
              height: '100%',
              background: '#fff',
              padding: '28px 24px',
              boxShadow: '-12px 0 40px rgba(15,46,95,.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 18, fontWeight: 700, color: primary, letterSpacing: 2 }}>
                广厦心安
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ border: 'none', background: '#F0F2F6', width: 36, height: 36, borderRadius: 4, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 12px',
                  textDecoration: 'none',
                  color: '#1A2846',
                  fontSize: 16,
                  fontWeight: 500,
                  borderRadius: 6,
                  background: '#FBFAF7',
                }}
              >
                {item.label}
                {item.badge && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 1,
                      background: accent,
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: 2,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            <a
              href="tel:4008806666"
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 12px',
                background: `${primary}0C`,
                color: primary,
                textDecoration: 'none',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              <Icon name="phone" size={16} />
              24h 热线 400-880-6666
            </a>
          </div>
        </div>
      )}
    </>
  );
}
