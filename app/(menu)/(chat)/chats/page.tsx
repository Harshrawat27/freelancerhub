'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useEffect, useState } from 'react';
import { columns, Chat } from './columns';
import { DataTable } from './data-table';
import { toast } from 'sonner';

export default function Chats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chat');
        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }
        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error('Error fetching chats:', error);
        toast.error('Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[260px] p-6'>
        <Topbar pageName='Chats' />
        {/* <p className='text-muted-foreground mt-2 mb-6'>
          View and manage all your chats
        </p> */}
        <div className='mt-6'>
          <DataTable columns={columns} data={chats} loading={loading} />
        </div>
      </main>
    </div>
  );
}
