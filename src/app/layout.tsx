import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://nsriet.vercel.app'),
  title: 'Faculty Evaluation Management System | NSRIET',
  description: 'Production-ready Faculty Performance Evaluation & Appraisal Portal for NSRIET College',
  alternates: {
    canonical: 'https://nsriet.vercel.app',
  },
  openGraph: {
    title: 'Faculty Evaluation Management System | NSRIET',
    description: 'Production-ready Faculty Performance Evaluation & Appraisal Portal for NSRIET College',
    url: 'https://nsriet.vercel.app',
    siteName: 'NSRIET Faculty Evaluation',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
