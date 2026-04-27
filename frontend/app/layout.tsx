import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Sans, Noto_Kufi_Arabic } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../contexts/theme-context';
import { LanguageProvider } from '../contexts/language-context';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

const arabicFont = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
});

export const metadata: Metadata = {
  title: 'طلب — نظام الطلبات والفواتير عبر واتساب | Talab',
  description:
    'طلب يحوّل محادثات واتساب إلى طلبات، فواتير، وتأكيد دفع تلقائي. Talab turns WhatsApp chats into orders, invoices, and verified payments.',
  keywords: [
    'فاتورة واتساب',
    'إدارة الطلبات واتساب',
    'نظام طلبات البيع',
    'تأكيد الدفع واتساب',
    'WhatsApp orders',
    'WhatsApp invoice',
    'WhatsApp payment verification',
    'talab app',
  ],
  openGraph: {
    title: 'طلب | Talab — WhatsApp Sales, Orders & Payments',
    description: 'طلب يحوّل واتساب لنظام مبيعات احترافي — طلبات، فواتير، وتأكيد دفع تلقائي.',
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
  },
  icons: {
    icon: '/logo_dark_square.png',
    apple: '/logo_dark_square.png',
    shortcut: '/logo_dark_square.png',
  },
  alternates: {
    languages: {
      ar: '/',
      en: '/?lang=en',
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${arabicFont.variable}`}>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
