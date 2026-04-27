'use client';

import Link from 'next/link';
import Logo from '../components/logo';
import ThemeToggle from '../components/theme-toggle';
import LangToggle from '../components/lang-toggle';
import { useLang } from '../contexts/language-context';

export default function HomePage() {
  const { tr, lang } = useLang();
  const p = tr.pricing.plans;

  return (
    <main className="marketing-shell">
      {/* ── Nav ── */}
      <section className="marketing-hero">
        <div className="marketing-nav">
          <Link className="brand-lockup" href="/">
            <Logo variant="long" height={36} />
          </Link>
          <div className="button-row" style={{ alignItems: 'center', gap: '8px' }}>
            <LangToggle />
            <ThemeToggle className="theme-toggle-btn" />
            <Link className="button-ghost" href="/#pricing">{tr.nav.pricing}</Link>
            <Link className="button-ghost" href={`/${lang}/blog`}>{tr.nav.blog}</Link>
            <Link className="button-ghost" href="/console?mode=login">{tr.nav.login}</Link>
            <Link className="button-primary" href="/console?mode=register">{tr.nav.tryFree}</Link>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="marketing-grid glass-panel">
          <div className="marketing-copy">
            <span className="eyebrow">{tr.hero.eyebrow}</span>
            <h1>{tr.hero.headline}</h1>
            <p>{tr.hero.subtext}</p>
            <div className="hero-actions">
              <Link className="button-primary" href="/console?mode=register">{tr.hero.ctaPrimary}</Link>
              <Link className="button-ghost" href="#how-it-works">{tr.hero.ctaHow}</Link>
            </div>
            <div className="helper-strip">
              <span>{tr.hero.pill1}</span>
              <span>{tr.hero.pill2}</span>
              <span>{tr.hero.pill3}</span>
            </div>
            <div className="marketing-proof">
              <div><strong>{tr.hero.proof1Title}</strong><span>{tr.hero.proof1Desc}</span></div>
              <div><strong>{tr.hero.proof2Title}</strong><span>{tr.hero.proof2Desc}</span></div>
              <div><strong>{tr.hero.proof3Title}</strong><span>{tr.hero.proof3Desc}</span></div>
            </div>
          </div>

          <div className="marketing-card-stack">
            <article className="signal-card">
              <span className="eyebrow alt">{tr.signalCards.useCaseTitle}</span>
              <ul>
                {tr.signalCards.useCases.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
            <article className="signal-card contrast">
              <span className="eyebrow alt">{tr.signalCards.featuresTitle}</span>
              <ul>
                {tr.signalCards.features.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ── Pain points ── */}
      <section className="story-strip">
        <div className="section-heading">
          <h3>{tr.painPoints.heading}</h3>
        </div>
        <div className="story-grid">
          {tr.painPoints.items.map((item) => (
            <article key={item.title} className="story-card glass-panel">
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="story-strip" id="how-it-works">
        <div className="section-heading">
          <h3>{tr.steps.heading}</h3>
          <p>{tr.steps.sub}</p>
        </div>
        <div className="story-grid">
          {tr.steps.items.map((step) => (
            <article key={step.n} className="story-card glass-panel">
              <span className="eyebrow alt">{lang === 'ar' ? `الخطوة ${step.n}` : `Step ${step.n}`}</span>
              <strong>{step.title}</strong>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Why ── */}
      <section className="story-strip" id="features">
        <div className="section-heading">
          <h3>{tr.why.heading}</h3>
          <p>{tr.why.sub}</p>
        </div>
        <div className="story-grid">
          <article className="story-card glass-panel">
            <strong>{tr.why.card1Title}</strong>
            <p>{tr.why.card1Desc}</p>
          </article>
          <article className="story-card glass-panel">
            <strong>{tr.why.card2Title}</strong>
            <p>{tr.why.card2Desc}</p>
          </article>
          <article className="story-card glass-panel">
            <strong>{tr.why.card3Title}</strong>
            <p>{tr.why.card3Desc}</p>
          </article>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="pricing-stage" id="pricing">
        <div className="section-heading pricing-head">
          <h3>{tr.pricing.heading}</h3>
          <p>{tr.pricing.sub}</p>
        </div>
        <div className="pricing-grid">
          {p.map((plan) => (
            <article key={plan.code} className={'featured' in plan && plan.featured ? 'pricing-card featured glass-panel' : 'pricing-card glass-panel'}>
              <div>
                {'featured' in plan && plan.featured && (
                  <span className="eyebrow alt" style={{ display: 'block', marginBottom: '8px' }}>
                    {lang === 'ar' ? 'الأكثر طلباً' : 'Most popular'}
                  </span>
                )}
                <span className="eyebrow alt">{plan.name}</span>
                <h2>{plan.price}<small>{lang === 'ar' ? '/شهر' : '/mo'}</small></h2>
                <p>{plan.caption}</p>
              </div>
              <div className="quota-pill">{plan.quota}</div>
              <ul>
                {plan.features.map((f) => <li key={f}>{f}</li>)}
                {'missing' in plan && (plan.missing as readonly string[]).map((f) => (
                  <li key={f} style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{f}</li>
                ))}
              </ul>
              <Link
                className={'featured' in plan && plan.featured ? 'button-primary' : 'button-secondary'}
                href={`/console?mode=register&plan=${encodeURIComponent(plan.code)}`}
              >
                {tr.pricing.ctaCard}
              </Link>
            </article>
          ))}
        </div>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--muted)' }}>{tr.pricing.footnote}</p>
      </section>

      {/* ── FAQ ── */}
      <section className="faq-stage">
        <div className="section-heading pricing-head">
          <h3>{tr.faq.heading}</h3>
          <p>{tr.faq.sub}</p>
        </div>
        <div className="faq-list" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {tr.faq.items.map((item) => (
            <article key={item.q} className="faq-item glass-panel">
              <strong>{item.q}</strong>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="trust-stage">
        <div className="section-heading pricing-head">
          <h3>{tr.testimonials.heading}</h3>
          <p>{tr.testimonials.sub}</p>
        </div>
        <div className="story-grid">
          {tr.testimonials.items.map((item) => (
            <article key={item.name} className="story-card glass-panel quote-card">
              <span className="eyebrow alt">{item.name}</span>
              <p>{item.quote}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="closing-band glass-panel">
        <div>
          <span className="eyebrow">{tr.closing.eyebrow}</span>
          <h2>{tr.closing.headline}</h2>
          <p>{tr.closing.sub}</p>
        </div>
        <div className="button-row">
          <Link className="button-primary" href="/console?mode=register">{tr.closing.ctaPrimary}</Link>
          <a className="button-ghost" href="#pricing">{tr.closing.ctaSecondary}</a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Talab. {tr.footer.rights}.</p>
        <nav className="footer-links">
          <Link href="/terms">{tr.footer.terms}</Link>
          <Link href="/privacy-policy">{tr.footer.privacy}</Link>
          <Link href="/refund-policy">{tr.footer.refund}</Link>
          <Link href="/faq">{tr.footer.faq}</Link>
          <Link href={`/${lang}/blog`}>{tr.footer.blog}</Link>
          <a href="mailto:support@talab.asia">{tr.footer.support}</a>
        </nav>
      </footer>
    </main>
  );
}
