'use client';

import OnboardingAssessment from '@/components/onboarding/OnboardingAssessment';
import { tokens } from '@/lib/tokens';

export default function OnboardingPage() {
  return (
    <OnboardingAssessment
      tweaks={{
        primary: tokens.primary,
        primaryDark: tokens.primaryDark,
        accent: tokens.accent,
        warm: tokens.warm,
      }}
    />
  );
}
