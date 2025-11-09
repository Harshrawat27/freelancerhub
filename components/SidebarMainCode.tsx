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
import UploadProject from '@/components/UploadProject';
import UploadProfile from '@/components/UploadProfile';
import { LoginSkeleton } from '@/components/LoginSkeleton';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import Image from 'next/image';

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

  // Load expanded state from localStorage
  const [expandedMenus, setExpandedMenus] = useState<{
    invoice: boolean;
    proposal: boolean;
    chats: boolean;
  }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-expanded-menus');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return { invoice: false, proposal: false, chats: false };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'sidebar-expanded-menus',
        JSON.stringify(expandedMenus)
      );
    }
  }, [expandedMenus]);

  const toggleMenu = (menu: 'invoice' | 'proposal' | 'chats') => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

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
        <div className='mb-4 pb-3 border-b border-dashed border-border'>
          <div className='flex flex-row gap-2 items-center'>
            <Image src='/logo.svg' height={50} width={50} alt='logo' />
            <h2 className='font-heading text-xl font-bold text-black dark:text-white'>
              ChatShare
            </h2>
          </div>
        </div>

        {/* Menu Section */}
        <div className='mb-4'>
          <h3 className='px-3 py-1 text-foreground font-medium text-sm'>
            Menu
          </h3>
          <div className='mt-1 space-y-1'>
            <Link
              href='/dashboard'
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
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

            {/* Invoice Menu */}
            <div>
              <div
                onClick={() => toggleMenu('invoice')}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer',
                  pathname === '/create-invoice' || pathname === '/invoices'
                    ? 'bg-background text-foreground opacity-100'
                    : 'text-muted-foreground opacity-50 hover:opacity-100'
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
                <span>Invoice</span>
                <svg
                  className={cn(
                    'w-3 h-3 ml-auto transition-transform duration-200',
                    expandedMenus.invoice && 'rotate-90'
                  )}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </div>
              {expandedMenus.invoice && (
                <div className='ml-6 mt-1 space-y-1 relative'>
                  {/* Continuous vertical line */}
                  <div className='absolute left-0 top-0 h-[calc(100%-0.8rem)] w-px border-l-2 border-dashed border-border' />

                  <Link
                    href='/create-invoice'
                    className={cn(
                      'flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm relative cursor-pointer',
                      pathname === '/create-invoice'
                        ? 'text-foreground opacity-100'
                        : 'text-muted-foreground opacity-50 hover:opacity-100'
                    )}
                  >
                    <div className='absolute left-0 top-1/2 w-5 border-t-2 border-dashed border-border' />
                    <span>Create Invoice</span>
                  </Link>
                  <Link
                    href='/invoices'
                    className={cn(
                      'flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm relative cursor-pointer',
                      pathname === '/invoices'
                        ? 'text-foreground opacity-100'
                        : 'text-muted-foreground opacity-50 hover:opacity-100'
                    )}
                  >
                    <div className='absolute left-0 top-1/2 w-5 border-t-2 border-dashed border-border' />
                    <span>All Invoices</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Proposal Menu */}
            <div>
              <div
                onClick={() => toggleMenu('proposal')}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer',
                  pathname === '/create-proposal' || pathname === '/proposals'
                    ? 'bg-background text-foreground opacity-100'
                    : 'text-muted-foreground opacity-50 hover:opacity-100'
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
                <span>Proposal</span>
                <svg
                  className={cn(
                    'w-3 h-3 ml-auto transition-transform duration-200',
                    expandedMenus.proposal && 'rotate-90'
                  )}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </div>
              {expandedMenus.proposal && (
                <div className='ml-6 mt-1 space-y-1 relative'>
                  {/* Continuous vertical line */}
                  <div className='absolute left-0 top-0 h-[calc(100%-0.8rem)] w-px border-l-2 border-dashed border-border' />

                  <Link
                    href='/create-proposal'
                    className={cn(
                      'flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm relative cursor-pointer',
                      pathname === '/create-proposal'
                        ? 'text-foreground opacity-100'
                        : 'text-muted-foreground opacity-50 hover:opacity-100'
                    )}
                  >
                    <div className='absolute left-0 top-1/2 w-5 border-t-2 border-dashed border-border' />
                    <span>Create Proposal</span>
                  </Link>
                  <Link
                    href='/proposals'
                    className={cn(
                      'flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm relative cursor-pointer',
                      pathname === '/proposals'
                        ? 'text-foreground opacity-100'
                        : 'text-muted-foreground opacity-50 hover:opacity-100'
                    )}
                  >
                    <div className='absolute left-0 top-1/2 w-5 border-t-2 border-dashed border-border' />
                    <span>All Proposals</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Chats Menu */}
            <div>
              <div
                onClick={() => toggleMenu('chats')}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer',
                  pathname === '/create-chats' || pathname === '/chats'
                    ? 'bg-background text-foreground opacity-100'
                    : 'text-muted-foreground opacity-50 hover:opacity-100'
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
                <span>Chats</span>
                <svg
                  className={cn(
                    'w-3 h-3 ml-auto transition-transform duration-200',
                    expandedMenus.chats && 'rotate-90'
                  )}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </div>
              {expandedMenus.chats && (
                <div className='ml-6 mt-1 space-y-1 relative'>
                  {/* Continuous vertical line */}
                  <div className='absolute left-0 top-0 h-[calc(100%-0.8rem)] w-px border-l-2 border-dashed border-border' />

                  <Link
                    href='/create-chats'
                    className={cn(
                      'flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm relative cursor-pointer',
                      pathname === '/create-chats'
                        ? 'text-foreground opacity-100'
                        : 'text-muted-foreground opacity-50 hover:opacity-100'
                    )}
                  >
                    <div className='absolute left-0 top-1/2 w-5 border-t-2 border-dashed border-border' />
                    <span>Create Chats</span>
                  </Link>
                  <Link
                    href='/chats'
                    className={cn(
                      'flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm relative cursor-pointer',
                      pathname === '/chats'
                        ? 'text-foreground opacity-100'
                        : 'text-muted-foreground opacity-50 hover:opacity-100'
                    )}
                  >
                    <div className='absolute left-0 top-1/2 w-5 border-t-2 border-dashed border-border' />
                    <span>All Chats</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Section */}
        <div className='mb-4'>
          <div className='flex flex-row justify-between'>
            <Link
              href='/projects'
              className={cn(
                pathname === '/projects'
                  ? 'bg-background text-foreground opacity-100 rounded-lg'
                  : 'text-muted-foreground opacity-50 hover:bg-background hover:opacity-100 rounded-lg'
              )}
            >
              <h3 className='px-3 py-1 text-foreground font-medium text-sm rounded-lg hover:bg-background'>
                Projects
              </h3>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <button className='group p-1 rounded-full transition-colors duration-200'>
                  <svg
                    className='w-5 h-5 cursor-pointer'
                    fill='none'
                    strokeWidth={1}
                    viewBox='0 0 24 24'
                  >
                    <circle
                      cx='12'
                      cy='12'
                      r='10'
                      className='stroke-foreground group-hover:fill-primary transition-all duration-200'
                    />
                    <line
                      x1='12'
                      y1='8'
                      x2='12'
                      y2='16'
                      className='stroke-foreground transition-all duration-200'
                    />
                    <line
                      x1='8'
                      y1='12'
                      x2='16'
                      y2='12'
                      className='stroke-foreground transition-all duration-200'
                    />
                  </svg>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Project</DialogTitle>
                  <DialogDescription>
                    Create a new project to organize your work and track
                    progress.
                  </DialogDescription>
                </DialogHeader>
                <UploadProject />
              </DialogContent>
            </Dialog>
          </div>
          <div className='mt-1 space-y-1'>
            {dummyProjects.map((project) => (
              <div
                key={project.id}
                className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background cursor-pointer opacity-50 hover:opacity-100'
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
        <div className='mb-4'>
          <div className='flex flex-row justify-between'>
            <Link
              href='/members'
              className={cn(
                pathname === '/members'
                  ? 'bg-background text-foreground opacity-100 rounded-lg'
                  : 'text-muted-foreground opacity-50 hover:bg-background hover:opacity-100 rounded-lg'
              )}
            >
              <h3 className='px-3 py-1 text-foreground font-medium text-sm rounded-lg hover:bg-background'>
                Members
              </h3>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <button className='group p-1 rounded-full transition-colors duration-200'>
                  <svg
                    className='w-5 h-5 cursor-pointer'
                    fill='none'
                    strokeWidth={1}
                    viewBox='0 0 24 24'
                  >
                    <circle
                      cx='12'
                      cy='12'
                      r='10'
                      className='stroke-foreground group-hover:fill-primary transition-all duration-200'
                    />
                    <line
                      x1='12'
                      y1='8'
                      x2='12'
                      y2='16'
                      className='stroke-foreground transition-all duration-200'
                    />
                    <line
                      x1='8'
                      y1='12'
                      x2='16'
                      y2='12'
                      className='stroke-foreground transition-all duration-200'
                    />
                  </svg>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Member</DialogTitle>
                  <DialogDescription>
                    Add a new team member to collaborate on projects and share
                    tasks.
                  </DialogDescription>
                </DialogHeader>
                <UploadProfile />
              </DialogContent>
            </Dialog>
          </div>
          <div className='mt-1 space-y-1'>
            {dummyMembers.map((member) => (
              <div
                key={member.id}
                className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background cursor-pointer opacity-50 hover:opacity-100'
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

      <div className='sticky bottom-0'>
        {session.isPending ? (
          <div className='px-2 mb-2'>
            <LoginSkeleton />
          </div>
        ) : !session.data ? (
          <div className='px-2 mb-2'>
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
          <div className='px-2 pb-2 bg-secondary'>
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
                          window.location.href = '/';
                        },
                      },
                    });
                  }}
                  className='cursor-pointer'
                >
                  <LogOut className='w-4 h-4 mr-2' />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </aside>
  );
}
