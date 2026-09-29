'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import type { AudioTrack } from '@/lib/audios';
import { tokens } from '@/lib/tokens';

export function AudiosIndexPage({
  audios,
  homeHref = '/',
  siteName = '心安 EAP',
}: {
  audios: AudioTrack[];
  homeHref?: string;
  siteName?: string;
}) {
  const primary = tokens.primary;
  const primaryDark = tokens.primaryDark;

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7', color: '#1A2846', fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Link href={homeHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: primary, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `${primary}12`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)' }}>
              <Icon name="arrow" size={14} />
            </span>
            返回首页
          </Link>
          <div style={{ fontSize: 14, color: '#4A5A78' }}>{siteName} · 心理音画</div>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: 13, color: primary, letterSpacing: 3, fontWeight: 500, marginBottom: 12 }}>心理知识库</div>
        <h1 style={{ margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 36, color: '#0F2E5F', letterSpacing: 2 }}>心理音画</h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.85, color: '#4A5A78', maxWidth: 640 }}>
          呼吸、冥想与情绪释放练习，帮助你在通勤、午休、睡前或高压时刻，快速找回一点安定。点击即可播放。
        </p>

        <div style={{
          marginTop: 36,
          background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
          borderRadius: 10,
          padding: '28px 24px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
          <FullAudioPlayer audios={audios} primary={primary} />
        </div>
      </main>
    </div>
  );
}

function FullAudioPlayer({ audios, primary }: { audios: AudioTrack[]; primary: string }) {
  const [currentIdx, setCurrentIdx] = React.useState(-1);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (el.duration) setProgress(el.currentTime / el.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnd);
    };
  }, [currentIdx]);

  const safePlay = (el: HTMLAudioElement) => {
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  };

  const togglePlay = (i: number) => {
    const el = audioRef.current;
    if (currentIdx === i && el) {
      if (playing) {
        el.pause();
        setPlaying(false);
      } else {
        safePlay(el);
        setPlaying(true);
      }
    } else {
      if (el) {
        try {
          el.pause();
        } catch {}
      }
      setCurrentIdx(i);
      setProgress(0);
      setPlaying(true);
    }
  };

  React.useEffect(() => {
    const el = audioRef.current;
    if (!el || currentIdx < 0 || !playing) return;
    if (el.readyState >= 2) {
      safePlay(el);
    } else {
      const onCanPlay = () => {
        safePlay(el);
      };
      el.addEventListener('canplay', onCanPlay, { once: true });
      return () => el.removeEventListener('canplay', onCanPlay);
    }
  }, [currentIdx, playing]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
      {currentIdx >= 0 && (
        <audio ref={audioRef} src={audios[currentIdx].src} preload="auto" />
      )}
      {audios.map((a, i) => {
        const active = currentIdx === i;
        const isPlaying = active && playing;
        return (
          <div
            key={a.id}
            onClick={() => togglePlay(i)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '16px 14px',
              borderRadius: 8,
              background: active ? 'rgba(255,255,255,.10)' : 'transparent',
              borderBottom: !active && i < audios.length - 1 ? '1px solid rgba(255,255,255,.1)' : 'none',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <button
              type="button"
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: isPlaying ? '#fff' : 'rgba(255,255,255,.15)',
                color: isPlaying ? primary : '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                marginTop: 2,
              }}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={primary}>
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <Icon name="play" size={12} color="#fff" />
              )}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 500, fontFamily: '"Noto Serif SC", serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                {a.title}
                {isPlaying && <PlayingBars />}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                {a.series} · {a.dur} · {a.plays} 播放
              </div>
              {a.desc && (
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, lineHeight: 1.6 }}>{a.desc}</div>
              )}
            </div>
            {active && (
              <div style={{ position: 'absolute', bottom: 0, left: 14, right: 14, height: 2, background: 'rgba(255,255,255,.15)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${progress * 100}%`, height: '100%', background: '#fff', transition: 'width .2s' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlayingBars() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 2,
            height: 10,
            background: '#fff',
            borderRadius: 1,
            animation: `audiobar 1s ease-in-out ${i * 0.15}s infinite`,
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}
