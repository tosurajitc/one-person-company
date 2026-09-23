'use client'

import { useMemo } from 'react'
import TutorSite from '@/components/tutor/TutorSite'
import { createLocalTutorApi } from '@/lib/tutor-api'

// Self-contained preview for the /templates gallery — sample data only,
// mirrors the shape a real founder's site_build_payload + tutor API would return.
const SAMPLE_PAYLOAD = {
  business: {
    brandName: 'Meera Teaches Piano',
    tagline: 'Learn piano the way you actually want to play it — live, one on one, on Google Meet.',
    owner: { name: 'Meera Krishnan', photoUrl: '/templates/tutor-training-teacher-photo.png' },
  },
  positioning: {
    sentence: 'I help adult beginners and returning players build real piano skills through short, focused weekly classes — no grade exams required unless you want them.',
    credibility: 'Trained at the Trinity College of Music, London, and teaching independently since 2016. I specialise in adult learners who tried piano as a kid and want to actually finish this time — plus a few young students prepping for Trinity and ABRSM grades.',
  },
  proof: {
    testimonials: [
      { name: 'Ananya R.', role: 'Adult beginner, 8 months in', quote: 'I tried three apps before this. Having a real person notice my hand position changed everything in the first class.' },
      { name: 'Rahul & Priya (parents)', role: 'Parents of a Grade 3 student', quote: 'Our son actually asks to practice now. Meera makes the theory make sense.' },
      { name: 'Vikram S.', role: 'Returning after 15 years', quote: 'Flexible scheduling around my work trips is the real reason I stuck with it this time.' },
    ],
  },
  knowledge: {
    faqs: [
      { question: 'Do I need my own piano or keyboard?', answer: 'A full-size 61-key keyboard with weighted or semi-weighted keys is enough to start. I\'ll tell you exactly what to look for in your first class.' },
      { question: 'What if I have zero musical background?', answer: 'That\'s most of my adult students. We start from how to sit, how to read one note at a time, and build from there — no assumptions.' },
      { question: 'Can I reschedule a class?', answer: 'Yes, up to 12 hours before your slot, directly from the confirmation email. Trial classes can be moved once.' },
      { question: 'Do you prepare students for exams?', answer: 'For students who want it, yes — Trinity and ABRSM. It\'s entirely optional for adult learners.' },
    ],
  },
  frontDoor: { invitation: 'Not sure where to start? Tell me what you want to be able to play, and I\'ll suggest a class.' },
  brand: { primaryColor: '#24352B' },
  template_data: {
    teaching_since_year: '2016',
    primary_subjects: ['Piano — Adults', 'Piano — Kids (Grade prep)', 'Music Theory'],
    age_groups: ['teens', 'adults'],
    teaching_formats: ['one_on_one'],
    students_taught: '210',
    rating: '4.9',
    total_reviews: '86',
    certifications: ['Trinity College of Music, London (ATCL)', 'ABRSM Grade 8 Distinction', '8 years teaching experience'],
    languages_taught: 'English, Hindi',
  },
}

const SAMPLE_SUBJECTS = [
  {
    id: 'subj_1', serverId: 1, slug: 'piano-adults', title: 'Piano for Adult Beginners',
    category: 'music', format: 'one_on_one', level: 'beginner', ageGroups: ['adults'],
    durationMinutes: 45, price: 1200, trialAvailable: true, trialPrice: null,
    packageClasses: 4, packagePrice: 4200,
    summary: 'Start from zero — posture, reading music, your first full song by class four.',
    syllabus: ['Hand position & posture', 'Reading treble & bass clef', 'Your first song', 'Simple chords'],
    status: 'published', sortOrder: 0,
  },
  {
    id: 'subj_2', serverId: 2, slug: 'piano-grade-prep', title: 'Piano Grade Exam Prep (Trinity/ABRSM)',
    category: 'music', format: 'one_on_one', level: 'intermediate', ageGroups: ['kids', 'teens'],
    durationMinutes: 60, price: 1500, trialAvailable: true, trialPrice: 500,
    packageClasses: null, packagePrice: null,
    summary: 'Structured weekly lessons building toward your next Trinity or ABRSM grade.',
    syllabus: ['Scales & technical work', 'Set pieces', 'Sight reading', 'Aural training'],
    status: 'published', sortOrder: 1,
  },
  {
    id: 'subj_3', serverId: 3, slug: 'music-theory', title: 'Music Theory Fundamentals',
    category: 'music', format: 'small_group', level: 'all_levels', ageGroups: ['teens', 'adults'],
    durationMinutes: 45, price: 800, trialAvailable: false, trialPrice: null,
    packageClasses: 6, packagePrice: 4200,
    summary: 'Notation, key signatures, chords and rhythm — the theory behind what you play.',
    syllabus: ['Notation basics', 'Key signatures', 'Chord building', 'Rhythm & time signatures'],
    status: 'published', sortOrder: 2,
  },
]

const SAMPLE_VIDEOS = [
  { id: 'v1', subjectId: 'subj_1', title: 'A first lesson, start to finish', youtubeVideoId: 'jNQXAC9IVRw', description: 'Watch a real trial class with a brand-new adult student.' },
  { id: 'v2', subjectId: 'subj_2', title: 'Grade 3 recital run-through', youtubeVideoId: 'jNQXAC9IVRw', description: 'One of my students preparing her Trinity Grade 3 piece.' },
  { id: 'v3', subjectId: 'subj_3', title: 'Reading key signatures in 5 minutes', youtubeVideoId: 'jNQXAC9IVRw', description: 'A short theory concept explained the way I teach it live.' },
]

const SAMPLE_AVAILABILITY = [
  { weekday: 0, startTime: '17:00', endTime: '20:00', isActive: true },
  { weekday: 1, startTime: '17:00', endTime: '20:00', isActive: true },
  { weekday: 2, startTime: '10:00', endTime: '13:00', isActive: true },
  { weekday: 3, startTime: '17:00', endTime: '20:00', isActive: true },
  { weekday: 4, startTime: '17:00', endTime: '20:00', isActive: true },
  { weekday: 5, startTime: '10:00', endTime: '14:00', isActive: true },
]

const SAMPLE_SETTINGS = {
  meetPlatform: 'google_meet',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  bookingEnabled: true,
  holdMinutes: 20,
  bufferMinutes: 15,
  advanceBookingDays: 21,
  minNoticeHours: 4,
  responseTimePromise: 'Within a few hours',
  cancellationPolicy: 'Free to reschedule up to 12 hours before class.',
}

export default function TutorTrainingPreviewPage() {
  const api = useMemo(() => createLocalTutorApi({
    subjects: SAMPLE_SUBJECTS,
    videos: SAMPLE_VIDEOS,
    availability: SAMPLE_AVAILABILITY,
    settings: SAMPLE_SETTINGS,
  }), [])

  return <TutorSite siteSlug="meera-piano-sample" payload={SAMPLE_PAYLOAD} api={api} />
}
