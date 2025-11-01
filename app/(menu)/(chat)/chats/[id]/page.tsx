'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function Chat() {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6'>
        <Topbar pageName='Chat' />
        <p className='text-muted-foreground mt-2'>THis is your first chat!</p>
      </main>
    </div>
  );
}
