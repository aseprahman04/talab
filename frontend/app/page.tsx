import Link from 'next/link';

export default function HomePage() {
  const testimonials = [
    {
      name: 'Toko retail omni-channel',
      quote: 'Tim CS kami langsung bisa pakai tanpa perlu training panjang. Device, broadcast, dan auto reply semuanya ada di satu console.',
    },
    {
      name: 'Tim collection regional',
      quote: 'Reminder terjadwal dan log webhook kami butuhkan dari hari pertama. WATether punya keduanya, plus pemisahan workspace per cabang.',
    },
    {
      name: 'Agen distribusi properti',
      quote: 'Follow-up lead dari iklan langsung masuk ke WhatsApp. Tidak perlu spreadsheet, tidak perlu forward manual ke tim sales.',
    },
  ];

  const faqs = [
    {
      question: 'Apakah paket Coba Dulu benar-benar gratis?',
      answer: 'Ya, gratis tanpa kartu kredit. Cocok untuk coba alur kirim pesan, webhook, dan console sebelum memutuskan upgrade.',
    },
    {
      question: 'Apakah bisa langsung daftar dari sini?',
      answer: 'Bisa. Klik tombol "Mulai Gratis" dan kamu langsung masuk ke halaman register console tanpa perlu sales call dulu.',
    },
    {
      question: 'Apakah ini sudah official WhatsApp API?',
      answer: 'Belum. WATether adalah gateway layer — queue, webhook, device management, dan dashboard sudah siap. Engine sesi WhatsApp bisa diintegrasikan sesuai kebutuhan tim kamu.',
    },
  ];

  const plans = [
    {
      name: 'Gratis',
      price: 'Rp0',
      caption: 'Coba dulu tanpa bayar. 1 nomor WA, cocok untuk testing sebelum produksi.',
      quota: '1 nomor WhatsApp',
      features: ['500 pesan per hari', 'Webhook dasar', 'Console realtime', 'Auto reply keyword'],
    },
    {
      name: 'Bisnis',
      price: 'Rp49.000',
      caption: 'Untuk bisnis yang butuh beberapa nomor WA aktif sekaligus.',
      quota: '5 nomor WhatsApp',
      features: ['Pesan tidak dibatasi*', 'Auto reply keyword', 'Broadcast terjadwal', 'Webhook + retry log'],
      featured: true,
    },
    {
      name: 'Tim',
      price: 'Rp149.000',
      caption: 'Untuk tim CS, sales, atau multi-cabang dengan banyak nomor aktif.',
      quota: '20 nomor WhatsApp',
      features: ['Pesan tidak dibatasi*', 'Multi-workspace', 'Role admin dan staff', 'Audit log + support WIB'],
    },
  ];

  const highlights = [
    'Kirim pesan ke banyak kontak sekaligus lewat broadcast terjadwal.',
    'Auto reply otomatis saat ada pesan masuk — tanpa perlu operator standby.',
    'Webhook real-time ke sistem kamu saat pesan terkirim, gagal, atau diterima.',
  ];

  return (
    <main className="marketing-shell">
      <section className="marketing-hero">
        <div className="marketing-nav">
          <Link className="brand-lockup" href="/">
            <span className="brand-mark">WA</span>
            <div>
              <strong>WATether</strong>
              <small>WhatsApp gateway untuk operasional Indonesia</small>
            </div>
          </Link>
          <div className="button-row">
            <Link className="button-ghost" href="/#paket">Lihat Paket</Link>
            <Link className="button-primary" href="/console?mode=login">Masuk Console</Link>
          </div>
        </div>

        <div className="marketing-grid glass-panel">
          <div className="marketing-copy">
            <span className="eyebrow">WhatsApp gateway untuk bisnis Indonesia</span>
            <h1>Kirim pesan, kelola device, dan otomasi notifikasi dari satu console.</h1>
            <p>
              WATether memudahkan tim kamu mengelola pengiriman pesan WhatsApp — dari broadcast ke ribuan kontak,
              auto reply keyword, hingga webhook real-time ke sistem internal.
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href="/console?mode=register">Mulai Gratis</Link>
              <a className="button-ghost" href="#demo-form">Request demo</a>
              <a className="button-secondary" href="#fitur">Lihat fitur</a>
            </div>
            <div className="helper-strip">
              <span>Gratis, tanpa kartu kredit</span>
              <span>Setup dalam hitungan menit</span>
              <span>Tidak perlu sales call</span>
            </div>
            <div className="marketing-proof">
              <div><strong>Multi-workspace</strong><span>Pisahkan tim, device, dan log per workspace</span></div>
              <div><strong>Queue &amp; retry</strong><span>Pesan gagal otomatis dicoba ulang</span></div>
              <div><strong>Realtime</strong><span>Status device dan pesan tampil langsung</span></div>
            </div>
          </div>

          <div className="marketing-card-stack">
            <article className="signal-card">
              <span className="eyebrow alt">Cocok untuk</span>
              <ul>
                <li>Konfirmasi order marketplace dan toko online</li>
                <li>Notifikasi invoice, cicilan, dan reminder pembayaran</li>
                <li>Follow-up lead dari form, iklan, atau CRM</li>
              </ul>
            </article>
            <article className="signal-card contrast">
              <span className="eyebrow alt">Yang sudah tersedia</span>
              <ul>
                {highlights.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="story-strip" id="fitur">
        <div className="section-heading">
          <h3>Kenapa tim Indonesia pilih WATether</h3>
          <p>Dibangun untuk alur kerja yang memang umum di sini — bukan gateway generik yang perlu banyak konfigurasi manual.</p>
        </div>
        <div className="story-grid">
          <article className="story-card glass-panel">
            <strong>Mulai kecil, scale bertahap</strong>
            <p>Coba dengan volume kecil, validasi alur operasional tim, lalu upgrade saat device dan kuota perlu ditambah.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Bahasa dan use case lokal</strong>
            <p>Copy, paket, dan fitur dirancang untuk UMKM, tim CS, reminder pembayaran, dan workflow bisnis Indonesia.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Console siap pakai hari ini</strong>
            <p>Daftar dan langsung akses dashboard dengan device management, broadcast, webhook, dan auto reply — tanpa setup berhari-hari.</p>
          </article>
        </div>
      </section>

      <section className="pricing-stage" id="paket">
        <div className="section-heading pricing-head">
          <h3>Harga per nomor WhatsApp, bukan per pesan</h3>
          <p>Bayar sesuai jumlah nomor WA yang kamu pakai. Mulai gratis, upgrade kapan saja tanpa kontrak.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={plan.featured ? 'pricing-card featured glass-panel' : 'pricing-card glass-panel'}>
              <div>
                <span className="eyebrow alt">{plan.name}</span>
                <h2>{plan.price}<small>/bulan</small></h2>
                <p>{plan.caption}</p>
              </div>
              <div className="quota-pill">{plan.quota}</div>
              <ul>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <Link className={plan.featured ? 'button-primary' : 'button-secondary'} href={`/console?mode=register&plan=${encodeURIComponent(plan.name)}`}>Mulai dari sini</Link>
            </article>
          ))}
        </div>
        <p style={{marginTop: '12px', fontSize: '13px', color: 'var(--muted)'}}>* Fair use policy berlaku. Tidak untuk spam massal.</p>
      </section>

      <section className="trust-stage">
        <div className="section-heading pricing-head">
          <h3>Dipakai untuk operasional nyata</h3>
          <p>Dari toko online sampai tim collection — WATether digunakan untuk alur kerja yang berulang setiap hari.</p>
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

      <section className="demo-stage" id="mulai">
        <div className="glass-panel demo-form-wrap disclaimer-band">
          <span className="eyebrow">Penting dibaca sebelum mulai</span>
          <p>WATether adalah platform gateway — bukan produk resmi Meta atau WhatsApp Inc. Penggunaan nomor WhatsApp pribadi atau bisnis untuk pengiriman massal berpotensi terkena pembatasan atau pemblokiran oleh WhatsApp. Segala risiko ban, pembatasan fitur, atau penonaktifan nomor sepenuhnya di luar tanggung jawab WATether. Gunakan dengan bijak sesuai kebijakan WhatsApp.</p>
          <Link className="button-primary" href="/console?mode=register">Saya mengerti, mulai gratis</Link>
        </div>
      </section>

      <section className="faq-stage">
        <div className="section-heading pricing-head">
          <h3>Pertanyaan yang sering masuk</h3>
          <p>Kalau ada yang belum terjawab di sini, langsung request demo dan kami jelaskan lebih detail.</p>
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
          <span className="eyebrow">Siap mulai?</span>
          <h2>Daftar gratis, masuk console, dan kirim pesan pertama hari ini.</h2>
          <p>Tidak perlu kartu kredit. Tidak perlu sales call. Langsung coba sendiri.</p>
        </div>
        <div className="button-row">
          <Link className="button-primary" href="/console?mode=register">Mulai Gratis</Link>
          <a className="button-ghost" href="#paket">Lihat paket</a>
        </div>
      </section>
    </main>
  );
}
