import Link from 'next/link';

export default function HomePage() {
  const testimonials = [
    {
      name: 'Omni-channel retail store',
      quote: 'Our 4-person CS team was up and running in under 20 minutes. Broadcasts, auto replies, and device management — all in one place instead of three different apps.',
    },
    {
      name: 'Regional collection team, 3 branches',
      quote: 'Scheduled reminders cut our manual follow-up calls by 60%. Each branch has its own workspace and we can see delivery logs in real time.',
    },
    {
      name: 'Property distribution agency',
      quote: 'Follow-up messages used to take a half-day for one person. Now we queue 200+ messages before 9am and they go out automatically.',
    },
  ];

  const faqs = [
    {
      question: 'Is the Free plan really free?',
      answer: 'Yes, free with no credit card required. Great for testing message flows, broadcast, and the console before deciding to upgrade.',
    },
    {
      question: 'Is this an official WhatsApp API?',
      answer: 'No. WATether uses an open-source WhatsApp session library — not Meta\'s official Business API. It works with your personal or business WhatsApp number. Sending in bulk via unofficial sessions carries a risk of account restrictions by WhatsApp. Use within normal conversation volumes. Any account restriction is outside WATether\'s responsibility.',
    },
    {
      question: 'How long does setup take?',
      answer: 'Most teams are live in under 10 minutes: sign up, connect your WhatsApp number by scanning a QR code, then send your first broadcast. No developer required for basic use.',
    },
    {
      question: 'Is my contact data safe?',
      answer: 'Your data stays in your account. We do not access, share, or resell your contact lists. You can export or delete your data at any time.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes. No contracts. Cancel from the console at any time — you keep access until the end of your billing period.',
    },
    {
      question: 'Can I sign up directly from here?',
      answer: 'Yes. Click "Try Free" and you\'ll go straight to the console registration — no sales call needed.',
    },
  ];

  const plans = [
    {
      code: 'free',
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
      upgradeHint: 'Need auto reply and webhooks? Business plan — $3/mo.',
    },
    {
      code: 'bisnis',
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
      code: 'tim',
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

  const steps = [
    {
      n: '1',
      title: 'Connect your WhatsApp number',
      desc: 'Scan a QR code from the console. Your number is live in under 2 minutes — no app install needed.',
    },
    {
      n: '2',
      title: 'Set up broadcasts or auto replies',
      desc: 'Schedule messages to your contact list, or configure keyword triggers. No code required for basic use.',
    },
    {
      n: '3',
      title: 'Monitor from one dashboard',
      desc: 'Track delivery status, retry failed messages, and manage multiple numbers — all from one console.',
    },
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
            <Link className="button-ghost" href="/#pricing">Pricing</Link>
            <Link className="button-ghost" href="/console?mode=login">Log In</Link>
            <Link className="button-primary" href="/console?mode=register">Try Free</Link>
          </div>
        </div>

        <div className="marketing-grid glass-panel">
          <div className="marketing-copy">
            <span className="eyebrow">WhatsApp gateway for business teams</span>
            <h1>Stop managing WhatsApp from one phone.</h1>
            <p>
              Give your whole team a shared console — one place for all your numbers, broadcasts,
              auto replies, and delivery logs. No more passing the phone around, no more lost follow-ups.
              Free to start, live in under 10 minutes.
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href="/console?mode=register">Try Free — No Card Needed</Link>
              <Link className="button-secondary" href="#how-it-works">See how it works</Link>
            </div>
            <div className="helper-strip">
              <span>Free forever plan</span>
              <span>Live in under 10 minutes</span>
              <span>No sales call</span>
            </div>
            <div className="marketing-proof">
              <div><strong>Multi-workspace</strong><span>Separate teams, devices, and logs per workspace</span></div>
              <div><strong>Queue &amp; retry</strong><span>Failed messages retried automatically</span></div>
              <div><strong>Realtime status</strong><span>Device and delivery status shown instantly</span></div>
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
                <li>Send messages to many contacts at once via scheduled broadcast.</li>
                <li>Auto reply when messages arrive — no operator needed on standby.</li>
                <li>Real-time webhook to your system when messages are sent, failed, or received.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="story-strip">
        <div className="section-heading">
          <h3>If this sounds familiar, WATether is built for you</h3>
        </div>
        <div className="story-grid">
          <article className="story-card glass-panel">
            <strong>One phone, the whole team waiting</strong>
            <p>Your team shares one WhatsApp account on one phone. Someone is always waiting for access. Replies get lost. Customers follow up twice.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Manual follow-ups every morning</strong>
            <p>Someone spends the first hour copy-pasting the same message to 50 contacts. It&apos;s slow, error-prone, and can&apos;t scale past a handful of people.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>No visibility into what was sent</strong>
            <p>You can&apos;t tell which messages went out, which failed, or who replied. No log, no retry, no accountability across branches.</p>
          </article>
        </div>
      </section>

      <section className="story-strip" id="how-it-works">
        <div className="section-heading">
          <h3>Up and running in under 10 minutes</h3>
          <p>No developer needed for basic setup. Connect, configure, send.</p>
        </div>
        <div className="story-grid">
          {steps.map((step) => (
            <article key={step.n} className="story-card glass-panel">
              <span className="eyebrow alt">Step {step.n}</span>
              <strong>{step.title}</strong>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-strip" id="features">
        <div className="section-heading">
          <h3>Why teams choose WATether</h3>
          <p>Built for workflows that happen every day — not a generic gateway that needs weeks of configuration.</p>
        </div>
        <div className="story-grid">
          <article className="story-card glass-panel">
            <strong>Send payment reminders without touching your phone</strong>
            <p>Queue bulk messages from the console. Schedule by time, by contact list, or trigger via API. Messages go out automatically.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Let your whole team reply from one number</strong>
            <p>Multiple members, one console. Each workspace is isolated — separate devices, logs, and settings per team or branch.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Set up in 10 minutes, start sending today</strong>
            <p>Scan a QR code to connect your number. Device management, broadcast, and scheduled messages ready from day one — auto reply and webhooks unlock on paid plans.</p>
          </article>
        </div>
      </section>

      <section className="pricing-stage" id="pricing">
        <div className="section-heading pricing-head">
          <h3>Priced per WhatsApp number — not per message</h3>
          <p>Pay based on how many WA numbers you use. Start free, upgrade anytime. No contract, cancel anytime.</p>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>
            <strong>At $3/mo,</strong> one recovered payment from an automated reminder pays for the whole year.
          </p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={plan.featured ? 'pricing-card featured glass-panel' : 'pricing-card glass-panel'}>
              <div>
                {plan.featured && (
                  <span className="eyebrow alt" style={{ display: 'block', marginBottom: '8px' }}>Most popular</span>
                )}
                <span className="eyebrow alt">{plan.name}</span>
                <h2>{plan.price}<small>/month</small></h2>
                <p>{plan.caption}</p>
              </div>
              <div className="quota-pill">{plan.quota}</div>
              <ul>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                {'missing' in plan && (plan.missing as string[]).map((feature) => (
                  <li key={feature} style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{feature}</li>
                ))}
              </ul>
              {'upgradeHint' in plan && plan.upgradeHint && (
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--muted)' }}>{plan.upgradeHint as string}</p>
              )}
              <Link
                className={plan.featured ? 'button-primary' : 'button-secondary'}
                href={`/console?mode=register&plan=${encodeURIComponent(plan.code)}`}
              >
                Get started
              </Link>
            </article>
          ))}
        </div>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--muted)' }}>* Fair use policy applies. Not for mass spam.</p>
      </section>

      <section className="faq-stage">
        <div className="section-heading pricing-head">
          <h3>Common questions</h3>
          <p>If anything is still unclear, reach out and we&apos;ll explain in more detail.</p>
        </div>
        <div className="faq-list" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {faqs.map((item) => (
            <article key={item.question} className="faq-item glass-panel">
              <strong>{item.question}</strong>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-stage">
        <div className="section-heading pricing-head">
          <h3>How operations teams use WATether</h3>
          <p>From online stores to collection agencies — teams that replaced manual WhatsApp management.</p>
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

      <section className="closing-band glass-panel">
        <div>
          <span className="eyebrow">Ready to start?</span>
          <h2>Sign up free, connect your number, and send your first message today.</h2>
          <p>No credit card. No sales call. No contract. Try it yourself right now.</p>
        </div>
        <div className="button-row">
          <Link className="button-primary" href="/console?mode=register">Try Free — No Card Needed</Link>
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
          <a href="mailto:support@watether.com">Email Support</a>
        </nav>
      </footer>
    </main>
  );
}
