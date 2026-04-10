import Link from 'next/link';

export default function HomePage() {
  const testimonials = [
    {
      name: 'Omni-channel retail store',
      quote: 'Our CS team could use it right away with no lengthy training. Devices, broadcasts, and auto replies are all in one console.',
    },
    {
      name: 'Regional collection team',
      quote: 'Scheduled reminders and webhook logs were something we needed from day one. WATether has both, plus workspace separation per branch.',
    },
    {
      name: 'Property distribution agency',
      quote: 'Sending follow-up messages to prospects used to take half a day. Now the team queues everything in bulk and the messages go out automatically.',
    },
  ];

  const faqs = [
    {
      question: 'Is the Free plan really free?',
      answer: 'Yes, free with no credit card required. Great for testing message flows, broadcast, and the console before deciding to upgrade.',
    },
    {
      question: 'Can I sign up directly from here?',
      answer: 'Yes. Click "Start Free" and you\'ll be taken straight to the console registration page — no sales call needed.',
    },
    {
      question: 'Is this an official WhatsApp API?',
      answer: 'No. WATether uses an open-source WhatsApp session library (not the official Meta Business API). It works with your personal or business WhatsApp number. Be aware that bulk sending via unofficial sessions carries a risk of account restrictions by WhatsApp.',
    },
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      caption: 'Try it at no cost. 1 WA number, great for testing before going to production.',
      quota: '1 WhatsApp number',
      features: [
        '500 messages/month',
        'Send to personal contacts',
        'Scheduled broadcast',
        'Realtime console',
      ],
      missing: ['Auto reply', 'Webhook & API', 'Multiple members'],
    },
    {
      name: 'Business',
      price: '$3',
      caption: 'For businesses that need several active WA numbers at once.',
      quota: '5 WhatsApp numbers',
      features: [
        'Unlimited messages',
        'Send to personal contacts',
        'Scheduled broadcast',
        'Keyword auto reply',
        'Webhook auto reply (call your own endpoint)',
        'Full API access',
        '5 team members',
      ],
      featured: true,
    },
    {
      name: 'Team',
      price: '$10',
      caption: 'For CS teams, sales, or multi-branch operations with many active numbers.',
      quota: '20 WhatsApp numbers',
      features: [
        'Unlimited messages',
        'Send to personal contacts',
        'Scheduled broadcast',
        'Keyword auto reply',
        'Webhook auto reply (call your own endpoint)',
        'Outbound webhooks + delivery log',
        'Full API access',
        '20 team members',
      ],
    },
  ];

  const highlights = [
    'Send messages to many contacts at once via scheduled broadcast.',
    'Auto reply when messages arrive — no operator needed on standby.',
    'Real-time webhook to your system when messages are sent, failed, or received.',
  ];

  return (
    <main className="marketing-shell">
      <section className="marketing-hero">
        <div className="marketing-nav">
          <Link className="brand-lockup" href="/">
            <span className="brand-mark">WA</span>
            <div>
              <strong>WATether</strong>
              <small>WhatsApp gateway for business operations</small>
            </div>
          </Link>
          <div className="button-row">
            <Link className="button-ghost" href="/#pricing">See Pricing</Link>
            <Link className="button-primary" href="/console?mode=login">Open Console</Link>
          </div>
        </div>

        <div className="marketing-grid glass-panel">
          <div className="marketing-copy">
            <span className="eyebrow">WhatsApp gateway for businesses</span>
            <h1>Send messages, manage devices, and automate notifications from one console.</h1>
            <p>
              WATether makes it easy for your team to manage WhatsApp message delivery — from scheduled broadcast
              to your contact list, keyword auto reply, to real-time webhooks into your internal systems.
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href="/console?mode=register">Start Free</Link>
              <a className="button-ghost" href="#demo-form">Request demo</a>
              <a className="button-secondary" href="#features">See features</a>
            </div>
            <div className="helper-strip">
              <span>Free, no credit card</span>
              <span>Set up in minutes</span>
              <span>No sales call needed</span>
            </div>
            <div className="marketing-proof">
              <div><strong>Multi-workspace</strong><span>Separate teams, devices, and logs per workspace</span></div>
              <div><strong>Queue &amp; retry</strong><span>Failed messages are retried automatically</span></div>
              <div><strong>Realtime</strong><span>Device and message status shown instantly</span></div>
            </div>
          </div>

          <div className="marketing-card-stack">
            <article className="signal-card">
              <span className="eyebrow alt">Built for</span>
              <ul>
                <li>Order confirmations for marketplaces and online stores</li>
                <li>Invoice notifications, installment reminders, and payment alerts</li>
                <li>Lead follow-up messages triggered via API</li>
              </ul>
            </article>
            <article className="signal-card contrast">
              <span className="eyebrow alt">Already available</span>
              <ul>
                {highlights.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="story-strip" id="features">
        <div className="section-heading">
          <h3>Why teams choose WATether</h3>
          <p>Built for workflows that are common — not a generic gateway that needs extensive manual configuration.</p>
        </div>
        <div className="story-grid">
          <article className="story-card glass-panel">
            <strong>Start small, scale gradually</strong>
            <p>Try with small volume, validate team operations, then upgrade when devices and quota need to grow.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Practical use cases</strong>
            <p>Plans and features designed for SMEs, CS teams, payment reminders, and everyday business workflows.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Console ready to use today</strong>
            <p>Sign up and immediately access the dashboard with device management and scheduled broadcast — no multi-day setup. Auto reply and webhooks unlock on paid plans.</p>
          </article>
        </div>
      </section>

      <section className="pricing-stage" id="pricing">
        <div className="section-heading pricing-head">
          <h3>Priced per WhatsApp number, not per message</h3>
          <p>Pay based on how many WA numbers you use. Start free, upgrade anytime with no contract.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={plan.featured ? 'pricing-card featured glass-panel' : 'pricing-card glass-panel'}>
              <div>
                <span className="eyebrow alt">{plan.name}</span>
                <h2>{plan.price}<small>/month</small></h2>
                <p>{plan.caption}</p>
              </div>
              <div className="quota-pill">{plan.quota}</div>
              <ul>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                {'missing' in plan && (plan.missing as string[]).map((feature) => <li key={feature} style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{feature}</li>)}
              </ul>
              <Link className={plan.featured ? 'button-primary' : 'button-secondary'} href={`/console?mode=register&plan=${encodeURIComponent(plan.name)}`}>Get started</Link>
            </article>
          ))}
        </div>
        <p style={{marginTop: '12px', fontSize: '13px', color: 'var(--muted)'}}>* Fair use policy applies. Not for mass spam.</p>
      </section>

      <section className="trust-stage">
        <div className="section-heading pricing-head">
          <h3>Used in real operations</h3>
          <p>From online stores to collection teams — WATether is used for workflows that happen every single day.</p>
        </div>
        <div className="story-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="story-card glass-panel quote-card">
              <span className="eyebrow alt">{item.name}</span>
              <p>{item.quote}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-stage" id="start">
        <div className="glass-panel demo-form-wrap disclaimer-band">
          <span className="eyebrow">Important — please read before you start</span>
          <p>WATether is a gateway platform — not an official product of Meta or WhatsApp Inc. Using personal or business WhatsApp numbers for bulk sending may result in restrictions or bans by WhatsApp. Any risk of account bans, feature restrictions, or number deactivation is entirely outside WATether&apos;s responsibility. Use responsibly and in accordance with WhatsApp&apos;s policies.</p>
          <Link className="button-primary" href="/console?mode=register">I understand, start free</Link>
        </div>
      </section>

      <section className="faq-stage">
        <div className="section-heading pricing-head">
          <h3>Frequently asked questions</h3>
          <p>If anything is still unclear, feel free to reach out and we&apos;ll explain in more detail.</p>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <article key={item.question} className="faq-item glass-panel">
              <strong>{item.question}</strong>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-band glass-panel">
        <div>
          <span className="eyebrow">Ready to start?</span>
          <h2>Sign up free, open the console, and send your first message today.</h2>
          <p>No credit card. No sales call. Try it yourself right now.</p>
        </div>
        <div className="button-row">
          <Link className="button-primary" href="/console?mode=register">Start Free</Link>
          <a className="button-ghost" href="#pricing">See pricing</a>
        </div>
      </section>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} WATether. All rights reserved.</p>
        <nav className="footer-links">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/refund-policy">Refund Policy</Link>
          <Link href="/faq">FAQ</Link>
          <a href="mailto:support@watether.com">Contact</a>
        </nav>
      </footer>
    </main>
  );
}
