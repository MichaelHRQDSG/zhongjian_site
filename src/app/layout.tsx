import type { Metadata, Viewport } from 'next';
import './globals.css';

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
