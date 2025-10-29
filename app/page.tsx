'use client';

import { ThemeToggle } from '../components/ThemeToggle';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className='min-h-screen transition-colors duration-300'>
      {/* Grid Container with dashed border */}
      <div className='max-w-5xl mx-auto min-h-screen border-x border-dashed border-border'>
        {/* Header Section */}
        <header className='border-b border-dashed border-border px-4 py-3 md:px-6 md:py-4'>
          <div className='flex justify-between items-center'>
            <div className='font-heading text-xl md:text-2xl font-bold text-foreground'>
              ChatFlow
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero + Features Section (First Fold) */}
        <section className='border-b border-dashed border-border'>
          {/* Hero */}
          <div className='px-4 md:px-8 pt-43 pb-30 md:pt-43 md:pb-30'>
            <div className='max-w-3xl text-center mx-auto'>
              <h1 className='font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-foreground mx-auto'>
                Transform Chats into
                <br></br>
                <span className='text-primary'> Actionable Insights</span>
              </h1>
              <p className='text-sm md:text-base leading-relaxed mb-6 text-muted-foreground max-w-xl mx-auto'>
                Turn messy chats into structured insights. Hide what matters,
                extract tasks, create summaries, and share with your team.
              </p>
              <button
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-medium',
                  'bg-primary text-primary-foreground',
                  'shadow-md shadow-primary/20 button-highlighted-shadow',
                  'hover:bg-primary/90',
                  'transition-colors duration-200'
                )}
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className='grid md:grid-cols-3 border-t border-dashed border-border'>
            {/* Feature 1 */}
            <div className='px-4 py-6 md:p-6 md:border-r border-dashed border-border'>
              <div
                className={cn(
                  'w-10 h-10 rounded-lg mb-3',
                  'bg-secondary',
                  'flex items-center justify-center',
                  'shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]'
                )}
              >
                <span className='text-xl text-primary'>🔒</span>
              </div>
              <h3 className='font-heading text-base md:text-lg font-bold mb-2 text-foreground'>
                Privacy First
              </h3>
              <p className='text-xs md:text-sm leading-relaxed text-muted-foreground'>
                Hide sensitive information before sharing. Your data, your
                control.
              </p>
            </div>

            {/* Feature 2 */}
            <div className='px-4 py-6 md:p-6 md:border-r border-dashed border-border'>
              <div
                className={cn(
                  'w-10 h-10 rounded-lg mb-3',
                  'bg-secondary',
                  'flex items-center justify-center',
                  'shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]'
                )}
              >
                <span className='text-xl text-primary'>✓</span>
              </div>
              <h3 className='font-heading text-base md:text-lg font-bold mb-2 text-foreground'>
                Task Creation
              </h3>
              <p className='text-xs md:text-sm leading-relaxed text-muted-foreground'>
                Automatically extract and create todos from your conversations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className='px-4 py-6 md:p-6'>
              <div
                className={cn(
                  'w-10 h-10 rounded-lg mb-3',
                  'bg-secondary',
                  'flex items-center justify-center',
                  'shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]'
                )}
              >
                <span className='text-xl text-primary'>📊</span>
              </div>
              <h3 className='font-heading text-base md:text-lg font-bold mb-2 text-foreground'>
                Smart Summaries
              </h3>
              <p className='text-xs md:text-sm leading-relaxed text-muted-foreground'>
                Get instant summaries and action plans from lengthy chats.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='px-4 md:px-8 py-10 md:py-16 text-center'>
          <h2 className='font-heading text-2xl md:text-3xl font-bold mb-3 text-foreground'>
            Ready to streamline your workflow?
          </h2>
          <p className='text-sm md:text-base mb-6 text-muted-foreground max-w-xl mx-auto'>
            Join freelancers and agencies who trust ChatFlow for their team
            collaboration.
          </p>
          <div className='flex flex-col sm:flex-row gap-3 justify-center items-center'>
            <button
              className={cn(
                'w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium',
                'bg-primary text-primary-foreground',
                'shadow-md shadow-primary/20 button-highlighted-shadow',
                'hover:bg-primary/90',
                'transition-colors duration-200'
              )}
            >
              Start Free Trial
            </button>
            <button
              className={cn(
                'w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium',
                'bg-secondary text-secondary-foreground',
                'shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]',
                'hover:bg-secondary/80',
                'transition-colors duration-200'
              )}
            >
              Learn More
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
