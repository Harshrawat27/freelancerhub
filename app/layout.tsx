import type { Metadata } from 'next';
import { Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/next';
import { TempUserInitializer } from '@/components/TempUserInitializer';

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: ['400'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'ChatShare - Transform Chats into Actionable Insights',
  description:
    'Copy, paste, and transform your chats. Hide sensitive info, create tasks, summaries, and action plans for your team.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={cn(
          instrumentSerif.variable,
          jetbrainsMono.variable,
          'antialiased'
        )}
      >
        <ThemeProvider
          defaultTheme='dark'
          attribute='class'
          enableSystem={false}
        >
          <TempUserInitializer />
          <Toaster />

          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
