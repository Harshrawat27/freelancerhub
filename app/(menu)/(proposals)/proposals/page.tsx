'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function CreateProposal() {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='margin-left-right-side p-6'>
        <Topbar pageName='Proposals' />
        <p className='text-muted-foreground mt-2'>
          Check your all proposals here
        </p>
      </main>
    </div>
  );
}
