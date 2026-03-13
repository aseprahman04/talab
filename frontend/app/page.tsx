import Link from 'next/link';
import { DemoRequestForm } from '../components/demo-request-form';

export default function HomePage() {
  const testimonials = [
    {
      name: 'Toko retail omni-channel',
      quote: 'Trial paling penting buat kami bukan harga murah, tapi apakah tim CS bisa langsung pakai. Layout WATether sudah menjawab itu.',
    },
    {
      name: 'Tim collection regional',
      quote: 'Yang kami cari adalah reminder terjadwal, log webhook, dan pemisahan workspace. Itu sudah terasa dari demo awal.',
    },
    {
      name: 'Agen distribusi properti',
      quote: 'Kami butuh follow-up lead dari iklan ke WhatsApp tanpa spreadsheet acak. Landing dan paketnya sudah terasa relevan untuk pasar lokal.',
    },
  ];

  const faqs = [
    {
      question: 'Apakah paket Coba Dulu benar-benar gratis?',
      answer: 'Ya, positioning-nya untuk validasi alur tim kecil. Batasannya sengaja ketat supaya cocok untuk trial, bukan volume produksi besar.',
    },
    {
      question: 'Apakah route console langsung bisa dipakai registrasi?',
      answer: 'Bisa. CTA dari landing sekarang langsung mengarahkan ke mode register atau login di console tanpa perlu halaman auth terpisah.',
    },
    {
      question: 'Apakah ini sudah official WhatsApp API?',
      answer: 'Belum. Fondasi produk, queue, webhook, dan dashboard sudah ada, tapi engine session WhatsApp asli tetap perlu dipilih dan diintegrasikan sesuai strategi Anda.',
    },
  ];

  const plans = [
    {
      name: 'Coba Dulu',
      price: 'Rp0',
      caption: 'Untuk validasi use case internal tim kecil.',
      quota: '250 chat outbound per hari',
      features: ['1 device aktif', 'Webhook dasar', 'Console realtime', 'Cocok untuk trial operasional'],
    },
    {
      name: 'UMKM Pro',
      price: 'Rp189.000',
      caption: 'Paket ringan untuk owner bisnis yang butuh automasi harian.',
      quota: '3.000 chat outbound per hari',
      features: ['3 device aktif', 'Auto reply keyword', 'Broadcast terjadwal', 'Audit log tim'],
      featured: true,
    },
    {
      name: 'Growth Team',
      price: 'Rp649.000',
      caption: 'Untuk tim CS dan sales yang perlu multi-workspace.',
      quota: '20.000 chat outbound per hari',
      features: ['10 device aktif', 'Webhook retry log', 'Role admin dan staff', 'Prioritas support jam kerja WIB'],
    },
  ];

  const highlights = [
    'Dashboard operasional untuk device, queue pesan, webhook, dan auto reply.',
    'Dirancang untuk alur bisnis Indonesia: CS toko online, reminder pembayaran, konfirmasi pesanan, dan follow-up leads.',
    'Stack siap scale bertahap dengan NestJS, BullMQ, Prisma, PostgreSQL, Redis, dan Next.js.',
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
            <span className="eyebrow">WhatsApp gateway, versi operasional lokal</span>
            <h1>Bangun alur kirim pesan, webhook, dan device ops dengan rasa produk SaaS Indonesia.</h1>
            <p>
              WATether diposisikan untuk tim yang ingin sensasi paket trial seperti produk gateway populer,
              tapi copy, use case, dan struktur penawarannya dibikin relevan untuk pasar Indonesia terlebih dahulu.
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href="/console?mode=register">Coba gratis 14 hari</Link>
              <a className="button-ghost" href="#demo-form">Request demo tim</a>
              <a className="button-secondary" href="#fitur">Lihat fitur inti</a>
            </div>
            <div className="helper-strip">
              <span>Trial cepat untuk tim Indo</span>
              <span>Tanpa perlu sales call dulu</span>
              <span>Masuk console lalu register</span>
            </div>
            <div className="marketing-proof">
              <div><strong>Multi-tenant</strong><span>Workspace, role, dan audit log</span></div>
              <div><strong>Queue-ready</strong><span>Retry, worker, dan log webhook delivery</span></div>
              <div><strong>Realtime</strong><span>Status device dan pesan tampil langsung</span></div>
            </div>
          </div>

          <div className="marketing-card-stack">
            <article className="signal-card">
              <span className="eyebrow alt">Siap dipakai untuk</span>
              <ul>
                <li>Konfirmasi order marketplace dan toko online</li>
                <li>Notifikasi invoice, cicilan, dan reminder admin</li>
                <li>Distribusi lead dari form, iklan, atau CRM ringan</li>
              </ul>
            </article>
            <article className="signal-card contrast">
              <span className="eyebrow alt">Yang sudah ada sekarang</span>
              <ul>
                {highlights.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="story-strip" id="fitur">
        <div className="section-heading">
          <h3>Kenapa landing ini beda</h3>
          <p>Bukan halaman template generik. Arahnya sengaja dibuat seperti produk gateway lokal yang menjual trial cepat lalu upgrade bertahap.</p>
        </div>
        <div className="story-grid">
          <article className="story-card glass-panel">
            <strong>Trial yang realistis</strong>
            <p>Calon user bisa mulai dari beban volume kecil, validasi operasional, lalu upgrade saat tim dan device bertambah.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Bahasa penawaran Indonesia</strong>
            <p>Fokus pada UMKM, tim CS, sales, reminder pembayaran, dan workflow yang memang umum dipakai di sini.</p>
          </article>
          <article className="story-card glass-panel">
            <strong>Langsung nyambung ke console</strong>
            <p>Landing ini bukan dekorasi. CTA utama langsung masuk ke dashboard yang sudah punya device, message, webhook, dan auto reply.</p>
          </article>
        </div>
      </section>

      <section className="pricing-stage" id="paket">
        <div className="section-heading pricing-head">
          <h3>Paket Untuk Pasar Indo</h3>
          <p>Strukturnya sengaja meniru pola produk SaaS gateway populer: ada trial, paket operasional ringan, lalu paket tim. Teks dan angka tetap original untuk WATether.</p>
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
      </section>

      <section className="trust-stage">
        <div className="section-heading pricing-head">
          <h3>Use Case Yang Terasa Lokal</h3>
          <p>Bagian ini menggantikan testimonial generik. Fokusnya adalah bukti relevansi untuk operasional di Indonesia.</p>
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

      <section className="demo-stage" id="demo-form">
        <div className="section-heading pricing-head">
          <h3>Request Demo Terjadwal</h3>
          <p>Isi form singkat, dan tim Anda bisa langsung dibawa ke walkthrough sesuai use case lokal yang sedang diprioritaskan.</p>
        </div>
        <div className="glass-panel demo-form-wrap">
          <DemoRequestForm />
        </div>
      </section>

      <section className="faq-stage">
        <div className="section-heading pricing-head">
          <h3>FAQ Ringkas</h3>
          <p>Yang paling sering ditanyakan saat produk masih tahap fondasi tapi sudah ingin dipresentasikan ke calon pengguna.</p>
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
          <span className="eyebrow">Siap lanjut ke produk</span>
          <h2>Landing publik di root, console operasional di route terpisah.</h2>
          <p>Ini membuat WATether lebih masuk akal sebagai SaaS: user melihat positioning dulu, lalu masuk ke dashboard untuk eksekusi.</p>
        </div>
        <div className="button-row">
          <Link className="button-primary" href="/console?mode=register">Mulai trial</Link>
          <a className="button-ghost" href="#paket">Bandingkan paket</a>
        </div>
      </section>
    </main>
  );
}