'use client';

// /templates/travel-host — Travel Creator & Tour Organiser template.
// Gallery:   /templates/travel-host        → sample data (no login, no backend needed)
// Live site: [username]/page.js passes payload + slug → founder's real data and live seats

import { useState } from 'react';
import { TravelHostSite, TravelHostDemo } from '@/components/travel/TravelHostSite';
import { fromWizardPayload } from '@/lib/travel-schema';
import { createRemoteTravelApi } from '@/lib/travel-api';

export default function TravelHostTemplatePage({ payload, slug }) {
  const [api] = useState(() => createRemoteTravelApi());
  if (!payload) return <TravelHostDemo />;
  return <TravelHostSite data={fromWizardPayload(payload)} siteSlug={slug} api={api} />;
}