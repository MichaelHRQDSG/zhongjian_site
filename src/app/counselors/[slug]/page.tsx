import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CounselorDetailPage } from '@/components/counselors/CounselorDetailPage';
import { getCounselorBySlug, getMockCounselorProfiles } from '@/lib/counselor-profiles';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return getMockCounselorProfiles().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const counselor = await getCounselorBySlug(slug);
  if (!counselor) return {};
  return {
    title: `${counselor.name} · 咨询师介绍`,
    description: counselor.approach,
  };
}

export default async function CounselorSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [counselor, branding] = await Promise.all([
    getCounselorBySlug(slug),
    fetchDefaultBranding(),
  ]);
  if (!counselor) notFound();

  return (
    <CounselorDetailPage
      counselor={counselor}
      siteName={branding.siteName}
      homeHref="/"
      listHref="/counselors"
      contactHref="/contact"
    />
  );
}
