import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — WATether',
  description: 'Pertanyaan yang sering diajukan tentang WATether.',
};

const faqs = [
  {
    category: 'Umum',
    items: [
      {
        q: 'Apa itu WATether?',
        a: 'WATether adalah platform gateway WhatsApp untuk bisnis. Kamu bisa menghubungkan nomor WhatsApp, mengirim pesan melalui API, membuat broadcast, mengatur auto-reply, dan memantau semua aktivitas dari satu dashboard.',
      },
      {
        q: 'Apakah WATether produk resmi WhatsApp?',
        a: 'Tidak. WATether adalah solusi pihak ketiga yang berjalan di atas WhatsApp Web. Penggunaan nomor melalui pihak ketiga berpotensi menyebabkan pembatasan oleh WhatsApp. Untuk solusi enterprise dengan jaminan, pertimbangkan WhatsApp Business API resmi.',
      },
      {
        q: 'Siapa yang cocok menggunakan WATether?',
        a: 'Tim CS, sales, dan operasional bisnis menengah yang butuh otomasi notifikasi WhatsApp, broadcast ke daftar kontak, webhook ke sistem internal, dan manajemen multi-device dari satu console.',
      },
    ],
  },
  {
    category: 'Akun & Langganan',
    items: [
      {
        q: 'Apakah paket Gratis benar-benar gratis selamanya?',
        a: 'Ya. Paket Gratis tersedia tanpa batas waktu dengan 1 device dan 500 pesan per bulan. Tidak perlu kartu kredit.',
      },
      {
        q: 'Bagaimana cara upgrade ke paket berbayar?',
        a: 'Masuk ke console, pilih workspace, lalu buka menu Billing. Klik "Upgrade sekarang" dan kamu akan diarahkan ke halaman checkout LemonSqueezy.',
      },
      {
        q: 'Bisa bayar dengan metode apa?',
        a: 'Pembayaran diproses oleh LemonSqueezy dan mendukung kartu kredit/debit internasional (Visa, Mastercard, American Express) serta beberapa metode lokal.',
      },
      {
        q: 'Bisakah saya membatalkan langganan kapan saja?',
        a: 'Ya. Batalkan kapan saja dari halaman Billing. Akses tetap aktif hingga akhir periode yang sudah dibayar, dan tidak ada biaya pembatalan.',
      },
    ],
  },
  {
    category: 'Teknis',
    items: [
      {
        q: 'Berapa banyak device yang bisa saya hubungkan?',
        a: 'Paket Gratis: 1 device. Paket Bisnis: 5 device. Paket Tim: 20 device. Setiap device terhubung via QR code scan dari aplikasi WhatsApp di HP.',
      },
      {
        q: 'Bagaimana cara menghubungkan nomor WhatsApp?',
        a: 'Di console, buka menu Devices → klik "Pair WhatsApp" → scan QR code yang muncul menggunakan WhatsApp di HP kamu (Setelan → Perangkat Tertaut → Tautkan Perangkat).',
      },
      {
        q: 'Apakah ada API untuk integrasi ke sistem saya?',
        a: 'Ya. WATether menyediakan REST API lengkap. Dokumentasi tersedia di menu API Docs di console setelah login. Kamu bisa generate token API per device.',
      },
      {
        q: 'Apa itu webhook dan bagaimana cara pakainya?',
        a: 'Webhook mengirimkan notifikasi HTTP ke URL kamu setiap ada event (pesan masuk, status pengiriman, dll). Tambahkan webhook di menu Webhooks dan masukkan URL endpoint server kamu.',
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Ya. Semua koneksi menggunakan HTTPS/TLS. Session menggunakan HTTP-only cookie. Password di-hash dengan Argon2. Lihat Kebijakan Privasi untuk detail lengkap.',
      },
    ],
  },
  {
    category: 'Dukungan',
    items: [
      {
        q: 'Bagaimana cara menghubungi support?',
        a: 'Kirim email ke support@watether.com. Kami merespons dalam 1 hari kerja.',
      },
      {
        q: 'Apakah ada kebijakan refund?',
        a: 'Ya, tersedia refund 7 hari untuk pembayaran pertama. Lihat halaman Refund Policy untuk syarat lengkap.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link">← Kembali ke beranda</Link>
        <h1>Pertanyaan Umum (FAQ)</h1>
        <p className="legal-meta">Tidak menemukan jawaban? Hubungi <a href="mailto:support@watether.com">support@watether.com</a></p>
      </header>

      <main className="legal-body">
        {faqs.map((section) => (
          <section key={section.category}>
            <h2>{section.category}</h2>
            <div className="faq-list">
              {section.items.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="legal-footer">
        <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>
        <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
        <Link href="/refund-policy">Refund Policy</Link>
        <Link href="/">Beranda</Link>
      </footer>

      <style>{`
        .legal-page { max-width: 720px; margin: 0 auto; padding: 48px 24px; font-family: var(--font-body, sans-serif); color: #1a1a1a; line-height: 1.7; }
        .legal-header { margin-bottom: 40px; }
        .back-link { color: #6b7280; text-decoration: none; font-size: 14px; }
        .back-link:hover { color: #111; }
        h1 { font-size: 32px; font-weight: 700; margin: 16px 0 8px; }
        .legal-meta { color: #6b7280; font-size: 14px; }
        .legal-body section { margin-bottom: 40px; }
        h2 { font-size: 20px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
        .faq-list { display: flex; flex-direction: column; gap: 2px; }
        .faq-item { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .faq-item summary { padding: 14px 16px; font-weight: 500; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary::after { content: '+'; font-size: 20px; color: #6b7280; flex-shrink: 0; }
        .faq-item[open] summary::after { content: '−'; }
        .faq-item[open] summary { background: #f9fafb; }
        .faq-item p { padding: 0 16px 16px; margin: 0; color: #374151; }
        a { color: #2563eb; }
        .legal-footer { border-top: 1px solid #e5e7eb; margin-top: 48px; padding-top: 24px; display: flex; gap: 24px; flex-wrap: wrap; }
        .legal-footer a { color: #6b7280; text-decoration: none; font-size: 14px; }
        .legal-footer a:hover { color: #111; }
      `}</style>
    </div>
  );
}
