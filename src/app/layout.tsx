import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: {
    default: 'RAN Pisos & Revestimientos',
    template: '%s | RAN Pisos & Revestimientos',
  },
  description:
    'Descubrí nuestra amplia selección de pisos y revestimientos cerámicos. Catálogo online, asesoramiento personalizado y presupuestos al instante con IA.',
  keywords: ['pisos', 'revestimientos', 'cerámicos', 'porcellanato', 'RAN', 'presupuesto'],
  openGraph: {
    title: 'RAN Pisos & Revestimientos',
    description: 'Catálogo online de pisos y revestimientos cerámicos con asesoría IA',
    type: 'website',
    locale: 'es_AR',
  },
};

import { SubscriptionProvider } from '@/lib/contexts/subscription-context';
import { SubscriptionBanner } from '@/components/common/SubscriptionBanner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <meta name="theme-color" content="#1B2A4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered');
                  }, function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <SubscriptionProvider>
            <div className="flex min-h-screen flex-col">
              <SubscriptionBanner />
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster richColors position="top-right" />
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
