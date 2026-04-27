export type Lang = 'ar' | 'en';

const translations = {
  ar: {
    dir: 'rtl' as const,
    nav: {
      pricing: 'الأسعار',
      login: 'تسجيل الدخول',
      tryFree: 'جرّب مجاناً',
      blog: 'المدونة',
    },
    hero: {
      eyebrow: 'نظام الطلبات والفواتير للبيع عبر واتساب',
      headline: 'بع على واتساب بشكل احترافي.',
      subtext:
        'طلب يحوّل محادثات واتساب إلى طلبات، فواتير، وتأكيد دفع تلقائي — كل شيء في مكان واحد، بدون فوضى.',
      ctaPrimary: 'ابدأ مجاناً',
      ctaHow: 'شوف كيف يشتغل',
      pill1: 'مجاني بدون بطاقة بنكية',
      pill2: 'جاهز في أقل من ١٠ دقائق',
      pill3: 'بدون اتصال مبيعات',
      proof1Title: 'تسجيل الطلبات',
      proof1Desc: 'سجّل كل طلب من المحادثة مباشرة',
      proof2Title: 'فاتورة فورية',
      proof2Desc: 'أنشئ فاتورة PDF وأرسلها بضغطة واحدة',
      proof3Title: 'تأكيد الدفع',
      proof3Desc: 'رفع إثبات الدفع + مطابقة تلقائية بالذكاء الاصطناعي',
    },
    signalCards: {
      useCaseTitle: 'مناسب لـ',
      useCases: [
        'البائعين الصغار والمتاجر عبر واتساب',
        'من يبيع ملابس، عطور، أكل، أو أي منتج عبر الشات',
        'كل بائع يتعب من الفوضى ومتابعة الطلبات يدوياً',
      ],
      featuresTitle: 'الميزات المتاحة الآن',
      features: [
        'سجّل طلب العميل مباشرة من المحادثة وتتبّع حالته.',
        'أنشئ فاتورة بشعارك وأرسلها عبر واتساب خلال ثوانٍ.',
        'اقبل إثبات الدفع واتركه للنظام يتحقق منه تلقائياً.',
      ],
    },
    steps: {
      heading: 'جاهز في أقل من ١٠ دقائق',
      sub: 'بدون مطوّر، بدون تعقيد. ربط، إعداد، بيع.',
      items: [
        {
          n: '١',
          title: 'اربط رقم واتساب',
          desc: 'امسح رمز QR من لوحة التحكم. رقمك يصبح جاهزاً في أقل من دقيقتين.',
        },
        {
          n: '٢',
          title: 'سجّل الطلب وأرسل الفاتورة',
          desc: 'أنشئ طلباً من المحادثة، وأرسل فاتورة PDF احترافية للعميل مباشرة عبر واتساب.',
        },
        {
          n: '٣',
          title: 'تأكيد الدفع تلقائياً',
          desc: 'العميل يرسل إثبات الدفع، والنظام يتحقق منه ويطابقه مع الفاتورة بالذكاء الاصطناعي.',
        },
      ],
    },
    why: {
      heading: 'ليش البائعين يختارون طلب',
      sub: 'مبني خصيصاً لمن يبيع عبر واتساب — مش أداة معقدة تحتاج أسابيع للإعداد.',
      card1Title: 'ما تفقد طلباً واحداً',
      card1Desc:
        'كل طلب مسجّل بالاسم والمبلغ والحالة. ودّع الفوضى والملاحظات اليدوية.',
      card2Title: 'فاتورة احترافية في ثوانٍ',
      card2Desc:
        'فاتورة بشعارك وبياناتك، ترسلها مباشرة من واتساب — بدون Excel وبدون تصميم.',
      card3Title: 'تأكيد الدفع بدون جهد',
      card3Desc:
        'العميل يرسل صورة الحوالة أو لقطة الشاشة، والنظام يستخرج المبلغ ويطابقه تلقائياً.',
    },
    painPoints: {
      heading: 'إذا هذا يشبه وضعك، طلب صُمِّم لأجلك',
      items: [
        {
          title: 'تضيّع الطلبات بين الرسائل',
          desc: 'عميل يطلب، أنت تنسى، أو ما لقيت المحادثة القديمة. ما في نظام يتتبع الطلبات.',
        },
        {
          title: 'تكتب الفاتورة يدوياً كل مرة',
          desc: 'صورة من التصميم أو ملف Excel لكل عميل. يستغرق وقتاً ويعطي انطباعاً غير احترافي.',
        },
        {
          title: 'ما تعرف إذا دفع العميل أو لا',
          desc: 'ترجع تسأل العميل، تراجع الحوالات يدوياً، وتضيّع وقتك في متابعة كل طلب.',
        },
      ],
    },
    pricing: {
      heading: 'الأسعار واضحة ومباشرة',
      sub: 'ابدأ مجاناً، وترقّى متى ما احتجت. بدون عقود، إلغاء في أي وقت.',
      ctaCard: 'ابدأ من هنا',
      footnote: '* سياسة الاستخدام العادل سارية. ليس للرسائل الإعلانية المزعجة.',
      plans: [
        {
          code: 'free',
          name: 'مجاني',
          price: '$0',
          caption: 'جرّبه بدون تكلفة. رقم واتساب واحد، مناسب للتجربة.',
          quota: 'رقم واتساب واحد',
          features: [
            '٥٠ طلب شهرياً',
            'إنشاء الفواتير',
            'رفع إثبات الدفع',
            '١٠ عمليات OCR شهرياً',
          ],
          missing: ['برندينج الفاتورة', 'OCR غير محدود', 'أعضاء متعددون'],
        },
        {
          code: 'pro',
          name: 'احترافي',
          price: '$9',
          caption: 'للبائعين النشطين الذين يحتاجون طلبات وفواتير غير محدودة.',
          quota: 'رقم واتساب واحد',
          features: [
            'طلبات غير محدودة',
            'فاتورة بشعارك وبياناتك',
            '٣٠٠ عملية OCR شهرياً',
            '٣ أعضاء في الفريق',
            'تصدير بيانات المبيعات',
          ],
          featured: true,
        },
        {
          code: 'team',
          name: 'فريق',
          price: '$19',
          caption: 'لفرق المبيعات أو المتاجر متعددة الأرقام.',
          quota: '٣ أرقام واتساب',
          features: [
            'طلبات غير محدودة',
            'فاتورة بشعارك وبياناتك',
            'OCR غير محدود',
            '١٠ أعضاء في الفريق',
            'تقارير مالية شهرية',
            'إضافات OCR متاحة',
          ],
        },
      ],
    },
    faq: {
      heading: 'أسئلة شائعة',
      sub: 'لو ما وجدت إجابتك، راسلنا مباشرة.',
      items: [
        {
          q: 'هل الخطة المجانية مجانية فعلاً؟',
          a: 'نعم، مجانية تماماً بدون بطاقة بنكية. مناسبة لتجربة النظام قبل الترقية.',
        },
        {
          q: 'كيف يعمل تأكيد الدفع التلقائي؟',
          a: 'العميل يرسل صورة إثبات الدفع (حوالة أو لقطة شاشة). النظام يستخرج المبلغ والتاريخ ورقم المرجع بالذكاء الاصطناعي، ويطابقه مع الفاتورة. إذا تطابق، يُغلق الطلب تلقائياً أو يُرفع للمراجعة.',
        },
        {
          q: 'هل يعمل مع أي رقم واتساب؟',
          a: 'نعم، يعمل مع أي رقم واتساب عبر ربط بسيط بمسح رمز QR. لا يحتاج واتساب للأعمال الرسمي.',
        },
        {
          q: 'هل بياناتي وبيانات عملائي آمنة؟',
          a: 'بياناتك تبقى في حسابك فقط. لا نشاركها ولا نبيعها. يمكنك تصدير أو حذف بياناتك في أي وقت.',
        },
        {
          q: 'هل أستطيع الإلغاء في أي وقت؟',
          a: 'نعم. لا عقود. يمكنك الإلغاء من لوحة التحكم في أي وقت — تظل تستخدم الخدمة حتى نهاية فترة الفاتورة.',
        },
        {
          q: 'هل يمكنني التسجيل مباشرة من هنا؟',
          a: 'نعم. اضغط "ابدأ مجاناً" وستنتقل مباشرة لصفحة التسجيل بدون اتصال مبيعات.',
        },
      ],
    },
    testimonials: {
      heading: 'قصص بائعين يستخدمون طلب',
      sub: 'من متاجر الملابس لفرق المبيعات — بائعون استبدلوا الفوضى بنظام.',
      items: [
        {
          name: 'متجر عطور، الرياض',
          quote: 'قبل طلب كنت أنسى طلبات كثيرة. الحين كل طلب مسجّل وأرسل الفاتورة بضغطة واحدة. وفّر عليّ ساعة يومياً.',
        },
        {
          name: 'بائعة ملابس نسائية، دبي',
          quote: 'عملائي يرسلون إثبات الدفع والنظام يتحقق منه تلقائياً. ما صرت أراجع الحوالات يدوياً بعد اليوم.',
        },
        {
          name: 'متجر منتجات غذائية، الكويت',
          quote: 'الفاتورة الاحترافية غيّرت انطباع عملائي. يقولون يشبه متجر حقيقي. وهذا صح.',
        },
      ],
    },
    closing: {
      eyebrow: 'جاهز تبدأ؟',
      headline: 'سجّل مجاناً، اربط رقمك، وسجّل أول طلب اليوم.',
      sub: 'بدون بطاقة بنكية. بدون اتصال مبيعات. بدون عقود.',
      ctaPrimary: 'ابدأ مجاناً',
      ctaSecondary: 'شوف الأسعار',
    },
    footer: {
      rights: 'جميع الحقوق محفوظة',
      terms: 'الشروط والأحكام',
      privacy: 'سياسة الخصوصية',
      refund: 'سياسة الاسترداد',
      faq: 'الأسئلة الشائعة',
      support: 'الدعم الفني',
      blog: 'المدونة',
    },
  },

  en: {
    dir: 'ltr' as const,
    nav: {
      pricing: 'Pricing',
      login: 'Log In',
      tryFree: 'Try Free',
      blog: 'Blog',
    },
    hero: {
      eyebrow: 'WhatsApp order, invoice & payment system',
      headline: 'Sell on WhatsApp professionally.',
      subtext:
        'Talab turns WhatsApp chats into orders, invoices, and verified payments — everything in one place, no more chaos.',
      ctaPrimary: 'Start Free',
      ctaHow: 'See how it works',
      pill1: 'Free, no credit card',
      pill2: 'Ready in under 10 minutes',
      pill3: 'No sales call',
      proof1Title: 'Order capture',
      proof1Desc: 'Log every order directly from the chat',
      proof2Title: 'Instant invoice',
      proof2Desc: 'Generate a PDF invoice and send it in one click',
      proof3Title: 'Payment verification',
      proof3Desc: 'Upload payment proof + AI auto-matching',
    },
    signalCards: {
      useCaseTitle: 'Built for',
      useCases: [
        'Small sellers and WhatsApp stores',
        'Anyone selling clothes, perfume, food, or any product via chat',
        'Every seller tired of chaos and manually tracking orders',
      ],
      featuresTitle: 'Available now',
      features: [
        'Log a customer order directly from the chat and track its status.',
        'Create a branded invoice and send it via WhatsApp in seconds.',
        'Accept payment proof and let the system verify it automatically.',
      ],
    },
    steps: {
      heading: 'Ready in under 10 minutes',
      sub: 'No developer needed, no complexity. Connect, set up, sell.',
      items: [
        {
          n: '1',
          title: 'Connect your WhatsApp number',
          desc: 'Scan a QR code from the dashboard. Your number is live in under 2 minutes.',
        },
        {
          n: '2',
          title: 'Log the order and send the invoice',
          desc: 'Create an order from the chat and send a professional PDF invoice directly via WhatsApp.',
        },
        {
          n: '3',
          title: 'Auto-verify payment',
          desc: 'Customer sends payment proof. The system extracts the amount and matches it to the invoice automatically.',
        },
      ],
    },
    why: {
      heading: 'Why sellers choose Talab',
      sub: 'Built specifically for WhatsApp sellers — not a complex tool that takes weeks to set up.',
      card1Title: 'Never lose an order',
      card1Desc:
        'Every order logged with name, amount, and status. Say goodbye to chaos and manual notes.',
      card2Title: 'Professional invoice in seconds',
      card2Desc:
        'An invoice with your logo and details, sent directly from WhatsApp — no Excel, no design work.',
      card3Title: 'Payment verification without effort',
      card3Desc:
        'Customer sends a screenshot of the transfer. The system extracts the amount and matches it automatically.',
    },
    painPoints: {
      heading: 'If this sounds familiar, Talab was built for you',
      items: [
        {
          title: 'Orders lost in messages',
          desc: "A customer orders, you forget, or you can't find the old conversation. No system to track orders.",
        },
        {
          title: 'Writing invoices manually every time',
          desc: 'A design screenshot or an Excel file for every customer. It takes time and gives an unprofessional impression.',
        },
        {
          title: "Not knowing if the customer paid",
          desc: 'You go back and ask the customer, manually check transfers, and waste time following up on every order.',
        },
      ],
    },
    pricing: {
      heading: 'Clear, straightforward pricing',
      sub: 'Start free, upgrade when you need it. No contracts, cancel anytime.',
      ctaCard: 'Get started',
      footnote: '* Fair use policy applies. Not for mass spam.',
      plans: [
        {
          code: 'free',
          name: 'Free',
          price: '$0',
          caption: 'Try at no cost. 1 WhatsApp number, great for testing.',
          quota: '1 WhatsApp number',
          features: [
            '50 orders/month',
            'Invoice generation',
            'Payment proof upload',
            '10 OCR/month',
          ],
          missing: ['Invoice branding', 'Unlimited OCR', 'Multiple members'],
        },
        {
          code: 'pro',
          name: 'Pro',
          price: '$9',
          caption: 'For active sellers who need unlimited orders and invoices.',
          quota: '1 WhatsApp number',
          features: [
            'Unlimited orders',
            'Branded invoices',
            '300 OCR/month',
            '3 team members',
            'Sales data export',
          ],
          featured: true,
        },
        {
          code: 'team',
          name: 'Team',
          price: '$19',
          caption: 'For sales teams or stores with multiple numbers.',
          quota: '3 WhatsApp numbers',
          features: [
            'Unlimited orders',
            'Branded invoices',
            'Unlimited OCR',
            '10 team members',
            'Monthly financial reports',
            'Extra OCR add-ons available',
          ],
        },
      ],
    },
    faq: {
      heading: 'Common questions',
      sub: "If you don't find your answer, reach out directly.",
      items: [
        {
          q: 'Is the free plan really free?',
          a: 'Yes, completely free with no credit card. Great for testing the system before upgrading.',
        },
        {
          q: 'How does automatic payment verification work?',
          a: 'The customer sends a payment proof image (bank transfer or screenshot). The system uses AI to extract the amount, date, and reference number, then matches it to the invoice. If matched, the order closes automatically or is flagged for review.',
        },
        {
          q: 'Does it work with any WhatsApp number?',
          a: 'Yes, it works with any WhatsApp number via a simple QR code scan link. No official WhatsApp Business API required.',
        },
        {
          q: 'Is my data and customer data safe?',
          a: 'Your data stays in your account only. We do not share or sell it. You can export or delete your data at any time.',
        },
        {
          q: 'Can I cancel anytime?',
          a: 'Yes. No contracts. Cancel from the dashboard at any time — you keep access until the end of your billing period.',
        },
        {
          q: 'Can I sign up directly from here?',
          a: 'Yes. Click "Start Free" and you\'ll go straight to the registration page — no sales call needed.',
        },
      ],
    },
    testimonials: {
      heading: 'Stories from sellers using Talab',
      sub: 'From clothing stores to sales teams — sellers who replaced chaos with a system.',
      items: [
        {
          name: 'Perfume store, Riyadh',
          quote: "Before Talab I'd forget many orders. Now every order is logged and I send the invoice in one click. It saves me an hour every day.",
        },
        {
          name: "Women's clothing seller, Dubai",
          quote: 'My customers send payment proof and the system verifies it automatically. I no longer manually check transfers.',
        },
        {
          name: 'Food products store, Kuwait',
          quote: 'The professional invoice changed my customers\' impression. They say it feels like a real store. And they\'re right.',
        },
      ],
    },
    closing: {
      eyebrow: 'Ready to start?',
      headline: 'Sign up free, connect your number, and log your first order today.',
      sub: 'No credit card. No sales call. No contracts.',
      ctaPrimary: 'Start Free',
      ctaSecondary: 'See pricing',
    },
    footer: {
      rights: 'All rights reserved',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      refund: 'Refund Policy',
      faq: 'FAQ',
      support: 'Email Support',
      blog: 'Blog',
    },
  },
} as const;

export type Translations = typeof translations.ar;

export function t(lang: Lang): Translations {
  return translations[lang] as unknown as Translations;
}
