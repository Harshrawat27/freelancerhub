import { cn } from '@/lib/utils';
import { Link } from 'lucide-react';
import Image from 'next/image';

const HeroSection = () => {
  return (
    <div className='px-4 md:px-8 pt-45 pb-31 md:pt-45 md:pb-31 relative overflow-hidden'>
      {/* Background Images */}
      <Image
        src='https://cdn.prod.website-files.com/66b995a8da9c768e10e66aed/6903a78a59ba2f7ad2e5ee40_background-02.webp'
        alt='Dark mode background'
        fill
        className='object-cover opacity-70'
        loading='lazy'
      />
      {/* <Image
              src='https://cdn.prod.website-files.com/66b995a8da9c768e10e66aed/6903a78a16f2bfd19b19c5ff_background-01.webp'
              alt='Light mode background'
              fill
              className='object-cover opacity-70'
              loading='lazy'
            /> */}

      <div className='max-w-3xl text-center mx-auto relative z-10'>
        <h1 className='font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-foreground mx-auto'>
          Transform Chats into
          <br></br>
          <span className='text-primary '> Actionable Insights</span>
        </h1>
        <p className='text-sm md:text-base leading-relaxed mb-6 text-muted-foreground max-w-xl mx-auto'>
          Turn messy chats into structured insights. Hide what matters, extract
          tasks, create summaries, and share with your team.
        </p>
        <Link href='/dashboard'>
          <button
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium',
              'bg-primary text-primary-foreground',
              'shadow-md shadow-primary/20 button-highlighted-shadow',
              'hover:bg-primary/90',
              'transition-colors duration-200 cursor-pointer'
            )}
          >
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
