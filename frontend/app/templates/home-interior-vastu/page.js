'use client';

// frontend/app/templates/home-interior-vastu/page.js
// Demo page. /templates/home-interior-vastu shows the interior designer sample;
// add ?sample=architect for the registered-architect sample (shows the title, hides testimonials).

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import HomeVastuSite from '@/components/home-vastu/HomeVastuSite';
import { SAMPLE_PAYLOAD_DESIGNER, SAMPLE_PAYLOAD_ARCHITECT } from '@/lib/home-vastu-schema';

function Demo() {
  const sample = useSearchParams().get('sample');
  const payload = sample === 'architect' ? SAMPLE_PAYLOAD_ARCHITECT : SAMPLE_PAYLOAD_DESIGNER;
  return <HomeVastuSite payload={payload} demo />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Demo />
    </Suspense>
  );
}
