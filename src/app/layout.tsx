import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '../components/layout/Sidebar';
import MobileHeader from '../components/layout/MobileHeader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'DealerPulse — Dealership Performance Dashboard',
  description:
    'Real-time performance dashboard for automotive dealership networks. Track sales, pipeline, and branch performance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="app-layout">
          <Sidebar />
          <div className="main-content">
            <MobileHeader />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
