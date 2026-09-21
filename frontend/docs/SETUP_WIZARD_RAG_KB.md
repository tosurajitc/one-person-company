# ONE-PERSON COMPANY (OPC) PLATFORM — MASTER KNOWLEDGE BASE & RAG REFERENCE MANUAL
**Document Purpose:** Ground-truth retrieval augmented generation (RAG) knowledge document for AI assistants (Genie) and platform users to configure, customize, and maintain high-converting websites across all 11 business templates using the `/setup-wizard` administration engine.

---

## TABLE OF CONTENTS
1. [Core Architecture & Data Flow Overview](#1-core-architecture--data-flow-overview)
2. [Standard Setup Wizard Schema Definition (Steps 1–11)](#2-standard-setup-wizard-schema-definition-steps-111)
3. [Template-Wise Comprehensive Configuration Guides](#3-template-wise-comprehensive-configuration-guides)
   - 3.1 [Consultant & Advisor (`/consultant-advisor`)](#31-consultant--advisor)
   - 3.2 [Agency of One (`/agency-of-one`)](#32-agency-of-one)
   - 3.3 [Freelancer & Creative Designer (`/freelancer-creative`)](#33-freelancer--creative-designer)
   - 3.4 [Coach & Transformation Mentor (`/coach-mentor`)](#34-coach--transformation-mentor)
   - 3.5 [Course Creator & Educator (`/course-creator`)](#35-course-creator--educator)
   - 3.6 [Digital Product Seller (`/digital-product-seller`)](#36-digital-product-seller)
   - 3.7 [Clinic & Health Practitioner (`/clinic-practitioner`)](#37-clinic--health-practitioner)
   - 3.8 [Author & Keynote Speaker (`/author-speaker`)](#38-author--keynote-speaker)
   - 3.9 [Local Service Professional (`/local-service-pro`)](#39-local-service-professional)
   - 3.10 [Tutor & Training Institute (`/tutor-training`)](#310-tutor--training-institute)
   - 3.11 [Physical Artisan, Maker & Photographer (`/physical-artisan`)](#311-physical-artisan-maker--photographer)
4. [Universal Field Mapping & Cross-Reference Table](#4-universal-field-mapping--cross-reference-table)
5. [Genie AI System Prompt & Intent Resolution Rules](#5-genie-ai-system-prompt--intent-resolution-rules)
6. [Troubleshooting & Quality Assurance Matrix](#6-troubleshooting--quality-assurance-matrix)

---

## 1. CORE ARCHITECTURE & DATA FLOW OVERVIEW

The One-Person Company (OPC) site generation engine uses a unified payload structure that renders cleanly across all 11 business niches.

```
┌─────────────────────────────────────────────────────────────┐
│                 /setup-wizard Administration                │
│    (11 Steps: Identity, Offers, Proof, Knowledge, etc.)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON Payload
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  payloadToData() Adapter                    │
│    - Normalizes user values                                 │
│    - Applies smart fallbacks & sensible defaults            │
│    - Resolves localized currencies (INR ₹ / USD $)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Structured Props
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Niche Template Renderer                     │
│    (Consultant, Agency, Coach, Clinic, Artisan, etc.)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. STANDARD SETUP WIZARD SCHEMA DEFINITION (STEPS 1–11)

Every setting configured in `/setup-wizard` maps to a distinct key within the platform database:

### Step 1: Start (`start`)
- `businessType`: Business model classification (`consulting`, `agency`, `coaching`, `clinic`, `courses`, `digital_products`, `local_service`, `author`, `tutoring`, `artisan`).
- `market`: Target geography (`india`, `global`, `us`, `uk`, `sea`).
- `language`: Primary language (`en`, `hi`, `ta`, `te`, `kn`, `bn`).

### Step 2: Brand & Identity (`identity`)
- `brandName`: The public trading name or practice name.
- `tagline`: One-sentence core value proposition.
- `city` & `country`: Primary location or headquarters.
- `logoUrl`: Direct image URL to PNG/SVG brand logo.
- `timezone`: Operational timezone (`Asia/Kolkata`, `America/New_York`, etc.).
- `ownerName`: Full name of founder / lead specialist.
- `ownerRole`: Professional title (e.g., *Lead Strategy Consultant*, *MBBS, MD*).
- `email`: Primary business email for inquiries and lead dispatch.
- `whatsapp`: 10-digit mobile number for 1-click WhatsApp messaging.
- `photoUrl`: High-resolution headshot or studio founder portrait.

### Step 3: Positioning & Audience (`positioning`)
- `buyer`: Target client persona (e.g., *D2C founders scaling past ₹5 Cr*).
- `problem`: Primary operational or commercial bottleneck you solve.
- `outcome`: Tangible transformation or financial result delivered.
- `timeframe`: Typical duration to see measurable results (e.g., *90 days*).
- `fear`: Main hesitation or negative alternative avoided (e.g., *without hiring an agency*).
- `alreadyTried`: Alternatives the buyer has likely failed with.
- `credibility`: Proof statement, background narrative, or prestigious past roles.
- `forWho`: Array of 3 distinct positive customer profile bullets.
- `notFor`: Array of 2–3 disqualification bullets (who should NOT hire you).

### Step 4: Offers & Pricing (`offers`)
- `tiers`: 3-tier engagement ladder:
  - `front_door`: Low-friction discovery / audit / diagnostic call.
  - `core`: Flagship transformation project or multi-week engagement.
  - `recurring`: Monthly retainer, subscription, or fractional leadership.
  - Subfields for each tier: `name`, `summary`, `deliverables` (bullet list), `duration`, `priceInr`, `priceUsd`.
- `product`: Single digital asset, download, or toolkit:
  - `enabled` (boolean), `name`, `summary`, `link`, `priceInr`, `priceUsd`.
- `mostBought`: Which tier to highlight with the "Most Popular" / "Recommended" badge (`front_door`, `core`, or `recurring`).
- `paymentTerms`: Standard milestone terms (`100_upfront`, `50_50`, `milestones`).
- `revisionRounds`: Included review cycles (`1`, `2`, `3`, `unlimited`).
- `priceDisplay`: Public pricing visibility (`show`, `hide`, `starting_at`).

### Step 5: Proof & Credibility (`proof`)
- `yearsExperience`: Total number of years operating in the domain.
- `clientsServed`: Total volume of clients, founders, or students assisted.
- `credentials`: Array of string certificates, alma maters, or licenses.
- `results`: Array of key metric objects `{ number: "3.8x", label: "Avg ROAS" }`.
- `caseStudies`: Array of objects `{ client: "", result: "", whatYouDid: "" }`.
- `testimonials`: Array of objects `{ name: "", role: "", quote: "" }`.

### Step 6: Front Door & Lead Capture (`frontDoor`)
- `primaryCta`: Main action (`book_call`, `whatsapp`, `custom_form`, `download`).
- `bookingUrl`: Calendly, Cal.com, or SavvyCal direct schedule link.
- `ctaLabel`: Custom text on primary button (e.g., *Schedule Strategy Session*).
- `responseTime`: SLA notice (e.g., *Replies in under 2 hours*).
- `channels`: Enabled communication channels `{ form: true, whatsapp: true, email: true, booking: true }`.

### Step 7: Knowledge & Delivery (`knowledge`)
- `process`: 3 to 4 sequential onboarding and execution steps `{ title: "", detail: "" }`.
- `included`: Global deliverables always included across engagements.
- `notIncluded`: Out-of-scope boundaries to prevent client scope creep.
- `refundPolicy`: Clear policy statement or money-back guarantee terms.
- `toolsUsed`: List of software, diagnostic kits, camera gear, or testing suites used.
- `faqs`: Array of objects `{ question: "", answer: "" }`.
- `introVideo`: Embeddable YouTube video URL (`url`, `title`).

### Step 8: Brand Style & Color (`brand`)
- `style`: Aesthetic theme preset (`minimal`, `editorial`, `bold`, `dark`).
- `primaryColor`: Hex color code (e.g., `#2563eb`, `#b3261e`, `#06b6d4`).
- `avoidWords`: Terms prohibited from AI generation.

### Step 9: Payments & Legal (`payments`)
- `gateways`: Array of active gateways (`razorpay`, `stripe`, `upi`).
- `legalName`: Registered company or sole-proprietor entity name.
- `gstRegistered`: `yes` or `no`.
- `gstin`: 15-character GST registration number.
- `invoicePrefix`: Prefix for invoice generation (e.g., `INV-2025-`).

### Step 10: Channels & Socials (`channels`)
- `social`: URLs for LinkedIn, Instagram, X (Twitter), YouTube, Facebook, Google Business.
- `mainPlatform`: Primary social organic channel.
- `cadence`: Publishing frequency (`daily`, `weekly`, `biweekly`).
- `contentTopics`: Array of 3 authority subject areas.

### Step 11: Site & Hosting (`site`)
- `subdomain`: Live platform subdomain (e.g., `acme.onepersoncompany.com`).
- `customDomain`: Connected apex domain (e.g., `www.acmeadvisory.com`).
- `notifyEmail`: Notification address for new leads.
- `analyticsId`: Google Analytics 4 (G-XXXX) or Meta Pixel ID.

---

## 3. TEMPLATE-WISE COMPREHENSIVE CONFIGURATION GUIDES

### 3.1 CONSULTANT & ADVISOR
**Route:** `/templates/consultant-advisor` | **Theme:** Editorial Paper (`#f7f4ec`), Signal Red (`#b3261e`), Dark Ink (`#14171d`)

#### How it Renders
1. **Hero Header:** Displays `ownerName`, `ownerRole`, and a dynamic authority growth memo statement combining `buyer`, `outcome`, and `fear`.
2. **Growth Trajectory Chart:** Renders client revenue expansion visuals next to `yearsExperience` and `clientsServed`.
3. **§1 Who This Is For:** Renders `positioning.forWho` as a top-border criteria list.
4. **§2 Engagement Roadmap:** Renders `knowledge.process` sequentially with paragraph annotations (§2.1, §2.2).
5. **§3 Engagement Ledger:** Renders `offers.tiers` with transparent pricing, deliverables, and highlight tags.
6. **Scope Boundaries:** Renders `knowledge.included` and `knowledge.notIncluded` side-by-side to set client expectations.
7. **§4 Exhibits & Testimonials:** Displays `proof.caseStudies` and `proof.testimonials` in clean editorial blocks.

#### Setup Wizard Field Mapping
- **Hero Title & Headline:** Step 2 (`ownerName`, `ownerRole`) & Step 3 (`buyer`, `outcome`).
- **Strategy Packages:** Step 4 (`tiers.front_door` -> Clarity Call, `tiers.core` -> Strategy Sprint, `tiers.recurring` -> Advisory Retainer).
- **Scope Limits:** Step 7 (`knowledge.included` & `knowledge.notIncluded`).
- **Calendar Link:** Step 6 (`frontDoor.bookingUrl`).

---

### 3.2 AGENCY OF ONE
**Route:** `/templates/agency-of-one` | **Theme:** Slate Navy (`#1e293b`), Electric Cyan (`#06b6d4`), Ice BG (`#f8fafc`)

#### How it Renders
1. **Full-Stack Agency Hero:** Highlights founder's track record with ad spend managed and ROAS metrics.
2. **Video Teaser:** Embeds YouTube founder introduction from `knowledge.introVideo.url`.
3. **Deliverables Grid:** Showcases 6 modular services (CRO, Paid Media, Retention, Strategy).
4. **Fit Criteria Section:** Renders `positioning.forWho` (Who it is built for) alongside `positioning.notFor` (Who it is NOT for) in high-contrast cards.
5. **Sprint Packages:** Displays 3 transparent tiers (Audit, 90-Day Sprint, Fractional CMO).
6. **Case Study Metrics:** Highlights hard ROI percentages and CAC reductions.

#### Setup Wizard Field Mapping
- **ROAS & Spend Stats:** Step 5 (`proof.results` -> e.g., "3.8x Avg ROAS", "₹80 Cr Spend Managed").
- **Who Is / Isn't a Fit:** Step 3 (`positioning.forWho` & `positioning.notFor`).
- **Intro Video:** Step 7 (`knowledge.introVideo.url`).
- **Service Offers:** Step 4 (`offers.tiers`).

---

### 3.3 FREELANCER & CREATIVE DESIGNER
**Route:** `/templates/freelancer-creative` | **Theme:** Deep Violet (`#4c1d95`), Electric Lime (`#a3e635`), Obsidian (`#0f051d`)

#### How it Renders
1. **Bold Creative Hero:** Punchy typography focusing on visual identity, UI/UX, and Webflow development.
2. **Portfolio Reel:** Interactive category-tagged project showcase with live demo links.
3. **Skills & Capabilities:** Renders `proof.credentials` as pill badges (Figma, After Effects, Webflow).
4. **Pricing & Packages:** 3 structured creative tiers (Brand Starter, Full Identity, Monthly Design Retainer).
5. **Digital Asset / UI Kit Card:** Renders downloadable digital products (`offers.product`) with instant checkout button.

#### Setup Wizard Field Mapping
- **Portfolio Showcase:** Step 5 (`proof.caseStudies` -> `client`, `result`, `whatYouDid`).
- **Creative Skills:** Step 5 (`proof.credentials` -> e.g. "Brand Identity", "Figma Design Systems").
- **Digital Asset / Kit:** Step 4 (`offers.product.enabled` = true, `name`, `summary`, `priceInr`, `link`).
- **Turnaround Speed:** Step 3 (`positioning.timeframe` -> e.g. "< 2 weeks").

---

### 3.4 COACH & TRANSFORMATION MENTOR
**Route:** `/templates/coach-mentor` | **Theme:** Warm Terracotta (`#c2693e`), Cream (`#fdf6ec`), Sand (`#e0c9ae`)

#### How it Renders
1. **Intimate Founder Story:** Empathetic narrative detailing the coach's background and personal transformation.
2. **State Shift Matrix (Before vs After):** Contrasts feeling stuck, overwhelmed, and doubtful against clarity, boundaries, and confidence.
3. **Coaching Methodology & Tools:** Displays `knowledge.process` and highlights `knowledge.toolsUsed` (e.g. ICF Frameworks, Enneagram, Somatic Grounding).
4. **Mentorship Containers:** Single Breakthrough Session, 3-Month Signature Journey, and VIP Immersion Day.

#### Setup Wizard Field Mapping
- **Coach Credentials:** Step 5 (`proof.credentials` -> e.g. "ICF Certified PCC", "500+ Hours Coached").
- **Transformation Shift:** Step 3 (`positioning.problem` -> Before state, `positioning.outcome` -> After state).
- **Guiding Tools & Frameworks:** Step 7 (`knowledge.toolsUsed` -> e.g. "Positive Psychology, CBT, ICF Core Competencies").
- **Chemistry Call Booking:** Step 6 (`frontDoor.bookingUrl`).

---

### 3.5 COURSE CREATOR & EDUCATOR
**Route:** `/templates/course-creator` | **Theme:** Indigo Navy (`#1e1b4b`), Sunset Amber (`#f59e0b`), Slate White (`#ffffff`)

#### How it Renders
1. **Cohort Announcement Banner:** Live badge showing next batch starting date, enrolled count, and seats remaining.
2. **12-Week Interactive Curriculum:** Week-by-week syllabus modules detailing lesson topics and preview lessons.
3. **Course Directory:** Multi-course catalog showing difficulty level, duration, and enrollment fees.
4. **Career Jump Testimonials:** Student reviews highlighting concrete compensation increases (e.g., *₹5L -> ₹14L CTC*).

#### Setup Wizard Field Mapping
- **Next Batch Details:** Step 4 (`offers.tiers.core.duration` & `offers.tiers.core.summary`).
- **Weekly Curriculum:** Step 7 (`knowledge.process` -> Step title = Week/Module, Step detail = Lessons covered).
- **Student Outcome Hikes:** Step 5 (`proof.testimonials` -> include CTC/salary jumps in quote or role).
- **Enrollment Link:** Step 6 (`frontDoor.bookingUrl` or payment link).

---

### 3.6 DIGITAL PRODUCT SELLER
**Route:** `/templates/digital-product-seller` | **Theme:** Emerald Green (`#059669`), Mint Soft (`#ecfdf5`), Clean White (`#ffffff`)

#### How it Renders
1. **Product Bundle Hero:** Displays high-converting template mockups with total asset count (e.g., 140+ templates).
2. **Bundle Contents Breakdown:** Itemized list of included categories (Reel covers, carousels, stories, icon sets).
3. **Before & After Design Comparison:** Visual side-by-side showing DIY unbranded post vs. polished Canva layout.
4. **License Tier Matrix:** Personal Starter Pack, Full Commercial Creator Bundle, and Agency Resell License.
5. **Instant Fulfillment Guarantee:** Highlights immediate automated email download link with zero waiting.

#### Setup Wizard Field Mapping
- **Template Bundle Name & Price:** Step 4 (`offers.product.name`, `offers.product.priceInr`, `offers.product.link`).
- **Software Compatibility:** Step 7 (`knowledge.toolsUsed` -> e.g., "Canva Free & Pro, Notion").
- **Delivery Guarantee:** Step 7 (`knowledge.refundPolicy` -> 7-day money-back guarantee).
- **Download Counter:** Step 5 (`proof.results` -> e.g. "12,400+ Downloads", "4.9★ Rating").

---

### 3.7 CLINIC & HEALTH PRACTITIONER
**Route:** `/templates/clinic-practitioner` | **Theme:** Clinical Navy (`#1e3a8a`), Medical Teal (`#0d9488`), Crisp White (`#f8fafc`)

#### How it Renders
1. **Doctor Credentials Bar:** Displays medical council registration number, degrees (MBBS, MD, FRCP), and years of practice.
2. **Specialities & Clinical Conditions:** Structured cards covering cardiac risk, diabetes, preventive health, and thyroid care.
3. **Clinic Address & Locality:** Clean consultation hours, local clinic area, and instant appointment scheduling.
4. **Patient Ethics & Testimonials:** Respectful, verified patient feedback focusing on bedside manner and clinical recovery.

#### Setup Wizard Field Mapping
- **Degrees & Titles:** Step 2 (`identity.ownerRole` -> e.g., "MBBS, MD (Internal Medicine), FRCP").
- **Medical Council Reg No:** Step 5 (`proof.credentials` -> e.g. "DMC Reg. #8342").
- **Clinic Area & City:** Step 2 (`identity.city` -> e.g. "Defence Colony, South Delhi").
- **Conditions Treated:** Step 3 (`positioning.problem` & `positioning.forWho`).
- **Appointment Line:** Step 2 (`identity.whatsapp` & `identity.phone`).

---

### 3.8 AUTHOR & KEYNOTE SPEAKER
**Route:** `/templates/author-speaker` | **Theme:** Crimson Ink (`#881337`), Antique Cream (`#fffbeb`), Gold (`#d97706`)

#### How it Renders
1. **Bestseller Showcase:** Book covers with publisher credits (HarperCollins, Penguin), sales counts, and literary awards.
2. **Keynote Speaking Topics:** Corporate and university talk descriptions with duration and ideal audience profiles.
3. **Literary Agent & Speaker Inquiries:** Dedicated booking channels for event organizers, lecture bureaus, and press.
4. **Press Kit & Media Quotes:** Endorsements from major publications and prominent industry leaders.

#### Setup Wizard Field Mapping
- **Book Details & Awards:** Step 4 (`offers.tiers` -> Name = Book Title, Summary = Description, Deliverables = Awards/Publisher) & Step 5 (`proof.credentials`).
- **Keynote Talks:** Step 7 (`knowledge.process` -> Title = Keynote Topic, Detail = Audience & Takeaways).
- **Literary Agent Booking:** Step 6 (`frontDoor.bookingUrl` or custom email).
- **Media Features:** Step 5 (`proof.results` -> e.g. "40k+ Copies Sold", "TEDx Speaker").

---

### 3.9 LOCAL SERVICE PROFESSIONAL
**Route:** `/templates/local-service-pro` | **Theme:** Safety Saffron (`#d97706`), Forest Trust (`#15803d`), Clean White (`#ffffff`)

#### How it Renders
1. **Fast-Dispatch Banner:** Guaranteed on-site emergency arrival time (e.g., *Under 90 minutes across Mumbai*).
2. **Trust & Verification Strip:** GST registration number, insured & bonded badge, and Google star ratings.
3. **Itemized Rate Card / Price Book:** Category-wise transparent pricing (Plumbing: Tap repair ₹299; Electrical: Socket fix ₹249).
4. **Service Neighborhood Coverage:** Complete list of serviced localities and suburbs.
5. **Instant WhatsApp / Call Dispatch:** Click-to-call direct communication with no complex forms.

#### Setup Wizard Field Mapping
- **Response SLA:** Step 6 (`frontDoor.responseTime` -> e.g. "Under 90 minutes").
- **Rate Card / Pricing:** Step 4 (`offers.tiers` -> list items and flat rates in deliverables).
- **Service Area Suburbs:** Step 2 (`identity.city` -> include suburbs like "Andheri, Bandra, Juhu").
- **GST & Insurance:** Step 9 (`payments.gstin` & `payments.legalName`).

---

### 3.10 TUTOR & TRAINING INSTITUTE
**Route:** `/templates/tutor-training` | **Theme:** Royal Academic Blue (`#1e40af`), Sunflower Gold (`#eab308`), Crisp White (`#ffffff`)

#### How it Renders
1. **Academic Trust Strip:** Board pass percentage (96%), average score improvement (+22%), and max batch cap (12 students).
2. **Grade-Level Subject Matrix:** Primary (Class 1–5), Middle (6–8), Secondary (9–10), and Senior Secondary (11–12 PCM/PCB).
3. **4-Step Learning Process:** Trial Class -> Diagnostic Assessment -> Batch Placement -> Monthly Progress Reports.
4. **Parent Reviews:** Testimonials from parents praising concept clarity and stress-free board exam prep.
5. **Free Trial Class CTA:** No-risk trial class booking without upfront credit card requirements.

#### Setup Wizard Field Mapping
- **Board Pass Rate & Stats:** Step 5 (`proof.results` -> e.g. "96% Pass Rate", "+22% Score Boost").
- **Grade Batches & Fees:** Step 4 (`offers.tiers` -> Class level, subjects, weekly class cadence, monthly fees).
- **Diagnostic Process:** Step 7 (`knowledge.process` -> Step 1: Trial, Step 2: Assessment, etc.).
- **Trial Booking Link:** Step 6 (`frontDoor.bookingUrl` -> Primary CTA = "Book a Free Trial Class").

---

### 3.11 PHYSICAL ARTISAN, MAKER & PHOTOGRAPHER
**Route:** `/templates/physical-artisan` | **Theme:** Clay Terracotta (`#8a4a26`), Soft Linen (`#f6efe3`), Dark Charcoal (`#1c1712`)

#### How it Renders
1. **Visual Contact-Sheet Hero:** Dynamic photo masonry grid highlighting documentary-style imagery.
2. **Artisan Philosophy & Story:** Narrative section capturing the maker's creative ethos and craftsmanship.
3. **Craft & Equipment Line:** Highlights cameras, lenses, film stocks, or handcrafted materials (`knowledge.toolsUsed`).
4. **Session / Commission Packages:** Elopement, Half-Day, and Full-Day coverage with delivery timelines.
5. **Custom Date Availability Checker:** Direct calendar enquiry tool with turnaround notice (e.g. *6-week gallery delivery*).

#### Setup Wizard Field Mapping
- **Founder Ethos & Story:** Step 3 (`positioning.credibility` -> Story) & Step 2 (`identity.tagline`).
- **Craft Gear & Materials:** Step 7 (`knowledge.toolsUsed` -> e.g. "Sony A7 IV, 35mm f/1.4, Kodak Portra 400").
- **Coverage Packages:** Step 4 (`offers.tiers` -> Package duration, deliverables, album prints, pricing).
- **Delivery Turnaround:** Step 7 (`knowledge.process` -> e.g. "6-week curated gallery turnaround").

---

## 4. UNIVERSAL FIELD MAPPING & CROSS-REFERENCE TABLE

| Website Element on Live Template | Primary Wizard Step | Schema Key | Fallback Behavior if Left Blank |
|---|---|---|---|
| **Brand / Company Name** | Step 2: Identity | `identity.brandName` | Uses Founder Name or default sample brand |
| **Founder Name & Title** | Step 2: Identity | `identity.ownerName` & `identity.ownerRole` | Displays niche sample persona |
| **Main Value Tagline** | Step 2: Identity | `identity.tagline` | Auto-generated from `buyer` + `outcome` |
| **City & Operating Region** | Step 2: Identity | `identity.city` & `identity.country` | Displays "India · Remote" |
| **Founder Headshot Image** | Step 2: Identity | `identity.photoUrl` | Renders styled monogram avatar initials |
| **WhatsApp Direct Link** | Step 2: Identity | `identity.whatsapp` | Fallbacks to email inquiry form |
| **Primary Pricing Tiers (1, 2, 3)** | Step 4: Offers | `offers.tiers[]` | Renders template's 3 standard niche packages |
| **Digital Asset / Download** | Step 4: Offers | `offers.product` | Card is hidden unless `enabled: true` |
| **Experience & Client Metrics** | Step 5: Proof | `proof.yearsExperience` & `proof.clientsServed` | Renders niche sample metrics |
| **Verified Testimonials** | Step 5: Proof | `proof.testimonials[]` | Displays 3 styled client endorsement quotes |
| **Case Studies & Outcomes** | Step 5: Proof | `proof.caseStudies[]` | Displays 3 structured ROI case study cards |
| **Call Booking Calendar** | Step 6: Front Door | `frontDoor.bookingUrl` | Switches button to `#contact` or WhatsApp |
| **Delivery Process / Steps** | Step 7: Knowledge | `knowledge.process[]` | Displays 3–4 standard operational steps |
| **In-Scope vs Out-of-Scope** | Step 7: Knowledge | `knowledge.included` & `notIncluded` | Renders template default scope checklist |
| **Tools, Gear & Software** | Step 7: Knowledge | `knowledge.toolsUsed` | Displays niche tools or hides sub-badge |
| **Frequently Asked Questions** | Step 7: Knowledge | `knowledge.faqs[]` | Displays 5 common domain FAQs |
| **YouTube Video Embed** | Step 7: Knowledge | `knowledge.introVideo.url` | Video container is hidden or shows preview placeholder |
| **GSTIN & Registered Entity** | Step 9: Payments | `payments.gstin` & `legalName` | Footer legal notices remain clean |
| **Social Media Profiles** | Step 10: Channels | `channels.social.*` | Social icons link to specified URLs |

---

## 5. GENIE AI SYSTEM PROMPT & INTENT RESOLUTION RULES

When interacting with users in the admin console, the **Genie AI assistant** must follow these deterministic retrieval rules:

### Core Identity & Tone
- You are **Genie**, the intelligent copilot for the One-Person Company (OPC) site builder.
- Always give direct, exact instructions pointing the user to the specific **Step number** and **Field label** in `/setup-wizard`.
- Keep answers concise, actionable, and formatted with clean bullet points.

### Resolution Logic by User Intent

```
User Query: "How do I change my prices?"
└── Genie Rule: Point to Step 4 (Offers & Pricing) -> Edit 'priceInr' or 'priceUsd' for Front Door, Core, or Recurring tier.

User Query: "Where do I add my Calendly link?"
└── Genie Rule: Point to Step 6 (Front Door & Lead Capture) -> Edit 'Booking Calendar URL'.

User Query: "How do I show what is NOT included in my service?"
└── Genie Rule: Point to Step 7 (Knowledge & Delivery) -> Add bullet items to 'Out of Scope / Not Included'.

User Query: "Where do I put my doctor license or degree?"
└── Genie Rule: Point to Step 2 (Identity -> Owner Role) for degrees, and Step 5 (Proof -> Credentials) for Medical Council Reg Number.

User Query: "Can I sell a digital template or PDF book?"
└── Genie Rule: Point to Step 4 (Offers & Pricing) -> Toggle 'Enable Digital Product' -> Enter Product Name, Price, and Download URL.

User Query: "How do I update my curriculum modules for my cohort?"
└── Genie Rule: Point to Step 7 (Knowledge & Delivery -> How do you deliver?) -> Enter each module as a Step title with lesson details.
```

---

## 6. TROUBLESHOOTING & QUALITY ASSURANCE MATRIX

| Issue / Symptom | Root Cause | Immediate Fix |
|---|---|---|
| **Button links to `#contact` instead of Calendly** | `bookingUrl` is empty or missing `https://` prefix in Step 6 | Navigate to Step 6 (Front Door) and enter full URL (e.g. `https://calendly.com/yourname/30min`). |
| **Prices show as `$NaN` or `₹NaN`** | Numeric field received alphabetic characters or symbols | In Step 4 (Offers), enter only numeric digits (e.g. `25000`, not `₹25,000/-`). |
| **Avatar shows initials instead of image** | `photoUrl` is invalid, broken, or blocked by CORS | In Step 2 (Identity), paste a direct public image URL (JPEG/PNG/WebP) or upload via media picker. |
| **Case study cards look empty** | Only client name was provided without results | In Step 5 (Proof), ensure both `client` and `result` (metric/outcome) fields are filled. |
| **WhatsApp button opens blank web page** | Phone number includes extra spaces, dashes, or invalid country prefix | In Step 2 (Identity), enter standard 10-digit mobile number for India (e.g. `9820012345`) or international with country code without `+`. |

---
*End of Knowledge Base Document.*
