'use client';

import { Sidebar } from '@/components/Sidebar';

export default function Dashboard() {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6'>
        <h1 className='text-2xl font-bold text-foreground font-heading'>
          Dashboard
        </h1>
        <p className='text-muted-foreground mt-2'>Welcome to your dashboard</p>
      </main>
    </div>
  );
}
