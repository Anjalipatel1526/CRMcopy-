// src/app/layout.tsx — Root Application Shell & Design Tokens (White & Red Luxury Theme)
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import StyledJsxRegistry from './registry';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-secondary-google',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-primary-google',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Luxury Automobile CRM',
  description:
    'Pre-owned luxury automobile dealership CRM. Consultative pipeline, deduplicated lead ingestion, follow-up scheduling, and executive analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} light`}>
      <body className="min-h-screen bg-[#F5F8FC] text-[#173B67] font-sans antialiased selection:bg-[#F5223B]/10 selection:text-[#F5223B]">
        <StyledJsxRegistry>
          {children}
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
