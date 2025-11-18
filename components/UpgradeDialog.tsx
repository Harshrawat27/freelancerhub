'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Sparkles, Check, Loader2 } from 'lucide-react';

interface UpgradeDialogProps {
  children: React.ReactNode;
}

export function UpgradeDialog({ children }: UpgradeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to initiate checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      title: 'Unlimited Chats',
      description: 'Create and share unlimited chat conversations',
    },
    {
      title: '50GB storage',
      description: 'Upload and store unlimited files and assets',
    },
    {
      title: 'Priority Support',
      description: 'Get faster response times for support requests',
    },
    {
      title: 'Team Collaboration',
      description: 'Invite unlimited team members to collaborate',
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl justify-center'>
            <Sparkles className='w-6 h-6 text-primary text-center' />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Unlock all features and take your productivity to the next level
          </DialogDescription>
        </DialogHeader>

        <div className='mt-6 space-y-6'>
          {/* Pricing */}
          <div className='bg-linear-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20'>
            <div className='flex items-baseline gap-2'>
              <span className='text-4xl font-bold text-foreground'>$20</span>
              <span className='text-muted-foreground'>for 1st year</span>
            </div>
            <p className='text-sm text-muted-foreground mt-1'>
              After that $5/month
            </p>
          </div>

          {/* Benefits */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-lg'>What you get:</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {benefits.map((benefit, index) => (
                <div key={index} className='flex gap-3'>
                  <div className='shrink-0 mt-0.5'>
                    <Check className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <h4 className='font-medium text-sm'>{benefit.title}</h4>
                    <p className='text-xs text-muted-foreground'>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90',
              'transition-colors duration-200',
              'font-semibold text-base',
              'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className='w-5 h-5 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className='w-5 h-5' />
                Upgrade Now
              </>
            )}
          </button>

          <p className='text-xs text-center text-muted-foreground'>
            Secure payment powered by Dodo Payments
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
