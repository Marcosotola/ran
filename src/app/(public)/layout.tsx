import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pisos y Revestimientos Cerámicos — RAN',
  description:
    'Descubrí nuestra amplia selección de pisos y revestimientos cerámicos. Asesoramiento con IA, presupuesto instantáneo y los mejores materiales para tu hogar.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
