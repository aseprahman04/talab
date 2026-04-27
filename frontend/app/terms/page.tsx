import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Talab',
  description: 'Terms and conditions for using the Talab service.',
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link">← Back to home</Link>
        <h1>Terms of Service</h1>
        <p className="legal-meta">Last updated: March 30, 2026</p>
      </header>

      <main className="legal-body">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using the Talab service (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
        </section>

        <section>
          <h2>2. Service Description</h2>
          <p>Talab is a WhatsApp gateway platform that provides a device management interface, message delivery, webhooks, broadcast, and auto-reply for business purposes. Talab is not an official product of Meta Platforms, Inc. or WhatsApp LLC.</p>
        </section>

        <section>
          <h2>3. Permitted Use</h2>
          <p>You are permitted to use the Service for legitimate business purposes, including:</p>
          <ul>
            <li>Sending transaction notifications and customer service messages</li>
            <li>Managing team communications through registered devices</li>
            <li>Integrating the Service with internal systems via API and webhooks</li>
          </ul>
        </section>

        <section>
          <h2>4. Prohibited Use</h2>
          <p>You are prohibited from using the Service to:</p>
          <ul>
            <li>Send unsolicited bulk messages (spam)</li>
            <li>Engage in fraudulent, phishing, or unlawful activities</li>
            <li>Violate WhatsApp&apos;s Terms of Service</li>
            <li>Distribute harmful content or content that infringes third-party rights</li>
          </ul>
        </section>

        <section>
          <h2>5. Account and Security</h2>
          <p>You are fully responsible for the security of your account and all activities conducted through it. Contact us immediately if unauthorized access occurs.</p>
        </section>

        <section>
          <h2>6. WhatsApp Number Risk</h2>
          <p>Using WhatsApp numbers through third-party tools may result in restrictions, blocks, or permanent bans by WhatsApp. All such risks are entirely the user&apos;s responsibility. Talab is not liable for any number restrictions arising from use of the Service.</p>
        </section>

        <section>
          <h2>7. Subscriptions and Payments</h2>
          <p>Subscriptions are processed through LemonSqueezy. By subscribing, you agree to the applicable pricing and billing cycle. You may cancel at any time; access will remain active until the end of the paid period.</p>
        </section>

        <section>
          <h2>8. Refund Policy</h2>
          <p>See our <Link href="/refund-policy">Refund Policy</Link> for full details.</p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>The Service is provided &quot;as is&quot;. Talab does not guarantee 100% uptime without interruption. To the extent permitted by applicable law, Talab is not liable for indirect, incidental, or consequential damages.</p>
        </section>

        <section>
          <h2>10. Changes to Terms</h2>
          <p>We may update these Terms of Service at any time. Changes will be communicated via email or platform notification. Continued use after changes constitutes acceptance of the updated terms.</p>
        </section>

        <section>
          <h2>11. Governing Law</h2>
          <p>These Terms of Service are governed by applicable law. Disputes shall be resolved through mutual agreement, and if not reached, through the competent courts.</p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>Questions about these Terms of Service: <a href="mailto:support@talab.app">support@talab.app</a></p>
        </section>
      </main>

      <footer className="legal-footer">
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/refund-policy">Refund Policy</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/">Home</Link>
      </footer>

      <style>{`
        .legal-page { max-width: 720px; margin: 0 auto; padding: 48px 24px; font-family: var(--font-body, sans-serif); color: #1a1a1a; line-height: 1.7; }
        .legal-header { margin-bottom: 40px; }
        .back-link { color: #6b7280; text-decoration: none; font-size: 14px; }
        .back-link:hover { color: #111; }
        h1 { font-size: 32px; font-weight: 700; margin: 16px 0 8px; }
        .legal-meta { color: #6b7280; font-size: 14px; }
        .legal-body section { margin-bottom: 32px; }
        h2 { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
        p { margin: 0 0 12px; }
        ul { padding-left: 20px; margin: 0 0 12px; }
        li { margin-bottom: 6px; }
        a { color: #2563eb; }
        .legal-footer { border-top: 1px solid #e5e7eb; margin-top: 48px; padding-top: 24px; display: flex; gap: 24px; flex-wrap: wrap; }
        .legal-footer a { color: #6b7280; text-decoration: none; font-size: 14px; }
        .legal-footer a:hover { color: #111; }
      `}</style>
    </div>
  );
}
