// ============================================================================
// SOME.HOW — 100% Original 3D Sculptural, Editorial & Portfolio Assets
// ============================================================================

export const HERO_3D_LOGOS = [
  {
    id: 'liquid-mercury',
    label: '01 // Liquid Mercury Platinum',
    src: 'somehow-assets/hero-09.jpg',
  },
  {
    id: 'obsidian-mylar',
    label: '02 // Obsidian Mylar Sculpture',
    src: 'somehow-assets/hero-01.jpg',
  },
  {
    id: 'anodized-chrome',
    label: '03 // Anodized Cobalt & Chrome',
    src: 'somehow-assets/hero-03.jpg',
  },
  {
    id: 'smoked-crystal',
    label: '04 // Smoked Crystal & Prism',
    src: 'somehow-assets/hero-02.jpg',
  },
  {
    id: 'titanium-gold',
    label: '05 // 24K Champagne Gold & Titanium',
    src: 'somehow-assets/hero-09.jpg',
  },
  {
    id: 'forged-carbon',
    label: '06 // Forged Carbon & Laser Chrono',
    src: 'somehow-assets/hero-01.jpg',
  },
];

export const LOADER_3D_OBJECTS = [
  {
    id: 'obsidian-star',
    cls: 'asterix',
    grade: 'obsidian',
    alt: 'Obsidian mylar architectural star sculpture',
    src: 'somehow-assets/obj-03.jpg',
  },
  {
    id: 'cobalt-chrome-sphere',
    cls: 'papier',
    grade: 'cobalt-chrome',
    alt: 'Anodized cobalt and silver chrome faceted sphere',
    src: 'somehow-assets/obj-02.jpg',
  },
  {
    id: 'champagne-gold-star',
    cls: 'asterix',
    grade: 'champagne-gold',
    alt: '24K champagne gold sculptural star monolith',
    src: 'somehow-assets/obj-03.jpg',
  },
  {
    id: 'smoked-crystal-form',
    cls: 'coeur',
    grade: 'smoked-crystal',
    alt: 'Smoked architectural crystal pneumatic sculpture',
    src: 'somehow-assets/obj-01.jpg',
  },
  {
    id: 'liquid-mercury-sphere',
    cls: 'papier',
    grade: 'liquid-mercury',
    alt: 'Molten liquid mercury faceted chrome sculpture',
    src: 'somehow-assets/obj-02.jpg',
  },
  {
    id: 'rose-bronze-monolith',
    cls: 'coeur',
    grade: 'rose-bronze',
    alt: 'Brushed rose-bronze architectural sculpture',
    src: 'somehow-assets/obj-01.jpg',
  },
];

export const MEDIA_ASSETS = {
  manifestoBg: 'somehow-assets/museum-bg.jpg',
  studioLeftImg: 'somehow-assets/studio-left.jpg',
  studioRightImg: 'somehow-assets/studio-right.jpg',
  glitchBgImg: 'somehow-assets/glitch-bg.jpg',
  glitchLeftImg: 'somehow-assets/glitch-left.jpg',
  glitchRightImg: 'somehow-assets/glitch-right.jpg',
};

export const HOLT_PERSPECTIVES = [
  {
    id: 'holt-ai-01',
    label: '01 // Holt Flagship (AI Studio)',
    src: 'somehow-assets/holt-ai-01.jpg',
  },
  {
    id: 'holt-cutout-01',
    label: '01 // Full Uncropped UI',
    src: 'somehow-assets/cutout-01.png',
  },
  {
    id: 'holt-ai-02',
    label: '02 // Holt Collections (AI Studio)',
    src: 'somehow-assets/holt-ai-02.jpg',
  },
  {
    id: 'holt-cutout-02',
    label: '02 // Full Uncropped UI',
    src: 'somehow-assets/cutout-02.png',
  },
];

export const KOTSIFAS_PERSPECTIVES = [
  {
    id: 'kotsifas-ai-03',
    label: '01 // Fireplaces (AI Studio)',
    src: 'somehow-assets/kotsifas-ai-03.jpg',
  },
  {
    id: 'kotsifas-cutout-03',
    label: '01 // Full Uncropped UI',
    src: 'somehow-assets/cutout-03.png',
  },
  {
    id: 'kotsifas-ai-04',
    label: '02 // Outdoor & Living (AI Studio)',
    src: 'somehow-assets/kotsifas-ai-04.jpg',
  },
  {
    id: 'kotsifas-cutout-04',
    label: '02 // Full Uncropped UI',
    src: 'somehow-assets/cutout-04.png',
  },
];

