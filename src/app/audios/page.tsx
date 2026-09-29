import type { Metadata } from 'next';
import { AudiosIndexPage } from '@/components/audios/AudiosIndexPage';
import { AUDIOS } from '@/lib/audios';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `心理音画 · ${branding.siteName}`,
    description: '完整心理音画内容：呼吸、冥想与情绪释放练习，支持职场减压与自我调节。',
  };
}

export default async function AudiosPage() {
  const branding = await fetchDefaultBranding();
  return <AudiosIndexPage audios={AUDIOS} siteName={branding.siteName} homeHref="/" />;
}
