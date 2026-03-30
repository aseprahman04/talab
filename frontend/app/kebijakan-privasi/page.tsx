import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — WATether',
  description: 'Kebijakan privasi dan perlindungan data pengguna WATether.',
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link">← Kembali ke beranda</Link>
        <h1>Kebijakan Privasi</h1>
        <p className="legal-meta">Terakhir diperbarui: 30 Maret 2026</p>
      </header>

      <main className="legal-body">
        <section>
          <h2>1. Data yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan data berikut saat kamu menggunakan WATether:</p>
          <ul>
            <li><strong>Data akun:</strong> Nama, alamat email, dan (opsional) akun Google untuk login</li>
            <li><strong>Data workspace:</strong> Nama workspace, konfigurasi perangkat, dan setelan integrasi</li>
            <li><strong>Data pesan:</strong> Log pengiriman pesan yang diperlukan untuk operasional dan debugging</li>
            <li><strong>Data teknis:</strong> Alamat IP, user agent, dan log akses untuk keamanan</li>
          </ul>
        </section>

        <section>
          <h2>2. Cara Kami Menggunakan Data</h2>
          <p>Data yang dikumpulkan digunakan untuk:</p>
          <ul>
            <li>Menyediakan dan meningkatkan Layanan</li>
            <li>Memverifikasi identitas dan mengamankan akun</li>
            <li>Memproses pembayaran dan langganan</li>
            <li>Mengirim notifikasi penting terkait akun</li>
            <li>Mematuhi kewajiban hukum yang berlaku</li>
          </ul>
        </section>

        <section>
          <h2>3. Berbagi Data dengan Pihak Ketiga</h2>
          <p>Kami tidak menjual data pribadimu. Data dapat dibagikan kepada:</p>
          <ul>
            <li><strong>LemonSqueezy:</strong> Untuk pemrosesan pembayaran dan langganan</li>
            <li><strong>Penyedia infrastruktur:</strong> Server dan database yang kami gunakan untuk menjalankan Layanan</li>
            <li><strong>Pihak berwenang:</strong> Jika diwajibkan oleh hukum atau perintah pengadilan</li>
          </ul>
        </section>

        <section>
          <h2>4. Keamanan Data</h2>
          <p>Kami menerapkan langkah-langkah keamanan industri standar, termasuk enkripsi data saat transit (HTTPS/TLS), hashing password, token sesi berbasis database, dan pembatasan akses berbasis peran.</p>
        </section>

        <section>
          <h2>5. Penyimpanan Data</h2>
          <p>Data disimpan selama akun aktif dan hingga 30 hari setelah penghapusan akun, kecuali diwajibkan hukum untuk disimpan lebih lama. Log teknis disimpan maksimal 90 hari.</p>
        </section>

        <section>
          <h2>6. Hak Pengguna</h2>
          <p>Kamu berhak untuk:</p>
          <ul>
            <li>Mengakses data pribadi yang kami simpan tentang kamu</li>
            <li>Meminta koreksi data yang tidak akurat</li>
            <li>Meminta penghapusan akun dan data terkait</li>
            <li>Mengekspor data dalam format yang dapat dibaca mesin</li>
          </ul>
          <p>Untuk menggunakan hak-hak ini, hubungi <a href="mailto:support@watether.com">support@watether.com</a>.</p>
        </section>

        <section>
          <h2>7. Cookie dan Sesi</h2>
          <p>Kami menggunakan cookie HTTP-only untuk manajemen sesi login. Cookie ini tidak dapat diakses oleh JavaScript dan hanya digunakan untuk autentikasi. Kami tidak menggunakan cookie pelacakan pihak ketiga.</p>
        </section>

        <section>
          <h2>8. Perubahan Kebijakan</h2>
          <p>Perubahan material pada kebijakan ini akan diberitahukan melalui email minimal 14 hari sebelum berlaku.</p>
        </section>

        <section>
          <h2>9. Kontak</h2>
          <p>Pertanyaan seputar privasi: <a href="mailto:support@watether.com">support@watether.com</a></p>
        </section>
      </main>

      <footer className="legal-footer">
        <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>
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
