'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className='min-h-screen transition-colors duration-300'>
      {/* Grid Container with dashed border */}
      <div className='max-w-4xl mx-auto min-h-screen border-x border-dashed border-border'>
        {/* Header Section */}
        <header className='border-b border-dashed border-border px-4 py-3 md:px-6 md:py-4'>
          <div className='flex justify-between items-center'>
            <div className='flex flex-row gap-2'>
              <Image src='/logo.svg' height={40} width={40} alt='logo' />
              <div className='font-heading text-xl md:text-2xl font-bold text-black dark:text-white'>
                ChatShare
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Back to Home Link */}
        <div className='border-b border-dashed border-border px-4 md:px-8 py-4'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to Home
          </Link>
        </div>

        {/* Privacy Policy Content */}
        <main className='px-4 md:px-8 py-8 md:py-12'>
          <h1 className='font-heading text-3xl md:text-4xl font-bold mb-6 text-foreground'>
            Privacy Policy
          </h1>

          <div className='space-y-6 text-sm md:text-base text-muted-foreground'>
            {/* Data Collection */}
            <section>
              <h2 className='font-heading text-xl font-semibold mb-3 text-foreground'>
                Data We Collect
              </h2>
              <p className='leading-relaxed mb-2'>
                ChatShare collects only essential information needed to provide
                our service:
              </p>
              <ul className='list-disc list-inside space-y-1 ml-2'>
                <li>Account information (name, email) via Google Sign-In</li>
                <li>Chat content you choose to upload and share</li>
                <li>Usage data to improve our service</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className='font-heading text-xl font-semibold mb-3 text-foreground'>
                Your Data is Secure
              </h2>
              <p className='leading-relaxed'>
                We take data security seriously. Your chat content is stored
                securely in our database with industry-standard encryption. We
                implement strict access controls and regularly update our
                security measures to protect your information.
              </p>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className='font-heading text-xl font-semibold mb-3 text-foreground'>
                How We Use Your Data
              </h2>
              <p className='leading-relaxed mb-2'>
                <strong className='text-foreground'>
                  ChatShare does NOT use your data for commercial purposes.
                </strong>{' '}
                We do not:
              </p>
              <ul className='list-disc list-inside space-y-1 ml-2'>
                <li>Sell your data to third parties</li>
                <li>Use your chat content for advertising</li>
                <li>Train AI models on your conversations</li>
                <li>Share your data internally for unrelated purposes</li>
              </ul>
              <p className='leading-relaxed mt-3'>
                Your data is used solely to provide and improve the ChatShare
                service for you.
              </p>
            </section>

            {/* Payment Processing */}
            <section>
              <h2 className='font-heading text-xl font-semibold mb-3 text-foreground'>
                Payment Processing
              </h2>
              <p className='leading-relaxed'>
                All payments are securely processed through{' '}
                <strong className='text-foreground'>Dodo Payments</strong>, our
                trusted payment provider. We do not store your credit card
                information on our servers. Payment details are handled directly
                by Dodo Payments using industry-standard security protocols.
              </p>
            </section>

            {/* User Control */}
            <section>
              <h2 className='font-heading text-xl font-semibold mb-3 text-foreground'>
                Your Control
              </h2>
              <p className='leading-relaxed'>
                You have complete control over your data. You can delete your
                chats at any time, and upon account deletion, all your data is
                permanently removed from our systems. You decide what to share
                and with whom.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className='font-heading text-xl font-semibold mb-3 text-foreground'>
                Third-Party Services
              </h2>
              <p className='leading-relaxed mb-2'>
                ChatShare integrates with the following trusted services:
              </p>
              <ul className='list-disc list-inside space-y-1 ml-2'>
                <li>
                  <strong className='text-foreground'>Google Sign-In</strong>{' '}
                  for authentication
                </li>
                <li>
                  <strong className='text-foreground'>Dodo Payments</strong>{' '}
                  for payment processing
                </li>
              </ul>
              <p className='leading-relaxed mt-3'>
                These services have their own privacy policies, and we encourage
                you to review them.
              </p>
            </section>

            {/* Updates */}
            <section>
              <h2 className='font-heading text-xl font-semibold mb-3 text-foreground'>
                Policy Updates
              </h2>
              <p className='leading-relaxed'>
                We may update this privacy policy from time to time. Any changes
                will be posted on this page with an updated revision date. We
                encourage you to review this policy periodically.
              </p>
            </section>

            {/* Contact */}
            <section className='pt-4 border-t border-dashed border-border'>
              <h2 className='font-heading text-xl font-semibold mb-3 text-foreground'>
                Questions?
              </h2>
              <p className='leading-relaxed'>
                If you have any questions about our privacy practices, please
                don't hesitate to reach out to us.
              </p>
            </section>

            <p className='text-xs text-muted-foreground pt-4'>
              Last updated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className='border-t border-dashed border-border px-4 md:px-8 py-6 text-center'>
          <p className='text-xs text-muted-foreground'>
            © {new Date().getFullYear()} ChatShare. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
