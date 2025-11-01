'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function Chats() {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6'>
        <Topbar pageName='Chats' />
        <p className='text-muted-foreground mt-2'>See all your chats</p>
      </main>
    </div>
  );
}
