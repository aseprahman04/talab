import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — WATether',
  description: 'Syarat dan ketentuan penggunaan layanan WATether.',
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link">← Kembali ke beranda</Link>
        <h1>Syarat &amp; Ketentuan</h1>
        <p className="legal-meta">Terakhir diperbarui: 30 Maret 2026</p>
      </header>

      <main className="legal-body">
        <section>
          <h2>1. Penerimaan Ketentuan</h2>
          <p>Dengan mengakses atau menggunakan layanan WATether ("Layanan"), kamu menyetujui untuk terikat oleh Syarat &amp; Ketentuan ini. Jika tidak setuju, harap jangan gunakan Layanan.</p>
        </section>

        <section>
          <h2>2. Deskripsi Layanan</h2>
          <p>WATether adalah platform gateway WhatsApp yang menyediakan antarmuka manajemen perangkat, pengiriman pesan, webhook, broadcast, dan auto-reply untuk keperluan bisnis. WATether bukan produk resmi Meta Platforms, Inc. atau WhatsApp LLC.</p>
        </section>

        <section>
          <h2>3. Penggunaan yang Diizinkan</h2>
          <p>Kamu diizinkan menggunakan Layanan untuk keperluan bisnis yang sah, termasuk:</p>
          <ul>
            <li>Mengirim notifikasi transaksi dan layanan pelanggan</li>
            <li>Mengelola komunikasi tim melalui device terdaftar</li>
            <li>Mengintegrasikan Layanan dengan sistem internal melalui API dan webhook</li>
          </ul>
        </section>

        <section>
          <h2>4. Larangan Penggunaan</h2>
          <p>Kamu dilarang menggunakan Layanan untuk:</p>
          <ul>
            <li>Mengirim pesan massal yang tidak diminta (spam)</li>
            <li>Aktivitas penipuan, phishing, atau yang melanggar hukum</li>
            <li>Melanggar Ketentuan Layanan WhatsApp</li>
            <li>Mendistribusikan konten berbahaya, SARA, atau melanggar hak pihak ketiga</li>
          </ul>
        </section>

        <section>
          <h2>5. Akun dan Keamanan</h2>
          <p>Kamu bertanggung jawab penuh atas keamanan akun dan semua aktivitas yang dilakukan melalui akun kamu. Segera hubungi kami jika terjadi akses tidak sah.</p>
        </section>

        <section>
          <h2>6. Risiko Nomor WhatsApp</h2>
          <p>Penggunaan nomor WhatsApp melalui pihak ketiga berpotensi menyebabkan pembatasan, pemblokiran, atau ban permanen oleh WhatsApp. Segala risiko sepenuhnya merupakan tanggung jawab pengguna. WATether tidak bertanggung jawab atas pembatasan nomor yang terjadi akibat penggunaan Layanan.</p>
        </section>

        <section>
          <h2>7. Langganan dan Pembayaran</h2>
          <p>Langganan diproses melalui LemonSqueezy. Dengan berlangganan, kamu menyetujui harga dan siklus penagihan yang berlaku. Kamu dapat membatalkan langganan kapan saja; akses akan tetap aktif hingga akhir periode yang telah dibayar.</p>
        </section>

        <section>
          <h2>8. Kebijakan Pengembalian Dana</h2>
          <p>Lihat <Link href="/refund-policy">Kebijakan Pengembalian Dana</Link> kami untuk informasi lengkap.</p>
        </section>

        <section>
          <h2>9. Batasan Tanggung Jawab</h2>
          <p>Layanan disediakan "sebagaimana adanya". WATether tidak menjamin ketersediaan layanan 100% tanpa gangguan. Sejauh diizinkan hukum yang berlaku, WATether tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial.</p>
        </section>

        <section>
          <h2>10. Perubahan Ketentuan</h2>
          <p>Kami dapat memperbarui Syarat &amp; Ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui email atau notifikasi di platform. Penggunaan berkelanjutan setelah perubahan berarti penerimaan ketentuan yang diperbarui.</p>
        </section>

        <section>
          <h2>11. Hukum yang Berlaku</h2>
          <p>Syarat &amp; Ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan melalui musyawarah mufakat, dan jika tidak tercapai, melalui pengadilan yang berwenang di Indonesia.</p>
        </section>

        <section>
          <h2>12. Kontak</h2>
          <p>Pertanyaan seputar Syarat &amp; Ketentuan dapat disampaikan ke: <a href="mailto:support@watether.com">support@watether.com</a></p>
        </section>
      </main>

      <footer className="legal-footer">
        <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
        <Link href="/refund-policy">Refund Policy</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/">Beranda</Link>
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
