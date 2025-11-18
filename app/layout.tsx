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
  title: 'ChatShare - Share chat hide what matters',
  description:
    'Turn messy chats into structured insights. Hide what matters, extract tasks, create summaries, and share with your team.',
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
