'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function CreateInvoice() {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6'>
        <Topbar pageName='Create Invoice' />
        <p className='text-muted-foreground mt-2'>Create your first Invoice</p>
      </main>
    </div>
  );
}
