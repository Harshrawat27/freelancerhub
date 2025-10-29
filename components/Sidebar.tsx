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

      <div className='px-4 mb-3'>
        <div className='px-3 py-2 bg-background rounded-lg'>
          <div
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-medium',
              'bg-primary text-primary-foreground',
              'shadow-md shadow-primary/20 button-highlighted-shadow',
              'hover:bg-primary/90',
              'transition-colors duration-200 cursor-pointer'
            )}
          >
            <Dialog>
              <DialogTrigger>Login</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </aside>
  );
}
