# OPC Genie — One Person Company Platform

> **Your One-Person Company** — An AI-powered business-in-a-box platform for solo founders. Describe your business and your Genie builds the site, writes the copy, and runs sales & support — so you can launch and own a real company, solo.

---

## Table of Contents

1. [What This Platform Does](#what-this-platform-does)
2. [Feature Breakdown](#feature-breakdown)
3. [Technical Stack](#technical-stack)
4. [Project Structure](#project-structure)
5. [Data Models](#data-models)
6. [API Reference](#api-reference)
7. [Quick Start](#quick-start)
8. [Environment Variables](#environment-variables)
9. [Docker](#docker)
10. [Known Architecture Gotchas](#known-architecture-gotchas)
11. [Scope of Improvement](#scope-of-improvement)

---

## What This Platform Does

OPC Genie is a full-stack SaaS platform built for **solo founders, independent consultants, freelancers, and one-person businesses** who want to launch and run a real company without hiring a team. It is designed around four core pillars:

- **Build** — AI generates your website, offer pages, and brand copy from a plain-language description of your business
- **Sell** — Offer builder with payment-ready pages, smart pricing recommendations, and sales automation
- **Run** — AI Genie handles inbound enquiries, follow-ups, and customer support around the clock
- **Grow** — Founder analytics, content studio, community, and business playbooks

The platform ships a **three-tier pricing model** (Free Starter → Pro Founder → Enterprise) and is designed for a founder to go from idea to a live, revenue-generating business in a single day.

---

## Feature Breakdown

### Public / Marketing

| Page | Description |
|------|-------------|
| `/` | Hero, stats bar, feature grid, testimonials, final CTA |
| `/marketing` | High-converting sales funnel landing page (visitor → lead capture → signup → offer/sale) |
| `/pricing` | Plan comparison table with FAQ |
| `/platform/*` | Deep-dive pages for each core capability |
| `/resources` | Founder playbooks, guides, templates, and business tools |
| `/contact` | Contact form (stored in DB, email forwarded) |
| `/get_started` | Onboarding / sign-up funnel entry |

> ℹ️ The old global `/community` route has been removed. Community is now per-founder — see below.

### Platform Feature Pages

| Route | Content |
|-------|---------|
| `/platform/ai-website-builder` | AI Website Builder & custom site generation |
| `/platform/content-studio` | ✅ Specialist Content Creation Studio — **20 specialist agents** across 5 categories (Marketing & Content, Sales & Clients, Strategy & Planning, Money & Compliance, Operations & Productivity) with sticky left-nav, per-minute live timer, Voice-to-Text, and FB Marketing agent wired to Claude Sonnet |
| `/platform/offers-payments` | Offers & Payments (Products, services, courses & multi-currency checkout) |
| `/setup-wizard` | ✅ 13-Step Website & Business Setup Wizard (schema 2.0, Genie prefill sync, template selection, ConfirmedChip, submits to `/api/sites/build`) |
| `/templates` | ✅ Template Gallery — **16 templates** across 5 categories; 11 live with full preview pages at `/templates/{slug}` |

> The header **Features** dropdown, footer Platform links, and `site.config.js` feature cards point directly to these platform routes.

### Authenticated User (Founder Dashboard)

| Page | Description |
|------|-------------|
| `/dashboard` | Personalised founder dashboard — greeting, stats, quick links, value props |
| `/dashboard/community` | ✅ Create & manage your own per-founder community (Skool-style) |
| `/profile` | User profile management |

### Per-Founder Community — `/{username}/community/{slug}`

Every Pro/Enterprise founder can spin up their own isolated community for their audience. Key routes:

| Page | Description |
|------|-------------|
| `/{username}/community/{slug}` | ✅ Public community landing page — name, description, categories, member count, join/pay CTA |
| `/dashboard/community` | ✅ Founder self-serve — create community, manage settings, members, threads, events |

**How it works:**
- A community is created as an `Offer` with `offer_type = "community"`. Price can be free (₹0) or paid.
- Joining = existing offer purchase flow. Free join is immediate; paid join goes through Razorpay/Stripe checkout and membership is granted automatically on webhook success.
- Every thread, post, member, and event is scoped to `community_id` — no cross-community data leakage at the query layer.
- Founders configure categories, rules, welcome message, and feature flags from their own dashboard. Platform admin cannot create communities on founders' behalf.
- **Gated to Pro/Enterprise plans** — Free-tier founders see an upgrade prompt.

### Admin Panel (`/admin`)

The admin panel is for **platform operators only** — not founders. Access requires `role = admin` or `role = super_admin`.

| Section | Description |
|---------|-------------|
| `/admin/login` | Admin-only sign-in page (email + password) |
| `/admin` | Overview dashboard — platform-wide metrics |
| `/admin/leads` | Leads & sales funnel tracking — 4-stage funnel, source breakdown, CSV export |
| `/admin/subscribers` | ✅ Newsletter subscriber list — subscribed date, source, active/unsubscribed status, CSV export, per-row toggle |
| `/admin/users` | User management (roles: `user`, `admin`, `super_admin`) |
| `/admin/content` | Offer management — create/edit/delete offers |
| `/admin/communities` | ✅ Read-only oversight of all founder communities — owner, member count, status |
| `/admin/community-templates` | ✅ CRUD for reusable category presets founders pick when creating a community |
| `/admin/settings` | Live site settings — brand copy, pricing, features, marketing page copy, nav |
| `/admin/analytics` | Business Intelligence — Revenue, Users, Offers, Forecasting |
| `/admin/support` | Contact form submissions / support queue |
| `/admin/ai-tools` | AI Genie configuration, conversation monitoring, live testing |

> **Shared admin shell** — all admin pages import a single `components/AdminShell.js` that renders the canonical 11-item sidebar and full header (avatar dropdown, search, bell). The active item is detected automatically via `usePathname()` — no per-page `current` flag needed.
>
> **Admin avatar dropdown** — clicking the avatar shows the logged-in user's name/email, links to **My Dashboard**, **My Community**, **Profile Settings**, and **Sign Out**.

### Auth System

- **OAuth-only** registration for regular users (Google, Microsoft, GitHub, LinkedIn)
- **Email + password** login for admin/super-admin accounts at `/admin/login` **and** the regular `/login` page (email+password tab)
- Both login paths now call `POST /api/auth/login`, write `auth_token` + `user_data` + `user_role` to `localStorage`, and set the `token` cookie so the Next.js middleware can enforce route protection
- JWT tokens (HS256) stored as a `token` cookie; also written to `localStorage` under `auth_token`
- **Role-based access control** enforced at two layers:
  - Next.js `middleware.js` — redirects non-admin users away from `/admin/*` to `/dashboard`
  - FastAPI `get_current_admin_user` dependency — returns 403 for non-admin JWT tokens on all `/api/admin/*` routes

---

## Technical Stack

### Backend

| Layer | Technology |
|-------|-----------|
| Language | Python 3.12 |
| Web framework | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 (async-ready) |
| Migrations | Alembic 1.20 — **17 migration scripts applied** (`aabc0f0a2cfd` → `f7e3dc7821f6` → `b9e4dc8910ab` → `c3a1e9f02b4d` → `a1b2c3d4e5f6` → `a3f9b1c2d4e5` → `d4e5f6a7b8c9` → `e5f6a7b8c9d0` → `f1a2b3c4d5e6` → `80d89c47ebd9` → `c4d5e6f7a8b9` → `d2e3f4a5b6c7` → `e3f4a5b6c7d8` → `g2h3i4j5k6l7` → `b7c8d9e0f1a2` → `h3i4j5k6l7m8`) |
| Database | PostgreSQL 14+ (`ai_services_platform` DB) |
| Auth | `python-jose` (JWT HS256) + `passlib`/`bcrypt` for password hashing |
| OAuth | `httpx` (direct token exchange with Google / Microsoft / GitHub / LinkedIn) |
| Validation | Pydantic v2 + `pydantic-settings` |
| File handling | `python-multipart`, `aiofiles` |
| Templates | Jinja2 (email templates) |
| AI integration | Groq SDK (`groq==0.4.1`) — wired to `POST /api/chat`, `POST /api/genie/draft-site`, and **`POST /api/genie/intake`** (schema 2.0 structured intake); Anthropic SDK (`anthropic`) for Claude Sonnet — wired to Facebook Marketing specialist agent. AI credit tracking via `ai_generations_count` / `ai_generation_credits` columns on `User`. |
| Payments | Razorpay (`razorpay==1.4.2`) primary + Stripe (`stripe==11.3.0`) international — order creation, HMAC verification, webhook handlers |
| Server | Uvicorn with standard extras |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | JavaScript (`.js`) |
| Styling | Tailwind CSS 3 + `@tailwindcss/forms`, `typography`, `aspect-ratio` |
| Animation | Framer Motion 10 |
| Icons | Lucide React + React Icons |
| Config | `site.config.js` + `useSiteConfig()` hook fetches `/api/settings/public` — DB values override static defaults at runtime |
| Auth state | `context/AuthContext.js` → `localStorage` + `useAuth()` hook; login writes `auth_token`, `user_data`, `user_role` |
| Route protection | `middleware.js` reads JWT from `token` cookie — redirects unauthenticated users and non-admins |
| API proxy | `next.config.js` rewrites `/api/*` → `http://localhost:8000/api/*` |
| Route aliases | `next.config.js` redirects clean platform URLs to directory-based routes |
| Utilities | `clsx`, `tailwind-merge`, `jwt-decode` |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Containerisation | Docker + Docker Compose — 4 services: `db` (postgres:16), `backend`, `frontend`, `nginx` reverse proxy |
| Configuration | `site.config.js` — single file controls all brand copy, pricing, features, and nav without code changes |
| Settings persistence | `site_settings` table in PostgreSQL (JSONB key-value store) — admin edits sync to DB and override `site.config.js` at runtime |

---

## Project Structure

```
one-person-company/
├── frontend/
│   ├── app/
│   │   ├── page.js                          # Home page (hero, features grid, testimonials, CTA)
│   │   ├── layout.js                        # Root layout + SEO metadata
│   │   ├── globals.css                      # Global styles
│   │   ├── providers.js                     # React context providers wrapper
│   │   ├── header.js / footer.js            # Global nav + footer (config-driven, auth-aware)
│   │   ├── [username]/
│   │   │   ├── page.js                      # ✅ Founder's public website — dynamically loads template or GenericSite fallback
│   │   │   ├── [offer-slug]/                # ✅ Public offer landing page
│   │   │   │   ├── layout.js
│   │   │   │   └── page.js
│   │   │   └── community/
│   │   │       └── [slug]/                  # ✅ Public community landing page
│   │   │           ├── layout.js
│   │   │           └── page.js
│   │   ├── admin/                           # Platform admin (admin/super_admin role only)
│   │   │   ├── layout.js                    # Admin layout (uses AdminShell)
│   │   │   ├── page.js                      # Admin overview dashboard
│   │   │   ├── login/                       # Admin email+password sign-in
│   │   │   ├── leads/                       # ✅ Leads & Sales Funnel management
│   │   │   ├── subscribers/                 # ✅ Newsletter subscriber management
│   │   │   ├── users/                       # User management
│   │   │   ├── content/                     # Offer management
│   │   │   ├── communities/                 # ✅ Read-only oversight of all communities
│   │   │   ├── community-templates/         # ✅ Category preset CRUD
│   │   │   ├── analytics/                   # Business intelligence
│   │   │   ├── ai-tools/                    # AI Genie admin & monitoring
│   │   │   ├── settings/                    # Live site settings editor
│   │   │   └── support/                     # Support queue
│   │   ├── community/
│   │   │   └── page.js                      # Redirects → /get_started (global forum removed)
│   │   ├── contact/                         # Contact form
│   │   ├── dashboard/
│   │   │   ├── page.js                      # Authenticated founder dashboard
│   │   │   └── community/
│   │   │       └── page.js                  # ✅ Founder community management
│   │   ├── get_started/                     # Onboarding funnel entry
│   │   ├── login/                           # Public login (OAuth + email/password)
│   │   ├── marketing/                       # ✅ High-converting sales funnel landing page
│   │   ├── platform/
│   │   │   ├── ai-website-builder/          # ✅ Genie intake → review → save (Phase 1 replacement)
│   │   │   ├── content-studio/              # ✅ Specialist Content Studio (20 agents, 5 categories)
│   │   │   └── offers-payments/             # ✅ Offers & Payments feature page
│   │   │   # my-website/ deleted — users go to /{username} directly after build
│   │   ├── pricing/                         # Pricing plans + FAQ
│   │   ├── profile/                         # User profile management
│   │   ├── resources/                       # Founder playbooks & guides
│   │   ├── setup-wizard/                    # ✅ 13-step schema 2.0 wizard (Phase 1) — exports TEMPLATE_CATALOGUE
│   │   ├── templates/
│   │   │   ├── page.js                      # ✅ Template gallery — 16 templates across 5 categories (Phase 2)
│   │   │   ├── agency-of-one/page.js        # ✅ Slate + Cyan — process-driven, deliverables ladder
│   │   │   ├── author-speaker/page.js       # ✅ Burgundy + Blush — book showcase, media kit
│   │   │   ├── clinic-practitioner/page.js  # ✅ Medical Blue + Lavender — appointment, credentials, FAQ
│   │   │   ├── coach-mentor/page.js         # ✅ Terracotta + Cream — transformation story, testimonials
│   │   │   ├── consultant-advisor/page.js   # ✅ Navy + Gold — authority, case studies
│   │   │   ├── course-creator/page.js       # ✅ Deep Teal + Amber — curriculum preview, enrolment
│   │   │   ├── digital-product-seller/page.js # ✅ Hot Pink + Dark — instant download, price anchor
│   │   │   ├── freelancer-creative/page.js  # ✅ Electric Violet + Lime — portfolio-led
│   │   │   ├── local-service-pro/page.js    # ✅ Forest + Saffron — WhatsApp CTA, GST badges
│   │   │   ├── newsletter-community/page.js # ✅ Indigo + Mint — subscriber-first, free → paid
│   │   │   └── tutor-training/page.js       # ✅ Sunflower + Sky — batch schedule, subject grid
│   │   └── signout/                         # Sign-out handler
│   ├── components/
│   │   ├── AdminShell.js                    # ✅ Shared admin sidebar + header
│   │   └── ChatDemoWidget.js                # ✅ Shared interactive AI Genie chat widget
│   ├── context/
│   │   └── AuthContext.js                   # Global auth state (localStorage + token cookie)
│   ├── hooks/
│   │   ├── useAuth.js                       # Auth state hook
│   │   └── useSiteConfig.js                 # Config hook: static defaults → DB override
│   ├── lib/
│   │   └── wizard-schema.js                 # ✅ Schema 2.0 blank template + applyProgrammaticDefaults (Phase 1)
│   ├── middleware.js                         # JWT cookie check — protects /dashboard, /admin
│   ├── site.config.js                       # ⚡ Single source of truth for brand/feature defaults
│   ├── next.config.js                       # API proxy + platform URL redirects + standalone output
│   ├── Dockerfile                           # ✅ 3-stage Node 20 build (standalone output)
│   └── tailwind.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py                          # FastAPI app, middleware, startup seed events
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth_routes.py           # Login, register, OAuth, me, verify, logout
│   │   │   │   ├── chat_routes.py           # ✅ POST /api/chat — AI Genie (Groq-backed)
│   │   │   │   ├── agent_session_routes.py  # ✅ Specialist agent sessions + per-min billing
│   │   │   │   ├── genie_routes.py          # ✅ /draft-site + /intake + /save-wizard + /status (Phase 1)
│   │   │   │   ├── site_build_routes.py     # ✅ POST /api/sites/build + GET /api/sites/public/{slug} (Phase 1)
│   │   │   │   ├── fb_agent_routes.py       # ✅ POST /api/agent/fb-marketing/chat (Claude Sonnet)
│   │   │   │   ├── enquiry_routes.py        # ✅ /api/enquiries (AI Sales Desk lead replies)
│   │   │   │   ├── lead_routes.py           # ✅ POST /api/leads, GET list, funnel stats
│   │   │   │   ├── subscriber_routes.py     # ✅ Newsletter subscribe (public) + admin CRUD
│   │   │   │   ├── content_routes.py        # /api/content/offers CRUD + public offer lookup
│   │   │   │   ├── payment_routes.py        # ✅ Razorpay + Stripe; webhooks grant community membership
│   │   │   │   ├── community_routes.py      # ✅ Full tenant-scoped community API (25 routes)
│   │   │   │   ├── resource_routes.py       # /api/resources (playbooks)
│   │   │   │   ├── page_routes.py           # /api/pages (CMS pages)
│   │   │   │   ├── settings_routes.py       # /api/settings/public + admin CRUD + wizard save
│   │   │   │   └── contact_routes.py        # /api/contact
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── database.py                  # Engine, SessionLocal, Base, get_db
│   │   │   ├── config.py                    # Settings (DB, Razorpay, Stripe, Groq, Anthropic)
│   │   │   ├── auth.py                      # JWT helpers, password hashing
│   │   │   ├── crypto.py                    # ✅ AES-256 Symmetric encryption & key masking (BYOK)
│   │   │   ├── dependencies.py              # get_current_user, get_current_admin_user
│   │   │   ├── middleware.py                # ✅ Phase 0 rewrite — exact (method,path) matching + rate limits
│   │   │   ├── middleware_old.py            # Archived pre-Phase-0 version — do not use
│   │   │   └── oauth.py                     # OAuth token exchange helpers
│   │   ├── models/
│   │   │   ├── user.py                      # User, UserRole, OAuthProvider
│   │   │   ├── lead.py                      # ✅ Lead — email capture & conversion tracking
│   │   │   ├── newsletter_subscriber.py     # ✅ NewsletterSubscriber
│   │   │   ├── offer.py                     # Offer — Phase 1 adds tier, price_usd, deliverables, is_highlighted, sort_order, founder_site_id
│   │   │   ├── chat.py                      # ✅ ChatMessage — session history
│   │   │   ├── agent_session.py             # ✅ AgentSession + AgentSessionMessage
│   │   │   ├── subscription.py              # ✅ UserSubscription + Payment
│   │   │   ├── community.py                 # ✅ Community, CommunitySettings, Thread, Post,
│   │   │   │                                #    Member, Event, CommunityTemplate (tenant-scoped)
│   │   │   ├── content_asset.py             # ContentAsset (media assets)
│   │   │   ├── resource.py                  # Resource (playbooks/guides)
│   │   │   ├── site_settings.py             # SiteSetting (JSONB key-value store)
│   │   │   ├── user_site_settings.py        # ✅ UserSiteSettings (per-founder wizard config, unique user_id+key)
│   │   │   ├── founder_site.py              # ✅ FounderSite + FounderSiteSlugHistory (Phase 1)
│   │   │   ├── page.py                      # CMS page model
│   │   │   ├── contact.py                   # ContactSubmission
│   │   │   ├── user_ai_credential.py        # ✅ UserAiCredential (BYOK Key storage)
│   │   │   └── ad_management_state.py       # ✅ AdManagementState (Human-In-The-Loop tracking)
│   │   ├── schemas/                         # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── reserved_names.py            # ✅ Reserved username/slug validation (Phase 1)
│   │   │   └── offer_sync_service.py        # ✅ Wizard tiers → Offer rows, never deletes (Phase 1)
│   │   └── db/                              # DB init helpers + playbook seed data
│   ├── alembic/
│   │   └── versions/
│   │       ├── aabc0f0a2cfd_*.py            # Rename Course→Offer, Resource→ContentAsset
│   │       ├── f7e3dc7821f6_*.py            # ✅ chat_messages, user_subscriptions, payments
│   │       ├── b9e4dc8910ab_*.py            # ✅ leads table
│   │       ├── c3a1e9f02b4d_*.py            # ✅ Community tenant rearchitecture
│   │       ├── a1b2c3d4e5f6_*.py            # ✅ newsletter_subscribers table
│   │       ├── a3f9b1c2d4e5_*.py            # ✅ fb_agent_states table
│   │       ├── d4e5f6a7b8c9_*.py            # ✅ user_site_settings table
│   │       ├── e5f6a7b8c9d0_*.py            # ✅ extend offer_type enum
│   │       ├── f1a2b3c4d5e6_*.py            # ✅ schema_version on user_site_settings
│   │       ├── 80d89c47ebd9_*.py            # ✅ merge heads before founder_sites (Phase 1)
│   │       ├── c4d5e6f7a8b9_*.py            # ✅ founder_sites + slug history table (Phase 1 / Mig 10)
│   │       ├── d2e3f4a5b6c7_*.py            # ✅ offer tier fields (Phase 1 / Mig 11)
│   │       ├── e3f4a5b6c7d8_*.py            # ✅ unique (user_id, key) on user_site_settings (Phase 1 / Mig 12)
│   │       ├── g2h3i4j5k6l7_*.py            # ✅ template_slug + template_section on user_site_settings (Phase 2 / Mig 13)
│   │       ├── b7c8d9e0f1a2_*.py            # ✅ ai_generations_count + ai_generation_credits on users (Phase 2 / Mig 14)
│   │       └── h3i4j5k6l7m8_*.py            # ✅ merge heads (bookkeeping only — no DDL) (Phase 2 / Mig 15)
│   ├── Dockerfile/
│   │   └── Dockerfile                       # ✅ Python 3.12 slim; runs alembic then uvicorn
│   ├── push_config.py                       # Utility: push site.config.js defaults to DB
│   ├── tests/
│   └── requirements.txt
│
├── nginx/
│   └── nginx.conf                           # ✅ /api/* → backend:8000, /* → frontend:3000
│
├── .bob/                                    # Bob AI assistant config
├── AGENTS.md
├── docker-compose.yml                       # ✅ 4 services: db, backend, frontend, nginx
└── README.md
```

---

## Data Models

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | All registered users; roles: `user`, `admin`, `super_admin`; `username` field for public offer/community URLs; **Phase 2** adds `ai_generations_count` and `ai_generation_credits` columns |
| `Lead` | `leads` | Captured leads — `email`, `source`, UTM parameters, `referrer_url`, `converted_to_user_id` |
| `NewsletterSubscriber` | `newsletter_subscribers` | ✅ Footer newsletter subscriptions — `email`, `name`, `source`, `is_active`, `subscribed_at`, `unsubscribed_at` |
| `FounderSite` | `founder_sites` | ✅ Phase 1 — one row per founder's public website; `user_id` unique, `slug` unique, `theme`, `status`, `custom_domain`, `published_at` |
| `FounderSiteSlugHistory` | `founder_site_slug_history` | ✅ Phase 1 — every old slug a founder ever used; prevents re-claiming; drives 301 redirects |
| `Offer` | `offers` | Offer catalogue — `slug`, `price`, `currency`, `creator_id`; `offer_type` ∈ `course`, `digital_product`, `coaching`, `service`, `video`, `audio`, `book`, `event`, `physical`, `bundle`, **`community`**, `other`; Phase 1 adds `tier`, `price_usd`, `deliverables`, `is_highlighted`, `sort_order`, `founder_site_id` |
| `ChatMessage` | `chat_messages` | AI Genie conversation history — `user_id` (nullable), `session_id`, `role`, `content` |
| `AgentSession` | `agent_sessions` | ✅ Specialist Agent live sessions — `session_id`, `agent_id`, `rate_per_minute`, `free_seconds` (60s), `total_seconds`, `billable_minutes`, `total_charged`, `status` |
| `AgentSessionMessage` | `agent_session_messages` | ✅ Live specialist chat & voice history — `session_id`, `role`, `content`, `input_type` (`text`/`voice`) |
| `UserSubscription` | `user_subscriptions` | One row per user — active plan (`free`/`pro`/`enterprise`), billing cycle, gateway IDs, period dates |
| `UserSiteSettings` | `user_site_settings` | ✅ Per-founder site & brand configuration generated by setup-wizard or customizer; **Phase 2** adds `template_slug` and `template_section` denormalised columns + composite index |
| `Payment` | `payments` | Every payment transaction — gateway-agnostic; records order ID, payment ID, signature, amount, raw webhook payload |
| `Community` | `communities` | ✅ Tenant root — one per founder community; backed by an `Offer` row; unique `(owner_id, slug)` |
| `CommunitySettings` | `community_settings` | ✅ 1:1 per community — welcome message, categories, rules, feature flags |
| `CommunityThread` | `community_threads` | ✅ Discussion threads — scoped to `community_id` |
| `CommunityPost` | `community_posts` | ✅ Replies inside threads; scoped implicitly via parent thread |
| `CommunityMember` | `community_members` | ✅ Member row — `unique(community_id, user_id)`; tracks payment ID for paid joins, role, ban status |
| `CommunityEvent` | `community_events` | ✅ Events — scoped to `community_id` |
| `CommunityTemplate` | `community_templates` | ✅ Platform-admin–managed category presets (seeded: Coaching, Course/Cohort, Membership Site) |
| `ContentAsset` | `content_assets` | Media and downloadable assets |
| `Resource` | `resources` | Founder playbooks and reference guides |
| `SiteSetting` | `site_settings` | JSONB key-value store for live site configuration |
| `ContactSubmission` | `contacts` | Contact form submissions |
| `Page` | `pages` | CMS-managed pages |

---

## API Reference

### Auth

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/auth/login` | Public | Email/password login — sets httpOnly `token` cookie + returns JWT |
| `POST` | `/api/auth/register` | Public | Register via OAuth token exchange |
| `POST` | `/api/auth/logout` | Auth | Clear auth cookie |
| `GET` | `/api/auth/verify` | Auth | Verify JWT validity (Bearer header) |
| `GET` | `/api/auth/me` | Auth | Get current user profile (cookie or Bearer) |
| `POST` | `/api/auth/oauth/callback` | Public | Exchange OAuth code → JWT |
| `POST` | `/api/auth/change-password` | Admin | Change the admin account password |

### Offers (Content)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/content/offers` | Auth | List offers |
| `POST` | `/api/content/offers` | Admin | Create an offer (auto-generates `slug` from title) |
| `PUT` | `/api/content/offers/{id}` | Admin | Update an offer |
| `DELETE` | `/api/content/offers/{id}` | Admin | Delete an offer |
| `GET` | `/api/content/offers/public/{username}/{slug}` | Public | Get a published offer by creator username + slug |

### Community (tenant-scoped)

#### Founder self-serve

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/communities` | Auth (Pro/Enterprise) | Create a community + backing Offer atomically |
| `GET` | `/api/communities/mine` | Auth | List the caller's own communities |
| `PUT` | `/api/communities/{id}` | Owner | Update name, description, branding, status |
| `GET` | `/api/communities/{id}/settings` | Owner | Get CommunitySettings |
| `PUT` | `/api/communities/{id}/settings` | Owner | Update categories, rules, feature flags |

#### Public

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/public/{username}/community/{slug}` | Public | Community landing page data |
| `POST` | `/api/public/{username}/community/{slug}/join` | Auth | Join — free = immediate; paid = returns `offer_id` for payment flow |

#### Member-only (membership-gated)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/community/{id}/threads` | Member | List threads |
| `POST` | `/api/community/{id}/threads` | Member | Create a thread |
| `GET` | `/api/community/{id}/threads/{tid}` | Member | Thread + posts (increments view count) |
| `PUT` | `/api/community/{id}/threads/{tid}` | Author/Owner | Edit thread |
| `DELETE` | `/api/community/{id}/threads/{tid}` | Author/Owner | Delete thread |
| `POST` | `/api/community/{id}/threads/{tid}/posts` | Member | Reply to a thread |
| `GET` | `/api/community/{id}/events` | Member | List events |

#### Owner-only

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/community/{id}/events` | Owner | Create event |
| `PUT` | `/api/community/{id}/events/{eid}` | Owner | Update event |
| `DELETE` | `/api/community/{id}/events/{eid}` | Owner | Delete event |
| `GET` | `/api/community/{id}/members` | Owner | Member list |
| `PUT` | `/api/community/{id}/members/{mid}` | Owner | Update role / ban / badge |
| `DELETE` | `/api/community/{id}/members/{mid}` | Owner | Remove member |

#### Platform admin

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/admin/communities` | Platform Admin | Read-only list of all communities across the platform |
| `GET` | `/api/admin/community-templates` | Platform Admin | List category templates |
| `POST` | `/api/admin/community-templates` | Platform Admin | Create a template |
| `PUT` | `/api/admin/community-templates/{id}` | Platform Admin | Update a template |
| `DELETE` | `/api/admin/community-templates/{id}` | Platform Admin | Delete a template |

### Content Assets / Resources

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/content-assets/public` | Public | List published content assets |
| `GET` | `/api/resources` | Public | List playbooks/guides |
| `POST` | `/api/resources` | Admin | Create a resource |
| `PUT` | `/api/resources/{id}` | Admin | Update a resource |
| `DELETE` | `/api/resources/{id}` | Admin | Delete a resource |

### Pages (CMS)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/pages/public` | Public | List published pages (used by header nav) |
| `GET` | `/api/pages` | Admin | List all pages |
| `POST` | `/api/pages` | Admin | Create a page |
| `PUT` | `/api/pages/{id}` | Admin | Update a page |
| `DELETE` | `/api/pages/{id}` | Admin | Delete a page |

### Settings

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/settings/public` | Public | Get all public settings (used by `useSiteConfig()`) |
| `GET` | `/api/settings` | Admin | Get full settings including private keys |
| `PUT` | `/api/settings` | Admin | Update one or more settings keys |

### Leads & Funnel Tracking

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/leads` | Public | Capture an email + UTM params + source tag. Idempotent per `(email, source)` within 24h. |
| `GET` | `/api/leads` | Admin | List captured leads, filterable by source, date range, conversion status. |
| `GET` | `/api/leads/funnel` | Admin | Aggregate counts and conversion rates across Leads → Signups → Offers Created → First Sales. |

### Newsletter Subscribers

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/subscribers` | Public | Subscribe an email to the newsletter. Idempotent — re-subscribes a previously unsubscribed address. |
| `GET` | `/api/subscribers` | Admin | List all subscribers, filterable by `active_only` and `source`; supports search by email or name. |
| `PATCH` | `/api/subscribers/{id}` | Admin | Toggle active/inactive status for a subscriber (soft unsubscribe / re-subscribe). |

### AI Genie & Specialist Agents

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/chat` | Public (quota-limited) | Send a message to the general AI Genie (Groq-backed). Anonymous: 5/day · Free: 20/day · Pro: 200/day · Enterprise: unlimited. |
| `POST` | `/api/genie/draft-site` | Public | Wizard Step 1 AI prefill — receives business description, returns partial schema 2.0 wizard state. |
| `POST` | `/api/genie/intake` | Public (rate-limited) | **Phase 1** — structured schema 2.0 intake; receives answers + links + pasted material; returns `{ prefill, needsConfirmation, followUps, saved, remaining_credits }`. |
| `GET` | `/api/genie/status` | Auth | **Phase 1** — returns the logged-in user's last saved Genie draft (for wizard reload). |
| `POST` | `/api/genie/save-wizard` | Auth | **Phase 1** — saves completed Genie state directly to `user_site_settings` (skips the 13-step wizard). |
| `POST` | `/api/sites/build` | Auth | **Phase 1** — requires login; validates slug (reserved_names.py), creates/updates `founder_sites` row + slug history, syncs offers via `offer_sync_service`, persists to `user_site_settings`; returns preview URL. |
| `GET` | `/api/sites/public/{slug}` | Public | **Phase 1** — returns full `site_build_payload` for a slug; 404 if no `founder_sites` row exists. |
| `POST` | `/api/agent-session/start` | Public / Auth | Initialize a live Specialist Agent session (starts timer, grants first 60s free). |
| `POST` | `/api/agent-session/heartbeat` | Public / Auth | Heartbeat every 15s — computes elapsed duration and billable minute units. |
| `POST` | `/api/agent-session/stop` | Public / Auth | Stop session clock, finalize billable time, compute total charged. |
| `POST` | `/api/agent-session/message` | Public / Auth | Send message (text or voice) and receive specialist response. |
| `GET` | `/api/agent-session/{session_id}` | Public / Auth | Retrieve session transcript, duration metrics, and invoice summary. |
| `POST` | `/api/agent/fb-marketing/chat` | Public / Auth | Facebook Marketing specialist (Claude Sonnet) — supports 10 quick-command shortcuts. |

### Payments

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/payments/create-order` | Auth | Create a Razorpay order or Stripe PaymentIntent for an offer purchase or plan upgrade |
| `POST` | `/api/payments/verify` | Auth | Verify Razorpay HMAC signature; marks payment captured |
| `GET` | `/api/payments/subscription` | Auth | Return the current user's active subscription |
| `POST` | `/api/payments/webhook/razorpay` | Public | Razorpay webhook — `payment.captured` auto-grants community membership if `offer_type = community` |
| `POST` | `/api/payments/webhook/stripe` | Public | Stripe webhook — `payment_intent.succeeded` auto-grants community membership if `offer_type = community` |

### Other

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/contact` | Public | Submit contact form |
| `GET` | `/health` | Public | Health check |
| `GET` | `/api/db-status` | Public | Database connection status |

Full interactive docs: **http://localhost:8000/docs**

---

## Quick Start

### Prerequisites

- Node.js v18+
- Python 3.12 (use `py -3` launcher on Windows)
- PostgreSQL 14+

### 1 — Backend

```bash
cd backend

# Create a fresh virtual environment
# Windows (PowerShell)
py -3 -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# If PowerShell blocks the activation script, run once:
# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
# Edit .env — fill in DB credentials, SECRET_KEY, and OAuth app credentials

# Run Alembic migrations (creates all tables including community rearchitecture)
alembic upgrade head

# Start the server
# Auto-seeds super-admin and default site settings on first run
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> ⚠️ **Do not use `pip install -r requirements.txt`** if the venv was originally created at a different path. The launcher scripts inside `venv/Scripts/` embed the absolute path they were created with and will fail with *"Unable to create process"*. Always recreate the venv in-place with `py -3 -m venv venv` before installing.

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend application (landing page) |
| http://localhost:3000/login | Public login (OAuth + email/password) |
| http://localhost:3000/admin/login | Admin-only sign-in |
| http://localhost:3000/dashboard | Founder dashboard (auth required) |
| http://localhost:3000/dashboard/community | Founder community management (Pro/Enterprise) |
| http://localhost:8000/docs | FastAPI Swagger UI |

### First Login

The super-admin account is seeded automatically from `SUPER_ADMIN_EMAIL` in `.env` (defaults to `admin@aiservices.com`, password via `FIRST_SUPERUSER_PASSWORD`).

**Admin login:** Navigate to `/admin/login` and sign in. Redirects to `/admin` dashboard.

**Founder login:** Navigate to `/login`. Use OAuth (Google/LinkedIn/etc) or the email+password tab. Redirects to `/dashboard` for regular users, `/admin` for admins.

Both login paths write `auth_token`, `user_data`, and `user_role` to `localStorage` and set the `token` cookie so the Next.js middleware enforces route protection correctly.

### Pushing Default Config to the Database

After the first run, push the `site.config.js` defaults into the `site_settings` DB table so the admin Settings page has data to work with:

```bash
cd backend
python push_config.py
```

### Site Configuration

All brand copy, pricing, features, and nav labels are controlled from two places — whichever is more specific wins:

1. **`frontend/site.config.js`** — static fallback defaults (brand name, hero copy, features, pricing, etc.)
2. **`site_settings` DB table** — admin edits via `/admin/settings` write JSONB rows here and override the static config at runtime via `/api/settings/public`

### Creating a Community (Founder)

1. Ensure your account is on **Pro or Enterprise** plan
2. Go to `/dashboard/community`
3. Click **"Create community"** — fill in name, description, price (blank = free), currency, and optionally pick a category template
4. After creation, go to the **Settings** tab and set status to **Active**
5. Share your public URL: `/{your-username}/community/{slug}`

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# Required
SECRET_KEY=           # Static secret — if unset, rotates on every restart (invalidates all JWTs)

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_services_platform
DB_USER=watsonx_user
DB_PASSWORD=

# Super-admin seed
SUPER_ADMIN_EMAIL=admin@aiservices.com
FIRST_SUPERUSER_PASSWORD=

# OAuth providers (configure at least one)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# AI Genie — required for /api/chat
GROQ_API_KEY=
GROQ_MODEL=llama3-70b-8192    # optional override

# Payments — Razorpay (primary, India)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=      # from Razorpay dashboard → Webhooks

# Payments — Stripe (international)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=        # from Stripe dashboard → Webhooks

# Frontend origin (used for payment redirect URLs)
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **`SECRET_KEY` is critical.** If left unset, a new random key is generated on every backend restart, invalidating all issued JWTs and logging out every user.

---

## Docker

The full stack runs with a single command. All four services are defined and wired.

```bash
# 1. Copy and fill in environment variables
cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY, DB_PASSWORD, GROQ_API_KEY, payment keys, etc.

# 2. Build and start
docker compose up --build
```

| URL | Description |
|-----|-------------|
| http://localhost | nginx entry point — frontend + API |
| http://localhost/api/docs | FastAPI Swagger UI (via nginx) |
| http://localhost:8000 | Backend direct (remove port in production) |
| http://localhost:3000 | Frontend direct (remove port in production) |

**Services**

| Service | Image / Build | Role |
|---------|--------------|------|
| `db` | `postgres:16-alpine` | PostgreSQL data store; health-checked before backend starts |
| `backend` | `backend/Dockerfile/Dockerfile` | Runs `alembic upgrade head` then `uvicorn`; waits for `db` healthy |
| `frontend` | `frontend/Dockerfile` | Next.js standalone build; waits for `backend` healthy |
| `nginx` | `nginx:1.27-alpine` | Reverse proxy — `/api/*` → backend, `/*` → frontend |

> ⚠️ The `backend/Dockerfile/Dockerfile` runs migrations automatically on startup. Do not run `alembic upgrade head` manually when using Docker.

---

## Known Architecture Gotchas

| Issue | Impact | Location |
|-------|--------|----------|
| **Auth state desync on same-tab navigation** | After admin login, navigating to `/dashboard` in the same tab may show the header as logged-out because the `storage` event only fires across tabs. The dashboard reads `localStorage` on mount correctly, but the header may lag by one render cycle. | `header.js` → `checkUserAuth` — switch to `AuthContext` or call `window.dispatchEvent(new Event('storage'))` after login writes. Full fix tracked in Scope of Improvement §2. |
| **`SECRET_KEY` not set** | All JWTs invalidated on every restart | `config.py` / `.env` |
| **Platform directories renamed** | All platform directories now use clean descriptive names: `ai-website-builder/`, `content-studio/`, `offers-payments/` | `frontend/app/platform/` |
| ~~**Public path prefix matching**~~ | **Fixed in Phase 0** — `AuthenticationMiddleware` rewritten with exact `(method, path)` compiled regex matching; `"/"` no longer leaks. `middleware_old.py` is the archived pre-fix version. | `AuthenticationMiddleware` |
| **venv path is hardcoded** | `venv/Scripts/` launchers embed the creation-time absolute path — copying the project breaks them | Recreate with `py -3 -m venv venv` at the new location |
| **Subscription tier from payment amount** | `_upsert_subscription()` defaults every successful payment to `PlanTier.PRO` — add a `plan` field to `Payment` before going live | `payment_routes.py` → `_upsert_subscription()` |
| **Stripe amounts use a placeholder FX rate** | `create-order` converts INR → USD cents with a hardcoded multiplier — replace with a live FX lookup before enabling Stripe in production | `payment_routes.py` → `create_order()` |
| **`GROQ_API_KEY` not set** | `/api/chat` returns `503 Service Unavailable` (graceful, not a crash) | `chat_routes.py` / `.env` |
| **Community creation needs Pro/Enterprise** | Free-tier users get a 403 from `POST /api/communities`. The frontend shows an upgrade prompt, but `UserSubscription` must exist for the user — new OAuth signups have no subscription row until they upgrade. | `community_routes.py` → `_require_pro_or_enterprise()` |

---


## Build Phase Tracker

Eight phases from the build plan. A phase is **Done** only when its "Done when" test passes end-to-end.

| Phase | Goal | Status |
|-------|------|--------|
| **Phase 0** — Security Fix | API auth closed; nothing breaks; unauthenticated call to protected route → 401 | ✅ Done |
| **Phase 1** — Foundation | Genie → wizard → build saves `founder_sites`, `user_site_settings` (v2.0), and `offers` rows | ✅ Done |
| **Phase 2** — Template (samples) | 11 live template preview pages at `/templates/{slug}`; gallery at `/templates`; `/{username}` dynamically loads correct template; `template_slug` persisted to DB | ✅ Done |
| **Phase 3** — Real data + copy | Build → Claude copy → validated → `/username` shows the live site at its slug | 🔲 Not started |
| **Phase 4** — Theme gallery | Theme switch via `/templates` + live preview; switching keeps content | 🔲 Not started |
| **Phase 5** — Site admin | Every wizard field editable from `/dashboard/site`; changes appear on live site | 🔲 Not started |
| **Phase 6** — Sales Desk | Enquiry arrives → agent drafts reply → owner approves → reply sends | 🔲 Not started |
| **Phase 7** — Subdomains & domains | Site loads at its subdomain; verified custom domain works | 🔲 Not started |

---


## Scope of Improvement

### 1. ✅ AI Genie — `/api/chat` *(done)*

`POST /api/chat` is live. Groq SDK is wired with the OPC Genie system prompt, daily quota enforcement (free/pro/enterprise/anonymous tiers), and chat history persistence in `chat_messages`.

### 2. Auth Token Storage Unification *(partially fixed)*

The public `/login` email+password form now calls the real API and writes `auth_token`, `user_data`, `user_role` to `localStorage` and sets the `token` cookie — matching the admin login flow exactly.

**Remaining issue:** The header's `checkUserAuth()` listens on the `storage` event, which only fires when localStorage changes **from another tab**. On same-tab navigation after login the header may render as logged-out for one cycle. Full fix:

- Replace the `storage` event listener with a shared `AuthContext` that all pages subscribe to
- Or call `window.dispatchEvent(new Event('storage'))` immediately after writing to `localStorage` in the login handler

### 3. Offer Builder — Wire Founder-Facing Flow

`/admin/content` calls `/api/content/offers` correctly. The public offer landing page at `/{username}/{offer-slug}` is live and wired to Razorpay checkout. Remaining:

- Self-serve offer creation at `/dashboard/offers/new` (founder creates offers without needing admin access)
- AI-generated offer copy from a plain-language description (call `/api/chat` with an offer-writing prompt)

### 4. ✅ Payments & Subscription Management *(done)*

- `UserSubscription` and `Payment` models built and migrated
- Razorpay order creation + HMAC verification live
- Stripe PaymentIntent flow live
- Webhook handlers for both gateways
- **New:** Both webhooks now auto-grant `CommunityMember` when `offer_type = community` and payment succeeds

### 5. ✅ Community — Tenant-Scoped Rearchitecture *(done)*

Complete Skool-style per-founder community system:

- `Community` model backed by an `Offer` row — price, checkout, and membership all reuse existing payment infrastructure
- All community tables (`threads`, `posts`, `members`, `events`, `settings`) scoped by `community_id` — no cross-community leakage possible at the query layer
- 25 API routes across founder self-serve, public landing, member-only, owner-only, and platform admin
- Founder dashboard at `/dashboard/community` — create, settings, members, threads, events
- Public landing at `/{username}/community/{slug}` — mirrors offer landing page structure
- Platform admin oversight at `/admin/communities` (read-only) and `/admin/community-templates` (CRUD)
- Gated to Pro/Enterprise plan
- Old global `/community` page removed — redirects to `/get_started`

### 6. Admin Analytics — Real Data

`/admin/analytics` has a working UI but sample data is hardcoded. Connect it to real aggregation queries:

- Daily/weekly active users, new signups, churn
- Offer creation and sales funnel
- Revenue by plan
- AI Genie usage metrics
- Community engagement metrics (member growth, thread activity per community)

### 7. ✅ Platform Route Rename *(done)*

All platform directories use clean, descriptive names:

```
ai-website-builder/    (was: skillgraph-engine/)
content-studio/        (was: content-co-creation/)
offers-payments/       (was: peer-mentor-matching/)
```

The old `/platform/industry-simulator/` (AI Genie demo) has been removed — the live AI Genie is accessible via the main chat widget and `/api/chat`.

### 17. ✅ New API Routes *(done)*

- `POST /api/genie/draft-site` — wizard Step 1 AI prefill using Groq; returns partial schema 2.0 state for deep-merge
- `POST /api/sites/build` — receives full setup wizard payload, persists raw JSON to `user_site_settings`, returns deterministic preview URL
- `POST /api/agent/fb-marketing/chat` — Facebook Marketing specialist agent wired to Claude Sonnet with 10 quick-command shortcuts
- `POST/GET /api/settings/setup` + `GET /api/settings/mine` — per-user wizard config persistence and retrieval

### 8. ✅ Docker Compose *(done)*

All four services (`db`, `backend`, `frontend`, `nginx`) are defined with health checks, restart policies, and a named volume.

### 9. Email Notifications

Jinja2 is already a dependency:

- Welcome email on first OAuth login / sign-up
- Offer published confirmation
- New lead / sale notification to the founder
- Password-reset flow for the admin account
- Event reminders for community event attendees
- Community membership confirmation on paid join

### 10. Profile Page — API-Wired

`/profile/page.js` currently uses blank placeholder defaults. Wire it to `/api/auth/me` on mount and implement a `PUT /api/auth/me` endpoint to persist profile updates.

### 11. SEO & Performance

- Implement `generateMetadata` on offer and community landing pages for dynamic OG tags
- Add `Product` schema.org structured data for offer pages
- Set up image optimisation pipeline for offer/community thumbnails
- Lighthouse audit and Core Web Vitals baseline before launch

### 12. Community Discovery Page *(v2 — not built yet)*

A public `/explore/communities` page listing all active founder communities across the platform. Deferred until enough real communities exist to make discovery worthwhile. Would pull from `GET /api/admin/communities` filtered to `status=active`.

### 13. ✅ Newsletter Subscribers *(done)*

Footer "Subscribe" button now calls `POST /api/subscribers` and stores the email in a dedicated `newsletter_subscribers` table:

- `NewsletterSubscriber` model — `email` (unique), `name`, `source`, `is_active`, `subscribed_at`, `unsubscribed_at`
- Alembic migration `a1b2c3d4e5f6` applied
- Public `POST /api/subscribers` — idempotent; re-subscribes previously unsubscribed addresses
- Admin `GET /api/subscribers` — filterable by `active_only` / `source` / free-text search; returns summary counts
- Admin `PATCH /api/subscribers/{id}` — per-row soft-unsubscribe / re-subscribe toggle
- `/admin/subscribers` page — summary cards, search, status filter, table with subscribed date and source tag, CSV export, inline toggle button

### 14. ✅ Shared Admin Shell *(done)*

All admin pages previously re-defined their own `AdminLayout` / `AdminNavLayout` component with a different, hand-curated nav list — items appeared and disappeared when navigating between pages.

- Single `components/AdminShell.js` is now the canonical sidebar + header for every admin page
- Nav list is defined once (11 items) and the active item is detected automatically via `usePathname()` — no per-page `current: true` flag
- Full header (search bar, bell, user avatar dropdown) is consistent across all admin pages
- All 11 admin page files (`page.js`, `leads`, `subscribers`, `settings`, `content`, `users`, `analytics`, `ai-tools`, `support`, `communities`, `community-templates`) import and use `AdminShell`

### 15. ✅ Setup Wizard & Custom Site Generator *(done)*

Complete 12-step guided setup wizard at `/setup-wizard`:
- Full responsive 12-column widescreen layout with sticky step navigation, live validation, and progress tracking
- Configures brand identity, admin credentials, social links, hero messaging, proof stats, feature highlights, pricing plans, offers, marketing page copy, and email configurations
- Automated `setup.json` generation and direct persistence to `user_site_settings` and `offers` tables for logged-in accounts

### 16. ✅ Specialist Content Studio with Per-Minute Metering *(done — expanded)*

Interactive AI Specialist Studio at `/platform/content-studio` — fully redesigned with **20 specialist agents across 5 categories**:

| # | Category | Agents |
|---|----------|--------|
| 1 | **Marketing & Content** | Editorial & SEO Specialist, Viral Growth Copywriter, Lifecycle & Funnel Architect, Direct Response Copywriter, Personal Brand Strategist, Local SEO & Google Business Specialist |
| 2 | **Sales & Clients** | Facebook Ads & Growth Specialist *(Claude Sonnet — Live)*, Deal & Proposal Strategist, Sales Closer & Negotiation Coach, WhatsApp & DM Sales Specialist, Client Success Manager |
| 3 | **Strategy & Planning** | Business Strategy Advisor, Pricing & Offer Strategist, Market Research Analyst |
| 4 | **Money & Compliance** | Finance & Cashflow Advisor, Compliance & Paperwork Guide, Contract & Agreement Drafter |
| 5 | **Operations & Productivity** | Operations & Automation Architect, Productivity Coach |

**Navigation & UX:**
- Sticky left sidebar (desktop) — category links auto-highlight as you scroll via `IntersectionObserver`; clicking smooth-scrolls to that section
- Horizontal scrollable category pills on mobile
- **Live** badge on agents already wired to real AI backends; ₹10/min badge on every card
- Real-time billing engine: **First 1 minute (60s) free**, metered per minute thereafter
- Live timer display with automatic Free/Billable state transitions and 15s server heartbeat sync
- Dual input modes: Text input & Browser-native **Voice-to-Text** speech recognition
- **Facebook Marketing agent** routes exclusively to `POST /api/agent/fb-marketing/chat` (Claude Sonnet) with 10 quick-command shortcuts (`/plan`, `/ads`, `/creative`, `/calendar`, `/audience`, `/budget`, `/audit`, `/diagnose`, `/checklist`, `/policy`)
- Session completion modal summarizing total duration, billable units, and total charges
