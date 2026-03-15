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
      </head>
      <body>
        <AuthProvider>
          <SubscriptionProvider>
            <SubscriptionBanner />
            {children}
            <Toaster richColors position="top-right" />
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
