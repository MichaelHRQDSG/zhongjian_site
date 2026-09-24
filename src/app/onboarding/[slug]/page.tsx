import { redirect } from "next/navigation";

export default async function EnterpriseOnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/onboarding`);
}
