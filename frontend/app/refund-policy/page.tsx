import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian Dana — WATether',
  description: 'Kebijakan refund dan pengembalian dana untuk langganan WATether.',
};

export default function RefundPolicyPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link">← Kembali ke beranda</Link>
        <h1>Kebijakan Pengembalian Dana</h1>
        <p className="legal-meta">Terakhir diperbarui: 30 Maret 2026</p>
      </header>

      <main className="legal-body">
        <section>
          <h2>1. Uji Coba Gratis</h2>
          <p>Semua pengguna baru mendapatkan akses ke paket Gratis tanpa batas waktu, tanpa perlu kartu kredit. Kami menyarankan untuk mencoba Layanan terlebih dahulu sebelum berlangganan berbayar.</p>
        </section>

        <section>
          <h2>2. Kebijakan Pengembalian Dana</h2>
          <p>WATether menawarkan kebijakan pengembalian dana <strong>7 hari</strong> untuk semua paket berbayar baru. Syarat berlaku:</p>
          <ul>
            <li>Permintaan diajukan dalam 7 hari kalender sejak tanggal pembayaran pertama</li>
            <li>Permintaan disampaikan melalui email ke <a href="mailto:support@watether.com">support@watether.com</a></li>
            <li>Belum pernah mengajukan refund sebelumnya untuk akun yang sama</li>
          </ul>
        </section>

        <section>
          <h2>3. Perpanjangan Langganan</h2>
          <p>Perpanjangan otomatis <strong>tidak dapat dikembalikan</strong> kecuali terjadi gangguan layanan signifikan (downtime &gt;24 jam berturut-turut) yang terdokumentasi dalam periode tersebut.</p>
        </section>

        <section>
          <h2>4. Pengecualian</h2>
          <p>Pengembalian dana <strong>tidak berlaku</strong> untuk:</p>
          <ul>
            <li>Akun yang terbukti melanggar Syarat &amp; Ketentuan</li>
            <li>Permintaan setelah 7 hari sejak pembayaran</li>
            <li>Alasan pembatasan nomor WhatsApp (risiko yang telah diungkapkan di Syarat &amp; Ketentuan)</li>
          </ul>
        </section>

        <section>
          <h2>5. Proses Pengembalian Dana</h2>
          <p>Setelah permintaan disetujui:</p>
          <ul>
            <li>Dana dikembalikan ke metode pembayaran asal dalam <strong>5–10 hari kerja</strong></li>
            <li>Akses ke fitur berbayar dihentikan segera setelah refund diproses</li>
          </ul>
        </section>

        <section>
          <h2>6. Pembatalan Langganan</h2>
          <p>Kamu dapat membatalkan langganan kapan saja melalui halaman Billing di console atau menghubungi support. Akses tetap aktif hingga akhir periode yang telah dibayar. Pembatalan tidak menghasilkan pengembalian dana untuk sisa periode.</p>
        </section>

        <section>
          <h2>7. Cara Mengajukan Refund</h2>
          <p>Kirim email ke <a href="mailto:support@watether.com">support@watether.com</a> dengan subjek <strong>"Refund Request — [email akun]"</strong> dan sertakan:</p>
          <ul>
            <li>Email akun WATether</li>
            <li>Nomor order LemonSqueezy</li>
            <li>Alasan permintaan refund</li>
          </ul>
          <p>Kami akan merespons dalam 1 hari kerja.</p>
        </section>
      </main>

      <footer className="legal-footer">
        <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>
        <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
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
