import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — WATether',
  description: 'Frequently asked questions about WATether.',
};

const faqs = [
  {
    category: 'General',
    items: [
      {
        q: 'What is WATether?',
        a: 'WATether is a WhatsApp gateway platform for businesses. You can connect WhatsApp numbers, send messages via API, create broadcasts, set up auto-replies, and monitor all activity from a single dashboard.',
      },
      {
        q: 'Is WATether an official WhatsApp product?',
        a: 'No. WATether is a third-party solution that runs on top of WhatsApp Web. Using numbers through third-party tools may result in restrictions by WhatsApp. For an enterprise solution with guarantees, consider the official WhatsApp Business API.',
      },
      {
        q: 'Who is WATether for?',
        a: 'CS teams, sales, and mid-size business operations that need WhatsApp notification automation, broadcast to contact lists, webhooks to internal systems, and multi-device management from one console.',
      },
    ],
  },
  {
    category: 'Account & Subscription',
    items: [
      {
        q: 'Is the Free plan really free forever?',
        a: 'Yes. The Free plan is available indefinitely with 1 device and 1,000 messages per month. No credit card required.',
      },
      {
        q: 'How do I upgrade to a paid plan?',
        a: 'Go to the console, select your workspace, then open the Billing menu. Click "Upgrade now" and you\'ll be directed to the LemonSqueezy checkout page.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'Payments are processed by LemonSqueezy and support major international credit/debit cards (Visa, Mastercard, American Express) and several local payment methods.',
      },
      {
        q: 'Can I cancel my subscription at any time?',
        a: 'Yes. Cancel anytime from the Billing page. Access remains active until the end of the paid period, and there are no cancellation fees.',
      },
    ],
  },
  {
    category: 'Technical',
    items: [
      {
        q: 'How many devices can I connect?',
        a: 'Free plan: 1 device. Business plan: 5 devices. Team plan: 20 devices. Each device connects via QR code scan from the WhatsApp app on your phone.',
      },
      {
        q: 'How do I connect a WhatsApp number?',
        a: 'In the console, open the Devices menu → click "Pair WhatsApp" → scan the QR code that appears using WhatsApp on your phone (Settings → Linked Devices → Link a Device).',
      },
      {
        q: 'Is there an API for integrating with my system?',
        a: 'Yes. WATether provides a full REST API. Documentation is available in the API Docs menu in the console after logging in. You can generate API tokens per device.',
      },
      {
        q: 'What is a webhook and how do I use it?',
        a: 'Webhooks send HTTP notifications to your URL on every event (incoming message, delivery status, etc.). Add a webhook in the Webhooks menu and enter your server endpoint URL.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes. All connections use HTTPS/TLS. Sessions use HTTP-only cookies. Passwords are hashed with Argon2. See the Privacy Policy for full details.',
      },
    ],
  },
  {
    category: 'Support',
    items: [
      {
        q: 'How do I contact support?',
        a: 'Send an email to support@watether.com. We respond within 1 business day.',
      },
      {
        q: 'Is there a refund policy?',
        a: 'Yes, a 7-day refund is available for first-time payments. See the Refund Policy page for full terms.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link">← Back to home</Link>
        <h1>Frequently Asked Questions</h1>
        <p className="legal-meta">Can&apos;t find your answer? Contact <a href="mailto:support@watether.com">support@watether.com</a></p>
      </header>

      <main className="legal-body">
        {faqs.map((section) => (
          <section key={section.category}>
            <h2>{section.category}</h2>
            <div className="faq-list">
              {section.items.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="legal-footer">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/refund-policy">Refund Policy</Link>
        <Link href="/">Home</Link>
      </footer>

      <style>{`
        .legal-page { max-width: 720px; margin: 0 auto; padding: 48px 24px; font-family: var(--font-body, sans-serif); color: #1a1a1a; line-height: 1.7; }
        .legal-header { margin-bottom: 40px; }
        .back-link { color: #6b7280; text-decoration: none; font-size: 14px; }
        .back-link:hover { color: #111; }
        h1 { font-size: 32px; font-weight: 700; margin: 16px 0 8px; }
        .legal-meta { color: #6b7280; font-size: 14px; }
        .legal-body section { margin-bottom: 40px; }
        h2 { font-size: 20px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
        .faq-list { display: flex; flex-direction: column; gap: 2px; }
        .faq-item { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .faq-item summary { padding: 14px 16px; font-weight: 500; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary::after { content: '+'; font-size: 20px; color: #6b7280; flex-shrink: 0; }
        .faq-item[open] summary::after { content: '−'; }
        .faq-item[open] summary { background: #f9fafb; }
        .faq-item p { padding: 0 16px 16px; margin: 0; color: #374151; }
        a { color: #2563eb; }
        .legal-footer { border-top: 1px solid #e5e7eb; margin-top: 48px; padding-top: 24px; display: flex; gap: 24px; flex-wrap: wrap; }
        .legal-footer a { color: #6b7280; text-decoration: none; font-size: 14px; }
        .legal-footer a:hover { color: #111; }
      `}</style>
    </div>
  );
}
