'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useEffect, useState, Suspense } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import UploadProfile from '@/components/UploadProfile';
import { CardSkeleton } from '@/components/CardSkeleton';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  photo: string | null;
  bio: string | null;
}

export default function Members() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/teammember');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      const data = await response.json();
      setMembers(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6'>
        <Topbar pageName='Team Members' />

        {isLoading ? (
          <div className='mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className='mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Add Member Card */}
            <Dialog>
              <DialogTrigger asChild>
                <div
                  className={cn(
                    'group cursor-pointer',
                    'bg-secondary rounded-lg p-6',
                    'border-2 border-dashed border-border',
                    'hover:border-primary transition-all duration-200',
                    'flex flex-col items-center justify-center min-h-[280px]',
                    'shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)]',
                    'dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]'
                  )}
                >
                  <div className='w-24 h-24 rounded-full bg-background flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors duration-200'>
                    <svg
                      className='w-12 h-12 stroke-muted-foreground group-hover:stroke-primary transition-colors duration-200'
                      fill='none'
                      strokeWidth={2}
                      viewBox='0 0 24 24'
                    >
                      <line x1='12' y1='5' x2='12' y2='19' />
                      <line x1='5' y1='12' x2='19' y2='12' />
                    </svg>
                  </div>
                  <p className='text-foreground font-medium text-lg'>
                    Add Team Member
                  </p>
                  <p className='text-muted-foreground text-sm mt-1'>
                    Click to add a new member
                  </p>
                </div>
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

            {/* Team Member Cards */}
            <Suspense fallback={<CardSkeleton />}>
              {members.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    'bg-secondary rounded-lg p-6',
                    'shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.01)]',
                    'dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]',
                    'hover:shadow-lg transition-shadow duration-200'
                  )}
                >
                  <div className='flex flex-col items-center text-center'>
                    {/* Profile Photo */}
                    <div className='w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 overflow-hidden'>
                      {member.photo ? (
                        <Image
                          src={member.photo}
                          alt={member.name}
                          width={96}
                          height={96}
                          className='object-cover w-full h-full'
                        />
                      ) : (
                        <span className='text-2xl font-bold text-primary'>
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      )}
                    </div>

                    {/* Member Info */}
                    <h3 className='font-heading text-xl font-bold text-foreground mb-1'>
                      {member.name}
                    </h3>
                    <p className='text-primary text-sm font-medium mb-2'>
                      {member.role}
                    </p>
                    <p className='text-muted-foreground text-sm mb-3'>
                      {member.email}
                    </p>

                    {/* Bio */}
                    {member.bio && (
                      <p className='text-muted-foreground text-xs line-clamp-3 mt-2'>
                        {member.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </Suspense>
          </div>
        )}

        {!isLoading && members.length === 0 && (
          <div className='mt-12 text-center'>
            <p className='text-muted-foreground text-lg mb-2'>
              No team members yet
            </p>
            <p className='text-muted-foreground text-sm'>
              Click the "+" card above to add your first team member
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
