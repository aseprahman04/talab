import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, getPostsByLang } from '../../../../lib/posts';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPostsByLang('ar').map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | طلب`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      locale: 'ar_SA',
    },
    alternates: { canonical: `/ar/blog/${slug}` },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getPostsByLang('ar')
    .filter((p) => p.slug !== slug)
    .slice(0, 2);

  return (
    <main className="marketing-shell" dir="rtl" lang="ar">
      {/* Nav */}
      <section className="marketing-hero">
        <div className="marketing-nav">
          <Link className="brand-lockup" href="/" style={{ fontFamily: 'var(--font-arabic)', fontWeight: 700, fontSize: '20px' }}>
            طلب
          </Link>
          <div className="button-row">
            <Link className="button-ghost" href="/ar/blog">المدونة</Link>
            <Link className="button-primary" href="/console?mode=register">ابدأ مجاناً</Link>
          </div>
        </div>
      </section>

      {/* Article */}
      <article className="blog-post" itemScope itemType="https://schema.org/Article">
        <header className="blog-post-header">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">الرئيسية</Link>
            <span aria-hidden="true"> / </span>
            <Link href="/ar/blog">المدونة</Link>
            <span aria-hidden="true"> / </span>
            <span>{post.title}</span>
          </nav>

          <h1 itemProp="headline">{post.title}</h1>

          <div className="blog-post-meta">
            <time dateTime={post.publishedAt} itemProp="datePublished">
              {new Date(post.publishedAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>·</span>
            <span>{post.readingTime} دقائق قراءة</span>
          </div>

          <p className="blog-post-lead" itemProp="description">{post.description}</p>
        </header>

        <div
          className="blog-post-body prose-ar"
          itemProp="articleBody"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* CTA inside post */}
        <aside className="blog-post-cta glass-panel">
          <strong>جرّب طلب مجاناً</strong>
          <p>سجّل حساباً، اربط رقم واتساب، وسجّل أول طلب في أقل من ١٠ دقائق.</p>
          <Link className="button-primary" href="/console?mode=register">ابدأ مجاناً — بدون بطاقة بنكية</Link>
        </aside>

        {/* Keywords schema */}
        <meta itemProp="keywords" content={post.keywords.join(', ')} />
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="story-strip" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px 48px' }}>
          <div className="section-heading">
            <h3>مقالات ذات صلة</h3>
          </div>
          <div className="story-grid">
            {related.map((p) => (
              <article key={p.slug} className="story-card glass-panel">
                <span className="eyebrow alt">
                  {new Date(p.publishedAt).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                </span>
                <strong>
                  <Link href={`/ar/blog/${p.slug}`}>{p.title}</Link>
                </strong>
                <p>{p.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="site-footer" dir="rtl">
        <p>© {new Date().getFullYear()} Talab. جميع الحقوق محفوظة.</p>
        <nav className="footer-links">
          <Link href="/">الرئيسية</Link>
          <Link href="/ar/blog">المدونة</Link>
          <a href="mailto:support@talab.asia">الدعم الفني</a>
        </nav>
      </footer>
    </main>
  );
}
