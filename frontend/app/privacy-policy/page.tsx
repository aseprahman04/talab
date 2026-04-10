import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — WATether',
  description: 'Privacy policy and data protection for WATether users.',
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link">← Back to home</Link>
        <h1>Privacy Policy</h1>
        <p className="legal-meta">Last updated: March 30, 2026</p>
      </header>

      <main className="legal-body">
        <section>
          <h2>1. Data We Collect</h2>
          <p>We collect the following data when you use WATether:</p>
          <ul>
            <li><strong>Account data:</strong> Name, email address, and (optionally) a Google account for login</li>
            <li><strong>Workspace data:</strong> Workspace name, device configuration, and integration settings</li>
            <li><strong>Message data:</strong> Message delivery logs required for operations and debugging</li>
            <li><strong>Technical data:</strong> IP address, user agent, and access logs for security purposes</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Data</h2>
          <p>The data collected is used to:</p>
          <ul>
            <li>Provide and improve the Service</li>
            <li>Verify identity and secure accounts</li>
            <li>Process payments and subscriptions</li>
            <li>Send important account notifications</li>
            <li>Comply with applicable legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>3. Sharing Data with Third Parties</h2>
          <p>We do not sell your personal data. Data may be shared with:</p>
          <ul>
            <li><strong>LemonSqueezy:</strong> For payment and subscription processing</li>
            <li><strong>Infrastructure providers:</strong> Servers and databases we use to run the Service</li>
            <li><strong>Authorities:</strong> If required by law or court order</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We apply industry-standard security measures, including data encryption in transit (HTTPS/TLS), password hashing, database-backed session tokens, and role-based access controls.</p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>Data is retained while your account is active and for up to 30 days after account deletion, unless legally required to be kept longer. Technical logs are retained for a maximum of 90 days.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data in a machine-readable format</li>
          </ul>
          <p>To exercise these rights, contact <a href="mailto:support@watether.com">support@watether.com</a>.</p>
        </section>

        <section>
          <h2>7. Cookies and Sessions</h2>
          <p>We use HTTP-only cookies for login session management. These cookies are not accessible by JavaScript and are used solely for authentication. We do not use third-party tracking cookies.</p>
        </section>

        <section>
          <h2>8. Policy Changes</h2>
          <p>Material changes to this policy will be communicated via email at least 14 days before they take effect.</p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>Privacy questions: <a href="mailto:support@watether.com">support@watether.com</a></p>
        </section>
      </main>

      <footer className="legal-footer">
        <Link href="/terms">Terms of Service</Link>
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
