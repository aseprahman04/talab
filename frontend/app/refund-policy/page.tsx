import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — WATether',
  description: 'Refund policy for WATether subscriptions.',
};

export default function RefundPolicyPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link">← Back to home</Link>
        <h1>Refund Policy</h1>
        <p className="legal-meta">Last updated: March 30, 2026</p>
      </header>

      <main className="legal-body">
        <section>
          <h2>1. Free Trial</h2>
          <p>All new users get access to the Free plan indefinitely, with no credit card required. We recommend trying the Service before subscribing to a paid plan.</p>
        </section>

        <section>
          <h2>2. Refund Policy</h2>
          <p>WATether offers a <strong>7-day</strong> refund policy for all new paid plan subscriptions. Conditions apply:</p>
          <ul>
            <li>Request submitted within 7 calendar days of the first payment date</li>
            <li>Request sent via email to <a href="mailto:support@watether.com">support@watether.com</a></li>
            <li>No prior refund has been requested for the same account</li>
          </ul>
        </section>

        <section>
          <h2>3. Subscription Renewals</h2>
          <p>Automatic renewals are <strong>non-refundable</strong> unless a significant service disruption (downtime &gt;24 consecutive hours) is documented during that period.</p>
        </section>

        <section>
          <h2>4. Exclusions</h2>
          <p>Refunds <strong>do not apply</strong> to:</p>
          <ul>
            <li>Accounts found to be in violation of the Terms of Service</li>
            <li>Requests made more than 7 days after payment</li>
            <li>WhatsApp number restrictions (a risk disclosed in the Terms of Service)</li>
          </ul>
        </section>

        <section>
          <h2>5. Refund Process</h2>
          <p>Once a request is approved:</p>
          <ul>
            <li>Funds are returned to the original payment method within <strong>5–10 business days</strong></li>
            <li>Access to paid features is revoked immediately once the refund is processed</li>
          </ul>
        </section>

        <section>
          <h2>6. Subscription Cancellation</h2>
          <p>You may cancel your subscription at any time via the Billing page in the console or by contacting support. Access remains active until the end of the paid period. Cancellation does not produce a refund for the remaining period.</p>
        </section>

        <section>
          <h2>7. How to Request a Refund</h2>
          <p>Send an email to <a href="mailto:support@watether.com">support@watether.com</a> with the subject <strong>&quot;Refund Request — [account email]&quot;</strong> and include:</p>
          <ul>
            <li>WATether account email</li>
            <li>LemonSqueezy order number</li>
            <li>Reason for the refund request</li>
          </ul>
          <p>We will respond within 1 business day.</p>
        </section>
      </main>

      <footer className="legal-footer">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy-policy">Privacy Policy</Link>
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
