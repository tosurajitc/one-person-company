'use client'

/**
 * setup-wizard-legacy — placeholder kept for Phase 1 compatibility.
 *
 * The original pre-Phase-1 wizard was replaced in-place at /setup-wizard
 * before a separate legacy copy could be made. This page exists so the
 * /setup-wizard-legacy route does not 404, and redirects visitors
 * immediately to the current wizard at /setup-wizard.
 *
 * Remove this file at the start of Phase 3 (as specified in the build plan).
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupWizardLegacyPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/setup-wizard')
  }, [router])
  return null
}
