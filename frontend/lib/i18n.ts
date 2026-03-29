export type Lang = 'id' | 'en';

const translations = {
  id: {
    // Nav
    nav: {
      seePricing: 'Lihat Paket',
      enterConsole: 'Masuk Console',
    },

    // Landing hero
    hero: {
      eyebrow: 'WhatsApp gateway untuk bisnis Indonesia',
      headline: 'Kirim pesan, kelola device, dan otomasi notifikasi dari satu console.',
      subtext:
        'WATether memudahkan tim kamu mengelola pengiriman pesan WhatsApp — dari broadcast ke ribuan kontak, auto reply keyword, hingga webhook real-time ke sistem internal.',
      ctaPrimary: 'Mulai Gratis',
      ctaDemo: 'Request demo',
      ctaFeatures: 'Lihat fitur',
      pill1: 'Gratis, tanpa kartu kredit',
      pill2: 'Setup dalam hitungan menit',
      pill3: 'Tidak perlu sales call',
      proof1Title: 'Multi-workspace',
      proof1Desc: 'Pisahkan tim, device, dan log per workspace',
      proof2Title: 'Queue & retry',
      proof2Desc: 'Pesan gagal otomatis dicoba ulang',
      proof3Title: 'Realtime',
      proof3Desc: 'Status device dan pesan tampil langsung',
    },

    // Signal cards
    signalCards: {
      useCaseTitle: 'Cocok untuk',
      useCases: [
        'Konfirmasi order marketplace dan toko online',
        'Notifikasi invoice, cicilan, dan reminder pembayaran',
        'Follow-up lead dari form, iklan, atau CRM',
      ],
      featuresTitle: 'Yang sudah tersedia',
      features: [
        'Kirim pesan ke banyak kontak sekaligus lewat broadcast terjadwal.',
        'Auto reply otomatis saat ada pesan masuk — tanpa perlu operator standby.',
        'Webhook real-time ke sistem kamu saat pesan terkirim, gagal, atau diterima.',
      ],
    },

    // Why section
    why: {
      heading: 'Kenapa tim Indonesia pilih WATether',
      subtext:
        'Dibangun untuk alur kerja yang memang umum di sini — bukan gateway generik yang perlu banyak konfigurasi manual.',
      card1Title: 'Mulai kecil, scale bertahap',
      card1Desc:
        'Coba dengan volume kecil, validasi alur operasional tim, lalu upgrade saat device dan kuota perlu ditambah.',
      card2Title: 'Bahasa dan use case lokal',
      card2Desc:
        'Paket dan fitur dirancang untuk UMKM, tim CS, reminder pembayaran, dan workflow bisnis Indonesia.',
      card3Title: 'Console siap pakai hari ini',
      card3Desc:
        'Daftar dan langsung akses dashboard dengan device management, broadcast, webhook, dan auto reply.',
    },

    // Pricing
    pricing: {
      heading: 'Harga per nomor WhatsApp, bukan per pesan',
      subtext:
        'Bayar sesuai jumlah nomor WA yang kamu pakai. Mulai gratis, upgrade kapan saja tanpa kontrak.',
      ctaCard: 'Mulai dari sini',
      footnote: '* Fair use policy berlaku. Tidak untuk spam massal.',
    },

    // Testimonials
    trust: {
      heading: 'Dipakai untuk operasional nyata',
      subtext:
        'Dari toko online sampai tim collection — WATether digunakan untuk alur kerja yang berulang setiap hari.',
    },

    // Disclaimer
    disclaimer: {
      eyebrow: 'Penting dibaca sebelum mulai',
      body: 'WATether adalah platform gateway — bukan produk resmi Meta atau WhatsApp Inc. Penggunaan nomor WhatsApp pribadi atau bisnis untuk pengiriman massal berpotensi terkena pembatasan atau pemblokiran oleh WhatsApp. Segala risiko ban, pembatasan fitur, atau penonaktifan nomor sepenuhnya di luar tanggung jawab WATether. Gunakan dengan bijak sesuai kebijakan WhatsApp.',
      cta: 'Saya mengerti, mulai gratis',
    },

    // FAQ
    faq: {
      heading: 'Pertanyaan yang sering masuk',
      subtext:
        'Kalau ada yang belum terjawab di sini, langsung hubungi kami.',
      items: [
        {
          q: 'Apakah paket Gratis benar-benar gratis?',
          a: 'Ya, gratis tanpa kartu kredit. Cocok untuk coba alur kirim pesan, webhook, dan console sebelum memutuskan upgrade.',
        },
        {
          q: 'Apakah bisa langsung daftar dari sini?',
          a: 'Bisa. Klik tombol "Mulai Gratis" dan kamu langsung masuk ke halaman register console tanpa perlu sales call dulu.',
        },
        {
          q: 'Apakah ini sudah official WhatsApp API?',
          a: 'Belum. WATether adalah gateway layer — queue, webhook, device management, dan dashboard sudah siap. Engine sesi WhatsApp bisa diintegrasikan sesuai kebutuhan tim kamu.',
        },
      ],
    },

    // Closing
    closing: {
      eyebrow: 'Siap mulai?',
      headline: 'Daftar gratis, masuk console, dan kirim pesan pertama hari ini.',
      subtext: 'Tidak perlu kartu kredit. Tidak perlu sales call. Langsung coba sendiri.',
      ctaPrimary: 'Mulai Gratis',
      ctaSecondary: 'Lihat paket',
    },

    // Console auth
    auth: {
      eyebrow: 'WATether Console',
      headline: 'Kelola nomor WhatsApp, kirim pesan, dan otomasi notifikasi bisnis kamu.',
      subtext: 'Broadcast, auto reply, webhook, dan log pesan — semua dalam satu dashboard.',
      metric1Label: 'Nomor WA',
      metric1Value: 'Per workspace',
      metric2Label: 'Fitur',
      metric2Value: 'Broadcast · Auto Reply · Webhook',
      metric3Label: 'Paket',
      metric3Value: 'Gratis untuk mulai',
      registerTitle: 'Mulai gratis sekarang',
      registerDesc: 'Buat akun, hubungkan nomor WhatsApp pertama kamu, dan mulai kirim pesan dalam hitungan menit.',
      loginTitle: 'Masuk ke console',
      loginDesc: 'Lanjutkan pengelolaan device dan workspace kamu.',
      nameLabel: 'Nama',
      namePlaceholder: 'Nama lengkap',
      emailLabel: 'Email',
      emailPlaceholder: 'kamu@email.com',
      passLabel: 'Password',
      passPlaceholder: 'Min. 8 karakter',
      submitRegister: 'Buat Akun Gratis',
      submitLogin: 'Masuk',
      loading: 'Memproses...',
      switchToRegister: 'Belum punya akun? Daftar gratis',
      switchToLogin: 'Sudah punya akun? Masuk',
    },
  },

  en: {
    // Nav
    nav: {
      seePricing: 'See Pricing',
      enterConsole: 'Open Console',
    },

    // Landing hero
    hero: {
      eyebrow: 'WhatsApp gateway for Indonesian businesses',
      headline: 'Send messages, manage devices, and automate notifications from one console.',
      subtext:
        'WATether makes it easy for your team to manage WhatsApp message delivery — from broadcast to thousands of contacts, keyword auto reply, to real-time webhooks into your internal systems.',
      ctaPrimary: 'Start Free',
      ctaDemo: 'Request demo',
      ctaFeatures: 'See features',
      pill1: 'Free, no credit card',
      pill2: 'Set up in minutes',
      pill3: 'No sales call needed',
      proof1Title: 'Multi-workspace',
      proof1Desc: 'Separate teams, devices, and logs per workspace',
      proof2Title: 'Queue & retry',
      proof2Desc: 'Failed messages are retried automatically',
      proof3Title: 'Realtime',
      proof3Desc: 'Device and message status shown instantly',
    },

    // Signal cards
    signalCards: {
      useCaseTitle: 'Built for',
      useCases: [
        'Order confirmations for marketplaces and online stores',
        'Invoice notifications, installment reminders, and payment alerts',
        'Lead follow-up from forms, ads, or CRM',
      ],
      featuresTitle: 'Already available',
      features: [
        'Send messages to many contacts at once via scheduled broadcast.',
        'Auto reply when messages arrive — no operator needed on standby.',
        'Real-time webhook to your system when messages are sent, failed, or received.',
      ],
    },

    // Why section
    why: {
      heading: 'Why teams choose WATether',
      subtext:
        'Built for workflows that are common here — not a generic gateway that needs extensive manual configuration.',
      card1Title: 'Start small, scale gradually',
      card1Desc:
        'Try with small volume, validate team operations, then upgrade when devices and quota need to grow.',
      card2Title: 'Local language and use cases',
      card2Desc:
        'Plans and features are designed for SMEs, CS teams, payment reminders, and Indonesian business workflows.',
      card3Title: 'Console ready to use today',
      card3Desc:
        'Sign up and immediately access the dashboard with device management, broadcast, webhooks, and auto reply.',
    },

    // Pricing
    pricing: {
      heading: 'Priced per WhatsApp number, not per message',
      subtext:
        'Pay based on how many WA numbers you use. Start free, upgrade anytime with no contract.',
      ctaCard: 'Get started',
      footnote: '* Fair use policy applies. Not for mass spam.',
    },

    // Testimonials
    trust: {
      heading: 'Used in real operations',
      subtext:
        'From online stores to collection teams — WATether is used for workflows that happen every single day.',
    },

    // Disclaimer
    disclaimer: {
      eyebrow: 'Important — please read before you start',
      body: 'WATether is a gateway platform — not an official product of Meta or WhatsApp Inc. Using personal or business WhatsApp numbers for bulk sending may result in restrictions or bans by WhatsApp. Any risk of account bans, feature restrictions, or number deactivation is entirely outside WATether\'s responsibility. Use responsibly and in accordance with WhatsApp\'s policies.',
      cta: 'I understand, start free',
    },

    // FAQ
    faq: {
      heading: 'Frequently asked questions',
      subtext: 'If anything is still unclear, feel free to reach out.',
      items: [
        {
          q: 'Is the Free plan really free?',
          a: 'Yes, free with no credit card required. Perfect for testing message flows, webhooks, and the console before deciding to upgrade.',
        },
        {
          q: 'Can I sign up directly from here?',
          a: 'Yes. Click "Start Free" and you\'ll be taken straight to the console registration page — no sales call needed.',
        },
        {
          q: 'Is this an official WhatsApp API?',
          a: 'Not yet. WATether is a gateway layer — queue, webhooks, device management, and dashboard are all ready. The WhatsApp session engine can be integrated based on your team\'s needs.',
        },
      ],
    },

    // Closing
    closing: {
      eyebrow: 'Ready to start?',
      headline: 'Sign up free, open the console, and send your first message today.',
      subtext: 'No credit card. No sales call. Try it yourself right now.',
      ctaPrimary: 'Start Free',
      ctaSecondary: 'See pricing',
    },

    // Console auth
    auth: {
      eyebrow: 'WATether Console',
      headline: 'Manage WhatsApp numbers, send messages, and automate your business notifications.',
      subtext: 'Broadcast, auto reply, webhooks, and message logs — all in one dashboard.',
      metric1Label: 'WA Numbers',
      metric1Value: 'Per workspace',
      metric2Label: 'Features',
      metric2Value: 'Broadcast · Auto Reply · Webhook',
      metric3Label: 'Plan',
      metric3Value: 'Free to start',
      registerTitle: 'Start for free',
      registerDesc: 'Create an account, connect your first WhatsApp number, and start sending messages in minutes.',
      loginTitle: 'Sign in to console',
      loginDesc: 'Continue managing your devices and workspaces.',
      nameLabel: 'Name',
      namePlaceholder: 'Full name',
      emailLabel: 'Email',
      emailPlaceholder: 'you@email.com',
      passLabel: 'Password',
      passPlaceholder: 'Min. 8 characters',
      submitRegister: 'Create Free Account',
      submitLogin: 'Sign In',
      loading: 'Processing...',
      switchToRegister: "Don't have an account? Sign up free",
      switchToLogin: 'Already have an account? Sign in',
    },
  },
} as const;

export type Translations = typeof translations.id;

export function t(lang: Lang): Translations {
  return translations[lang] as unknown as Translations;
}
