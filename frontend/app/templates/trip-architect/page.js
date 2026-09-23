'use client';

// /templates/trip-architect — Travel Planner & Trip Architect template.
// Gallery:   /templates/trip-architect  → sample data (no login, no backend needed)
// Live site: [username]/page.js passes payload + slug → founder's real data

import TripArchitectTemplate from '@/components/travel/TripArchitectSite';

export default function TripArchitectTemplatePage({ payload }) {
  return <TripArchitectTemplate data={payload || null} />;
}
