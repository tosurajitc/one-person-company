'use client'

import CivilArchSite from '@/components/civil-arch/CivilArchSite'
import { SAMPLE_PAYLOAD } from '@/lib/civil-arch-schema'

// Gallery preview: sample data, demo mode (never calls the backend).
export default function CivilArchitectConsultantPreview() {
  return <CivilArchSite payload={SAMPLE_PAYLOAD} demo />
}
