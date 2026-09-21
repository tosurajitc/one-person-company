/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              SITE CONFIGURATION FILE                    ║
 * ║  Change anything here — the whole website will update.  ║
 * ║  No coding knowledge required.                          ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * HOW TO USE:
 *  1. Edit the values below (keep the quotes, just change the text inside)
 *  2. Save this file
 *  3. Refresh your browser — changes appear instantly
 */

const siteConfig = {

  // ─────────────────────────────────────────────────────────
  // 1. BRAND
  //    Your company name, tagline and contact details.
  // ─────────────────────────────────────────────────────────
  brand: {
    name:        'OPC Genie',                       // Shown in header, footer, browser tab
    tagline:     'Your One-Person Company',          // Small text under the logo
    description: 'Your AI-powered business-in-a-box for solo founders.',
    logoIcon:    'Brain',                            // Lucide icon name (keep as-is unless you know icons)
    year:        '2025',                             // Copyright year in footer
  },

  // ─────────────────────────────────────────────────────────
  // 2. CONTACT & LOCATION
  // ─────────────────────────────────────────────────────────
  contact: {
    email:    'opcgenie@gmail.com',
    phone:    '+91 9875561973',
    location: 'India',
  },

  // ─────────────────────────────────────────────────────────
  // 3. SOCIAL MEDIA LINKS
  //    Leave a url as '' (empty) to hide that icon.
  // ─────────────────────────────────────────────────────────
  social: {
    twitter:   'https://twitter.com/opcgenie',
    linkedin:  'https://linkedin.com/company/opcgenie',
    github:    'https://github.com/opcgenie',
    youtube:   'https://youtube.com/opcgenie',
    facebook:  'https://facebook.com/opcgenie',
    instagram: 'https://instagram.com/opcgenie',
  },

  // ─────────────────────────────────────────────────────────
  // 4. SEO / BROWSER TAB
  // ─────────────────────────────────────────────────────────
  seo: {
    title:       'OPC Genie – Launch Your One-Person Company',
    description: 'Build, brand, and run your one-person company with an AI Genie that handles your website, sales, and support.',
    keywords:    'one person company, solo founder, AI business, OPC, business in a box, AI Genie',
    siteUrl:     'https://opcgenie.com',   // Your live domain (used for Open Graph)
  },

  // ─────────────────────────────────────────────────────────
  // 5. HOME PAGE — HERO SECTION
  //    The big section at the very top of the home page.
  // ─────────────────────────────────────────────────────────
  hero: {
    badge:        'AI-Powered Business-in-a-Box',
    headline:     'Launch Your One-Person Company With Your Own AI Genie',
    subheadline:  'Describe your business. Your Genie builds the site, writes the copy, and runs sales & support — so you can launch and own a real company, solo.',
    highlightWord: 'AI Genie',   // word(s) shown in pink/accent colour
    cta: {
      primary:   { text: 'Build My Business Free',    href: '/setup-wizard' },
      secondary: { text: 'See Your Genie in Action',  href: '/platform/ai-website-builder' },
    },
  },

  // ─────────────────────────────────────────────────────────
  // 6. HOME PAGE — STATS BAR
  //    The 4 numbers shown below the hero.
  // ─────────────────────────────────────────────────────────
  stats: [
    { number: '500+', label: 'Founders Launched' },
    { number: '3x',   label: 'Faster Time-to-Market' },
    { number: '90%',  label: 'Setup in Under a Day' },
    { number: '24/7', label: 'AI Genie Support' },
  ],

  // ─────────────────────────────────────────────────────────
  // 7. HOME PAGE — TRUSTED BY LOGOS
  //    Company names shown in the "Trusted by" row.
  // ─────────────────────────────────────────────────────────
  trustedBy: ['Freelancers', 'Consultants', 'Coaches', 'Creators'],

  // ─────────────────────────────────────────────────────────
  // 7b. HOME PAGE — WHY WE'RE DIFFERENT TITLE / SUBTITLE
  // ─────────────────────────────────────────────────────────
  whyDifferent: {
    title:    "Why OPC Genie is Different",
    subtitle: "Other tools give you templates. Your Genie builds, writes, and runs your business — solo.",
  },

  ecosystemSection: {
    title:    'Complete Business',
    subtitle: 'Everything a solo founder needs to launch, sell, and grow — in one place',
  },

  socialProofSection: {
    title:     'Trusted by',
    highlight: 'Solo Founders',
    subtitle:  "Join hundreds of one-person companies already running on OPC Genie",
  },

  // ─────────────────────────────────────────────────────────
  // 8. HOME PAGE — VALUE PROPOSITIONS
  //    The 4 cards in the "Why We're Different" section.
  // ─────────────────────────────────────────────────────────
  valueProps: [
    {
      title:       'Your Genie Builds It',
      description: 'Describe your business in plain English. Your AI Genie generates your website, copy, and offer pages automatically.',
      highlight:   'vs. DIY Page Builders',
    },
    {
      title:       'Sells While You Sleep',
      description: 'AI-powered sales flows, lead capture, and follow-up sequences that convert visitors into paying customers — hands-free.',
      highlight:   'vs. Manual Follow-up',
    },
    {
      title:       'Runs Your Support',
      description: 'A trained AI handles customer questions, bookings, and FAQs so you never lose a lead to slow response times.',
      highlight:   'vs. Hiring Staff',
    },
    {
      title:       'One Dashboard, Everything',
      description: 'Manage your website, offers, content, community, and analytics from a single clean admin — no switching tools.',
      highlight:   'vs. 10 Disconnected Apps',
    },
  ],

  // ─────────────────────────────────────────────────────────
  // 9. HOME PAGE — PLATFORM FEATURES
  //    The 6 feature cards in the dark section.
  //    status: 'Available' | 'Live Demo' | 'Coming Soon'
  // ─────────────────────────────────────────────────────────
  features: [
    {
      title:       'AI Website Builder',
      description: 'Describe your business and your Genie builds a complete, branded website — no design skills needed',
      preview:     'Live site in under 10 minutes',
      link:        '/platform/ai-website-builder',
      status:      'Available',
    },
    {
      title:       'Referral Programme',
      description: 'Refer a friend and earn 20% commission for the lifetime of their paid subscription — no cap',
      preview:     'Lifetime 20% commission',
      link:        '/platform/offers-payments',
      status:      'Available',
    },
    {
      title:       'Founder Community',
      description: 'Connect with fellow OPC founders, share wins, get feedback, and find collaborators',
      preview:     'Private, moderated founder network',
      link:        '/community',
      status:      'Coming Soon',
    },
    {
      title:       'Digital Workforce',
      description: 'Generate blog posts, social captions, email sequences, and pitch decks with one prompt',
      preview:     'Publish across all channels',
      link:        '/platform/content-studio',
      status:      'Available',
    },
  ],

  // ─────────────────────────────────────────────────────────
  // 10. HOME PAGE — TESTIMONIALS
  // ─────────────────────────────────────────────────────────
  testimonials: [
    {
      name:    'Priya Sharma',
      role:    'Independent Consultant',
      content: 'I launched my consulting website and started getting client enquiries within 48 hours. The AI Genie wrote better copy than I ever could have on my own.',
      rating:  5,
    },
    {
      name:    'James Okafor',
      role:    'Solo SaaS Founder',
      content: 'I replaced three separate tools — website builder, CRM, and support chat — with just OPC Genie. My overhead dropped and my conversions went up.',
      rating:  5,
    },
    {
      name:    'Anika Müller',
      role:    'Freelance Designer',
      content: 'Setting up felt like talking to a very smart business partner. I described what I do, and it built my entire site, pricing page, and FAQ in one session.',
      rating:  5,
    },
  ],

  // ─────────────────────────────────────────────────────────
  // 11. HOME PAGE — FINAL CTA SECTION
  // ─────────────────────────────────────────────────────────
  cta: {
    headline:    'Your Business. Built by Your Genie.',
    subheadline: "Stop juggling tools. Describe what you do — your Genie handles the rest.",
    primary:   { text: 'Build My Business Free', href: '/setup-wizard' },
    secondary: { text: 'Book a Live Demo',        href: '/contact' },
    badges: [
      'No credit card required',
      'Live in under 10 minutes',
      'Cancel anytime',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 12. PRICING PAGE
  //     Change plan names, prices (numbers only), and features.
  //     currency: the symbol shown before the price (e.g. '$', '₹', '€')
  // ─────────────────────────────────────────────────────────
  pricing: {
    currency: '₹',
    annualDiscountPercent: 20,   // % off when paying yearly

    plans: [
      {
        name:        'Launch',
        description: 'Everything you need to get your one-person company live',
        monthlyPrice: 0,
        badge:        'Free Forever',
        buttonText:   'Start Free',
        buttonHref:   '/setup-wizard',
        target:       'Solo founders just starting out',
        features: [
          'AI-generated website (1 site)',
          'Up to 3 service/product offers',
          'AI Genie assistant (50 queries/day)',
          'Basic contact form',
          'Community access',
          'OPC Genie subdomain',
          'Email support',
        ],
        restrictions: [
          'No custom domain',
          'No payment integrations',
          'No analytics dashboard',
        ],
      },
      {
        name:        'Grow',
        description: 'Run your full business from one dashboard',
        monthlyPrice: 999,
        badge:        'Most Popular',
        buttonText:   'Start 7-Day Free Trial',
        buttonHref:   '/setup-wizard',
        target:       'Active solo founders & freelancers',
        features: [
          'Everything in Launch',
          'Custom domain connection',
          'Unlimited offers & products',
          'Unlimited AI Genie queries',
          'Payment gateway integration',
          'AI digital workforce',
          'Analytics dashboard',
          'Email & WhatsApp lead capture',
          'Priority support',
          '30-day money-back guarantee',
        ],
        restrictions: [],
      },
      {
        name:        'Scale',
        description: 'Advanced automation and white-glove setup for serious founders',
        monthlyPrice: 4999,
        badge:        'Best Value',
        buttonText:   'Book Consultation',
        buttonHref:   '/contact',
        target:       'High-revenue solo businesses',
        highlight:    true,
        features: [
          'Everything in Grow',
          'Done-for-you Genie setup session',
          'Advanced AI sales automation',
          'CRM & lead pipeline',
          'Custom AI Genie training on your business',
          'Multi-page site with blog',
          'White-label option',
          'Dedicated account manager',
          'Phone & video call support',
          'Lifetime community access',
        ],
        restrictions: [],
      },
    ],

    faqs: [
      { question: 'Do I need technical skills to use OPC Genie?',  answer: 'None at all. You describe your business in plain English and your Genie handles everything — design, copy, setup, and automation.' },
      { question: 'Can I use my own domain name?',                  answer: 'Yes, on the Grow and Scale plans you can connect any custom domain. Free plan gets an OPC Genie subdomain.' },
      { question: 'What payment gateways are supported?',           answer: 'Razorpay, Stripe, and PayPal are supported on Grow and Scale plans. More gateways are being added regularly.' },
      { question: 'Can I switch plans anytime?',                    answer: 'Absolutely. Upgrade or downgrade at any time — changes take effect immediately with prorated billing.' },
      { question: 'What is the AI Genie trained on?',               answer: 'Your Genie is trained on your business description, your offers, your FAQs, and your past conversations so it always speaks in your voice.' },
      { question: 'Is my business data private?',                   answer: 'Yes. Your data is never shared with other users or used to train models outside your account.' },
      { question: 'What happens after the free trial?',             answer: 'You choose a paid plan or stay on the free tier — no automatic charges, no card required to start.' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 13. FOOTER NAV LINKS
  // ─────────────────────────────────────────────────────────
  footerLinks: {
    platform: [
      { name: 'AI Website Builder', href: '/platform/ai-website-builder' },
      { name: 'Referral Programme', href: '/platform/offers-payments' },
      { name: 'Digital Workforce',  href: '/platform/content-studio' },
      { name: 'Analytics',          href: '/dashboard' },
      { name: 'Community',          href: '/community' },
    ],
    resources: [
      { name: 'Playbooks',   href: '/resources' },
      { name: 'Blog',        href: '/blog' },
      { name: 'Case Studies', href: '/case-studies' },
      { name: 'Help Center', href: '/help' },
      { name: 'Contact',     href: '/contact' },
    ],
    company: [
      { name: 'About Us',  href: '/about' },
      { name: 'Careers',   href: '/careers' },
      { name: 'Press',     href: '/press' },
      { name: 'Partners',  href: '/partners' },
      { name: 'Contact',   href: '/contact' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 14. PLAYBOOKS & RESOURCES PAGE STRUCTURAL DEFAULTS
  // ─────────────────────────────────────────────────────────
  resourcesPage: {
    badge: 'Founder Playbooks & Guides',
    title: 'Founder Playbooks',
    subtitle: 'Guides, templates, and tools to help you launch, sell, and grow your one-person company.',
    searchPlaceholder: 'Search playbooks, templates, checklists...',
    emptyStateTitle: 'No playbooks found',
    emptyStateDescription: 'No playbooks match the selected filters or search query yet.',
  },

  // ─────────────────────────────────────────────────────────
  // 15. MARKETING PAGE STRUCTURAL DEFAULTS
  // ─────────────────────────────────────────────────────────
  marketing_page: {
    hero: {
      headline: 'Stop renting your business. Own it.',
      subheadline: 'Describe your business. Your AI Genie builds the site, writes the copy, and runs it — no monthly rent, no lock-in.',
      cta_label: 'Start free',
      cta_href: '/setup-wizard',
      show_live_demo: true,
    },
    problem_bullets: [
      'Monthly SaaS rent that never ends',
      'Platforms that own your customer data',
      'Generic templates that need a developer',
    ],
    feature_grid: [
      { title: 'Build', before: 'One month with a developer', after: 'One prompt, live in minutes' },
      { title: 'Sell', before: 'Stitching together checkout tools', after: 'Offer page + payments in a day' },
      { title: 'Run', before: 'Answering DMs at midnight', after: 'AI Genie handles enquiries 24/7' },
      { title: 'Grow', before: 'Guessing what\'s working', after: 'Founder analytics + playbooks' },
    ],
    comparison_table: {
      competitors: ['OPC Genie', 'Graphy', 'Kajabi', 'Skool'],
      rows: [
        { label: 'Pricing model', values: ['Flat license', 'Monthly %', 'Monthly $', 'Monthly $'] },
        { label: 'You own the code', values: ['Yes', 'No', 'No', 'No'] },
        { label: 'White-label', values: ['Day one', 'Paid tier', 'Paid tier', 'No'] },
      ],
    },
    testimonials: [],
    lead_magnet: {
      enabled: true,
      resource_id: null,
      headline: 'Get the Solo Founder Launch Playbook',
      cta_label: 'Send me the playbook',
    },
    final_cta: {
      headline: 'Build your business today.',
      cta_label: 'Start free',
    },
  },

}

export default siteConfig
