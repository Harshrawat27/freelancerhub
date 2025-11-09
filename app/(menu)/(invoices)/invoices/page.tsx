'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function Invoices() {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='margin-left-right-side p-6'>
        <Topbar pageName='Invoices' />
        <p className='text-muted-foreground mt-2'>Check your all invoices</p>
      </main>
    </div>
  );
}
