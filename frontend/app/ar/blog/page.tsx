import type { Metadata } from 'next';
import Link from 'next/link';
import { getPostsByLang } from '../../../lib/posts';

export const metadata: Metadata = {
  title: 'المدونة — طلب | نصائح البيع عبر واتساب والفواتير وإدارة الطلبات',
  description:
    'مقالات عملية للبائعين على واتساب: كيف تُدير طلباتك، ترسل فواتير احترافية، وتتأكد من الدفع تلقائياً.',
  keywords: [
    'مدونة البيع واتساب',
    'نصائح التجارة واتساب',
    'إدارة الطلبات',
    'فاتورة واتساب',
    'تأكيد الدفع',
  ],
  alternates: { canonical: '/ar/blog' },
};

export default function BlogIndex() {
  const posts = getPostsByLang('ar');

  return (
    <main className="marketing-shell" dir="rtl" lang="ar">
      <section className="marketing-hero">
        <div className="marketing-nav">
          <Link className="brand-lockup" href="/" style={{ fontFamily: 'var(--font-arabic)', fontWeight: 700, fontSize: '20px' }}>
            طلب
          </Link>
          <div className="button-row">
            <Link className="button-ghost" href="/">الرئيسية</Link>
            <Link className="button-primary" href="/console?mode=register">ابدأ مجاناً</Link>
          </div>
        </div>
      </section>

      <section className="story-strip" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>
        <div className="section-heading">
          <span className="eyebrow">المدونة</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginTop: '12px' }}>نصائح ودليل البيع عبر واتساب</h1>
          <p>مقالات عملية لكل بائع يريد تنظيم طلباته وإرسال فواتير احترافية وتأكيد المدفوعات تلقائياً.</p>
        </div>

        <div className="blog-list">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card glass-panel">
              <div className="blog-card-meta">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span className="reading-time">{post.readingTime} دقائق قراءة</span>
              </div>
              <h2>
                <Link href={`/ar/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.description}</p>
              <div className="blog-tags">
                {post.keywords.slice(0, 3).map((kw) => (
                  <span key={kw} className="tag-chip">{kw}</span>
                ))}
              </div>
              <Link className="blog-read-more" href={`/ar/blog/${post.slug}`}>
                اقرأ المقال ←
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer" dir="rtl">
        <p>© {new Date().getFullYear()} Talab. جميع الحقوق محفوظة.</p>
        <nav className="footer-links">
          <Link href="/">الرئيسية</Link>
          <Link href="/terms">الشروط والأحكام</Link>
          <Link href="/privacy-policy">سياسة الخصوصية</Link>
          <a href="mailto:support@talab.asia">الدعم الفني</a>
        </nav>
      </footer>
    </main>
  );
}
