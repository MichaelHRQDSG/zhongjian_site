import type { Metadata, Viewport } from 'next';
import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '心安 EAP · 员工心理关爱平台',
  description:
    '专业心理测评量表与一对一咨询服务，全程保密。关爱员工身心健康，提供 EAP 心理支持。',
  applicationName: '心安 EAP',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F2E5F',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSans.variable} ${notoSerif.variable} antialiased`}>{children}</body>
    </html>
  );
}
