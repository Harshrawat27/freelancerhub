'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function CreateProposal() {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[260px] p-6'>
        <Topbar pageName='Create Proposal' />
        <p className='text-muted-foreground mt-2'>Create your first proposal</p>
      </main>
    </div>
  );
}
