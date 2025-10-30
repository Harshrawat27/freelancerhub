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

// Dummy data
const dummyProjects = [
  { id: 1, name: 'Website Redesign', color: '#EE575A' },
  { id: 2, name: 'Mobile App', color: '#4A90E2' },
  { id: 3, name: 'Brand Identity', color: '#7ED321' },
];

const dummyMembers = [
  { id: 1, name: 'Sarah Johnson', role: 'Designer', avatar: 'SJ' },
  { id: 2, name: 'Mike Chen', role: 'Developer', avatar: 'MC' },
  { id: 3, name: 'Emma Wilson', role: 'Manager', avatar: 'EW' },
];

export function Sidebar() {
  const pathname = usePathname();
  const session = useSession();

  return (
    <aside
      className={cn(
        'fixed top-2.5 left-2.5',
        'w-[250px] h-[calc(100vh-20px)]',
        'bg-secondary',
        'rounded-lg',
        'overflow-y-auto',
        'shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)]',
        'dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]',
        'flex flex-col justify-between'
      )}
    >
      <div className='p-4'>
        {/* Logo/Brand */}
        <div className='mb-6 pb-4 border-b border-border'>
          <h2 className='font-heading text-xl font-bold text-foreground'>
            ChatFlow
          </h2>
        </div>

        {/* Menu Section */}
        <div className='mb-6'>
          <h3 className='px-3 py-2 text-foreground font-medium text-sm'>
            Menu
          </h3>
          <div className='mt-2 space-y-1'>
            <Link
              href='/dashboard'
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm',
                pathname === '/dashboard'
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
                  d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                />
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link
              href='/projects'
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm',
                pathname === '/projects'
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
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              <span>Projects</span>
            </Link>
          </div>
        </div>

        {/* Project Section */}
        <div className='mb-6'>
          <h3 className='px-3 py-2 text-foreground font-medium text-sm'>
            Project
          </h3>
          <div className='mt-2 space-y-2'>
            {dummyProjects.map((project) => (
              <div
                key={project.id}
                className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background transition-colors duration-200 cursor-pointer opacity-50 hover:opacity-100'
              >
                <div
                  className='w-3 h-3 rounded-full shrink-0'
                  style={{ backgroundColor: project.color }}
                />
                <span className='text-sm text-muted-foreground truncate'>
                  {project.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Members Section */}
        <div className='mb-6'>
          <h3 className='px-3 py-2 text-foreground font-medium text-sm'>
            Members
          </h3>
          <div className='mt-2 space-y-2'>
            {dummyMembers.map((member) => (
              <div
                key={member.id}
                className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background transition-colors duration-200 cursor-pointer opacity-50 hover:opacity-100'
              >
                <div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0'>
                  <span className='text-xs font-medium text-primary'>
                    {member.avatar}
                  </span>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-foreground truncate'>
                    {member.name}
                  </p>
                  <p className='text-xs text-muted-foreground truncate'>
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!session.data ? (
        <div className='px-4 mb-3'>
          <div className='px-3 py-3 bg-background rounded-lg'>
            <h2 className='text-white text-xl font-heading mb-1'>Login</h2>
            <p className='mb-4 text-xs'>
              Login to save your information related to projects
            </p>
            <div
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium',
                'bg-primary text-primary-foreground',
                'shadow-md shadow-primary/20 button-highlighted-shadow',
                'hover:bg-primary/90',
                'transition-colors duration-200 cursor-pointer inline-block'
              )}
            >
              <Dialog>
                <DialogTrigger>Login</DialogTrigger>
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
                        callbackURL: '/dashboard',
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
        <div className='px-4 mb-3'>
          <button
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    window.location.href = '/dashboard';
                  },
                },
              });
            }}
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-medium',
              'bg-primary text-primary-foreground',
              'shadow-md shadow-primary/20 button-highlighted-shadow',
              'hover:bg-primary/90',
              'transition-colors duration-200 cursor-pointer'
            )}
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
