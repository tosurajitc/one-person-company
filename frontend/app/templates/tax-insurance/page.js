'use client';

// frontend/app/templates/tax-insurance/page.js
// Demo page. /templates/tax-insurance shows the CA sample; add ?sample=insurance for the insurance sample.

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import TaxInsuranceSite from '@/components/tax-insurance/TaxInsuranceSite';
import { SAMPLE_PAYLOAD_TAX, SAMPLE_PAYLOAD_INSURANCE } from '@/lib/tax-insurance-schema';

function Demo() {
  const sample = useSearchParams().get('sample');
  const payload = sample === 'insurance' ? SAMPLE_PAYLOAD_INSURANCE : SAMPLE_PAYLOAD_TAX;
  return <TaxInsuranceSite payload={payload} demo />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Demo />
    </Suspense>
  );
}
