'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { authClient, useSession } from '@/lib/auth-client';
import { LoginSkeleton } from '@/components/LoginSkeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown, LogOut, Sparkles, Crown, Clock } from 'lucide-react';
import Image from 'next/image';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useState, useEffect } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const session = useSession();
  // console.log('Session user:', session.data?.user);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Initialize countdown timer
  useEffect(() => {
    const STORAGE_KEY = 'promo_countdown_end';
    let endTime = localStorage.getItem(STORAGE_KEY);

    // If no end time exists, set it to 3 days from now
    if (!endTime) {
      const end = new Date();
      end.setDate(end.getDate() + 3);
      endTime = end.getTime().toString();
      localStorage.setItem(STORAGE_KEY, endTime);
    }

    // Update countdown every second
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = parseInt(endTime!);
      const difference = end - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get user initials from name
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <style jsx>{`
        @keyframes subtle-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }
        .promo-shake {
          animation: subtle-shake 0.3s ease-in-out;
          animation-iteration-count: 2;
        }
      `}</style>
      <aside
        className={cn(
          'fixed top-2.5 left-2.5',
          'w-[250px] h-[calc(100vh-20px)]',
          'bg-secondary',
          'rounded-lg',
          'overflow-y-auto',
          'shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)]',
          'dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]',
          'flex flex-col justify-between z-10 move-left'
        )}
      >
        <div className='p-4'>
          {/* Logo/Brand */}
          <div className='mb-8 pb-3 border-b border-dashed border-border'>
            <div className='flex flex-row gap-2 items-center h-[50px]'>
              <Image src='/logo.svg' height={50} width={50} alt='logo' />
              <h2 className='font-heading text-xl font-bold text-black dark:text-white'>
                ChatShare
              </h2>
            </div>
          </div>

          {/* Menu Section */}
          <div className='mb-8'>
            <h3 className='px-3 py-1 text-foreground font-medium text-sm'>
              Menu
            </h3>
            <div className='mt-1 space-y-1'>
              <Link
                href='/chats'
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                  pathname === '/chats'
                    ? 'bg-background text-foreground opacity-100'
                    : 'text-muted-foreground opacity-50 hover:bg-background hover:opacity-100'
                )}
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
                <span>All Chats</span>
              </Link>

              <Link
                href='/assets'
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                  pathname === '/assets'
                    ? 'bg-background text-foreground opacity-100'
                    : 'text-muted-foreground opacity-50 hover:bg-background hover:opacity-100'
                )}
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                <span>Assets</span>
              </Link>
            </div>
          </div>

          {/* Create Section */}
          <div className='mb-4'>
            <h3 className='px-3 py-1 text-foreground font-medium text-sm'>
              Create
            </h3>
            <div className='mt-1 space-y-1'>
              <Link
                href='/create-chats'
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                  pathname === '/create-chats'
                    ? 'bg-background text-foreground opacity-100'
                    : 'text-muted-foreground opacity-50 hover:bg-background hover:opacity-100'
                )}
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                <span>Create Chat</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Sticky Bar */}
        <div className='sticky bottom-0'>
          {session.isPending ? (
            <div className='px-2 mb-2'>
              <LoginSkeleton />
            </div>
          ) : !session.data ? (
            <div className='px-2 mb-2 space-y-2'>
              {/* Year-End offer! Promo Box */}
              <div
                className='promo-shake rounded-lg bg-primary/10 dark:bg-primary/20 p-3 border border-primary/30'
                onAnimationEnd={(e) => {
                  e.currentTarget.classList.remove('promo-shake');
                  setTimeout(() => {
                    e.currentTarget.classList.add('promo-shake');
                  }, 5000);
                }}
              >
                <div className='flex flex-col justify-between mb-2'>
                  {timeLeft && (
                    <div className='flex items-center gap-1 text-xs font-mono font-semibold text-primary mb-2'>
                      <Clock className='w-3 h-3' />
                      <span>
                        {timeLeft.days}d{' '}
                        {String(timeLeft.hours).padStart(2, '0')}:
                        {String(timeLeft.minutes).padStart(2, '0')}:
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center gap-2'>
                    <Sparkles className='w-4 h-4 text-primary' />
                    <h3 className='font-semibold text-sm text-foreground'>
                      Year-End offer!!
                    </h3>
                  </div>
                </div>
                <p className='text-xs text-muted-foreground mb-3 leading-relaxed'>
                  Get our premium features for just{' '}
                  <span className='font-bold text-primary'>
                    $20 for the entire first year
                  </span>
                  , then only $5/month after that!
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-sm font-medium',
                        'bg-primary text-primary-foreground',
                        'hover:bg-primary/90',
                        'transition-colors duration-200',
                        'shadow-md shadow-primary/20'
                      )}
                    >
                      Claim Offer
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sign up to claim this offer!</DialogTitle>
                      <DialogDescription>
                        Login to your google account to get started
                      </DialogDescription>
                    </DialogHeader>
                    <button
                      onClick={async () => {
                        await authClient.signIn.social({
                          provider: 'google',
                          callbackURL: '/create-chats',
                        });
                      }}
                      className={cn(
                        'w-full flex items-center justify-center gap-3 px-4 py-3 mt-4',
                        'bg-white text-gray-700 rounded-lg',
                        'border border-gray-300',
                        'hover:bg-gray-50',
                        'transition-colors duration-200',
                        'font-medium text-sm cursor-pointer'
                      )}
                    >
                      <svg
                        className='w-5 h-5'
                        viewBox='0 0 24 24'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                          fill='#4285F4'
                        />
                        <path
                          d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                          fill='#34A853'
                        />
                        <path
                          d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                          fill='#FBBC05'
                        />
                        <path
                          d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                          fill='#EA4335'
                        />
                      </svg>
                      Continue with Google
                    </button>
                  </DialogContent>
                </Dialog>
              </div>
              <div className='px-3 py-3 bg-background rounded-lg'>
                <h2 className='text-black text-xl font-heading mb-1 dark:text-white'>
                  Login
                </h2>
                <p className='mb-4 text-xs text-muted-foreground'>
                  Login to save your information related to chats
                </p>
                <div
                  className={cn(
                    'rounded-lg text-sm font-medium',
                    'bg-primary text-primary-foreground',
                    'shadow-md shadow-primary/20 button-highlighted-shadow',
                    'hover:bg-primary/90',
                    'cursor-pointer inline-block'
                  )}
                >
                  <Dialog>
                    <DialogTrigger className='px-3 py-1 cursor-pointer'>
                      Login
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Welcome Back!!</DialogTitle>
                        <DialogDescription>
                          Login to your google account
                        </DialogDescription>
                      </DialogHeader>
                      <button
                        onClick={async () => {
                          await authClient.signIn.social({
                            provider: 'google',
                            callbackURL: '/create-chats',
                          });
                        }}
                        className={cn(
                          'w-full flex items-center justify-center gap-3 px-4 py-3 mt-4',
                          'bg-white text-gray-700 rounded-lg',
                          'border border-gray-300',
                          'hover:bg-gray-50',
                          'transition-colors duration-200',
                          'font-medium text-sm cursor-pointer'
                        )}
                      >
                        <svg
                          className='w-5 h-5'
                          viewBox='0 0 24 24'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                            fill='#4285F4'
                          />
                          <path
                            d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                            fill='#34A853'
                          />
                          <path
                            d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                            fill='#FBBC05'
                          />
                          <path
                            d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                            fill='#EA4335'
                          />
                        </svg>
                        Continue with Google
                      </button>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          ) : (
            <div className='px-2 pb-2 bg-secondary space-y-2'>
              {/* Year-End offer! Promo Box - Only for FREE users */}
              {(session.data?.user as any)?.userTier !== 'PRO' && (
                <div
                  className='promo-shake rounded-lg bg-primary/10 dark:bg-primary/20 p-3 border border-primary/30'
                  onAnimationEnd={(e) => {
                    e.currentTarget.classList.remove('promo-shake');
                    setTimeout(() => {
                      e.currentTarget.classList.add('promo-shake');
                    }, 5000);
                  }}
                >
                  <div className='flex flex-col justify-between mb-2'>
                    {timeLeft && (
                      <div className='flex items-center gap-1 text-xs font-mono font-semibold text-primary mb-2'>
                        <Clock className='w-3 h-3' />
                        <span>
                          {timeLeft.days}d{' '}
                          {String(timeLeft.hours).padStart(2, '0')}:
                          {String(timeLeft.minutes).padStart(2, '0')}:
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                    <div className='flex items-center gap-2'>
                      <Sparkles className='w-4 h-4 text-primary' />
                      <h3 className='font-semibold text-sm text-foreground'>
                        Year-End offer!!
                      </h3>
                    </div>
                  </div>
                  <p className='text-xs text-muted-foreground mb-3 leading-relaxed'>
                    Get our premium features for just{' '}
                    <span className='font-bold text-primary'>
                      $20 for the entire first year
                    </span>
                    , then only $5/month after that!
                  </p>
                  <UpgradeDialog>
                    <button
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-sm font-medium',
                        'bg-primary text-primary-foreground',
                        'hover:bg-primary/90',
                        'transition-colors duration-200',
                        'shadow-md shadow-primary/20'
                      )}
                    >
                      Claim Offer
                    </button>
                  </UpgradeDialog>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className='flex items-center gap-3 px-3 py-2 rounded-lg bg-background w-full cursor-pointer hover:opacity-80 transition-opacity'>
                  {/* User Avatar */}
                  <div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0'>
                    {session.data?.user?.image ? (
                      <img
                        src={session.data.user.image}
                        alt={session.data.user.name || 'User'}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                    ) : (
                      <span className='text-sm font-medium text-primary'>
                        {getUserInitials(session.data?.user?.name || 'User')}
                      </span>
                    )}
                  </div>
                  {/* User Info */}
                  <div className='flex-1 min-w-0 text-left'>
                    <p className='text-sm font-medium text-foreground truncate'>
                      {session.data?.user?.name || 'User'}
                    </p>
                    <p className='text-xs text-muted-foreground truncate'>
                      {session.data?.user?.email || 'user@example.com'}
                    </p>
                  </div>
                  {/* Chevron Icon */}
                  <ChevronsUpDown className='w-4 h-4 text-muted-foreground shrink-0' />
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-60'>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            window.location.href = '/create-chats';
                          },
                        },
                      });
                    }}
                    className='cursor-pointer'
                  >
                    <LogOut className='w-4 h-4 mr-2' />
                    <span>Logout</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(session.data?.user as any)?.userTier === 'PRO' ? (
                    <div className='px-2 py-1.5'>
                      <div
                        className={cn(
                          'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                          'bg-linear-to-r from-amber-500 to-amber-600',
                          'text-white',
                          'font-semibold text-sm',
                          'shadow-lg shadow-amber-500/25'
                        )}
                      >
                        <Crown className='w-4 h-4' />
                        Pro User
                      </div>
                    </div>
                  ) : (
                    <UpgradeDialog>
                      <div className='px-2 py-1.5'>
                        <button
                          className={cn(
                            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                            'bg-linear-to-r from-primary to-primary/80',
                            'text-primary-foreground',
                            'hover:from-primary/90 hover:to-primary/70',
                            'transition-all duration-200',
                            'font-semibold text-sm',
                            'shadow-lg shadow-primary/25 cursor-pointer'
                          )}
                        >
                          <Sparkles className='w-4 h-4' />
                          Upgrade to Pro
                        </button>
                      </div>
                    </UpgradeDialog>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