export const WORKS_ITEMS = [
  {
    id: 'holt-flagship',
    title: 'The Holt Creative Studio',
    subtitle: 'Digital Flagship, Italian Architectural Furniture & Spatial Design',
    year: '2026',
    category: 'Digital Flagship / E-Commerce',
    image: 'somehow-assets/holt-ai-01.jpg',
    liveUrl: 'https://holt-creative-studio.vercel.app',
    col: '1 / 7',
    rowOffset: 0,
    alignSelf: 'start',
    parallaxY: 50,
    clipInitial: 'inset(100% 100% 0% 0%)',
    summary:
      'Designed and engineered the digital flagship for The Holt Creative Studio in Athens—uniting Italian architectural furniture houses (Eforma, Bontempi Casa, Amura Lab, Franco Ferri, Lyxo), bespoke interior architecture, and spatial curation under a dark architectural grid.',
    deliverables: ['Flagship Web Experience', 'Custom Catalog Engine', 'Brand & Art Direction'],
    perspectives: HOLT_PERSPECTIVES,
  },
  {
    id: 'holt-collections',
    title: 'The Holt — Curated Archive',
    subtitle: '6-Category Spatial Collection Matrix & Architectural Curation',
    year: '2026',
    category: 'Interactive Catalog / UI Systems',
    image: 'somehow-assets/holt-ai-02.jpg',
    liveUrl: 'https://holt-creative-studio.vercel.app',
    col: '8 / 13',
    rowOffset: 0,
    alignSelf: 'end',
    parallaxY: -65,
    clipInitial: 'inset(100% 0% 0% 100%)',
    summary:
      'Built a full-frame 6-category collection matrix (Διακόσμηση, Αποθήκευση, Καναπέδες, Τραπέζια, Καθίσματα, Φωτισμός) and real-time 240+ SKU product filtering engine with instant modal inspection and bespoke architectural consultation routing.',
    deliverables: ['240+ SKU Data Pipeline', '6-Category Matrix', 'Bespoke Inquiry Flow'],
    perspectives: HOLT_PERSPECTIVES,
  },
  {
    id: 'kotsifas-fireplaces',
    title: 'Tzakia Kotsifas — Intelligent Heat',
    subtitle: 'Architectural Energy Fireplaces, Spartherm & DRU Eco Wave Platform',
    year: '2026',
    category: 'Architectural E-Commerce / Web Platform',
    image: 'somehow-assets/kotsifas-ai-03.jpg',
    liveUrl: 'https://tzakiakotsifas.gr',
    col: '1 / 6',
    rowOffset: 1,
    alignSelf: 'start',
    parallaxY: -55,
    clipInitial: 'inset(100% 100% 0% 0%)',
    summary:
      'Crafted the digital showroom and high-conversion product platform for Kotsifas Intelligent Heat (tzakiakotsifas.gr) in Chalandri, Athens—showcasing 3-sided architectural Spartherm fireplaces, DRU Eco Wave smart-app stoves, and live video showroom consultations.',
    deliverables: ['tzakiakotsifas.gr Platform', 'Interactive Video Showroom', 'Product Configurator'],
    perspectives: KOTSIFAS_PERSPECTIVES,
  },
  {
    id: 'kotsifas-living',
    title: 'Tzakia Kotsifas — Outdoor & Living',
    subtitle: 'Cubic Outdoor Kitchens, Architectural BBQ & Interior Design Collections',
    year: '2026',
    category: 'Luxury Living / Omnichannel Commerce',
    image: 'somehow-assets/kotsifas-ai-04.jpg',
    liveUrl: 'https://tzakiakotsifas.gr',
    col: '7 / 13',
    rowOffset: 1,
    alignSelf: 'end',
    parallaxY: 60,
    clipInitial: 'inset(100% 0% 0% 100%)',
    summary:
      'Expanded the Kotsifas digital ecosystem into architectural outdoor kitchens (Cubic Outdoor BBQ), exterior lounging, and curated interior furniture & lighting collections—presented through full-frame editorial lookbooks and seamless category navigation.',
    deliverables: ['Outdoor Kitchen Showcase', 'Interior & Exterior Catalog', 'Editorial Direction'],
    perspectives: KOTSIFAS_PERSPECTIVES,
  },
];

export const STUDIO_SERVICES = [
  'Flagship websites & interactive WebGL experiences',
  'Custom full-stack web & mobile software',
  'Autonomous AI agents & workflow automation',
  'Brand architecture, 3D motion & art direction',
  'Conversion engineering & high-velocity launches',
];

export const FAQS = [
  {
    q: 'What does Some.how actually build?',
    a: 'We operate at the intersection of radical visual direction and deep software engineering. We design and ship flagship interactive websites, custom full-stack software platforms, and autonomous AI systems that replace manual workflows.',
  },
  {
    q: 'How fast do you move from concept to launch?',
    a: 'A flagship interactive website or product launch typically ships in four to six weeks. Custom software platforms and production AI automation pipelines are delivered in focused two-week engineering sprints with live staging from week one.',
  },
  {
    q: 'Do you work with early-stage founders or established brands?',
    a: 'Both. What matters to us is ambition: whether you are a newly funded technical founder needing an unforgettable category launch, or an established company modernizing your product and operations with AI.',
  },
  {
    q: 'How are projects priced?',
    a: 'Every engagement is scoped as a transparent fixed fee or dedicated monthly product partnership—never unpredictable hourly billing. Book a 20-minute discovery call and we will send a clear architectural scope within 24 hours.',
  },
];
