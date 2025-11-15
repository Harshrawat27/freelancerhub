'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useEffect, useState } from 'react';
import { columns, Chat } from './columns';
import { DataTable } from './data-table';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';

export default function Chats() {
  const session = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for session to load before fetching
    if (session.isPending) return;

    const fetchChats = async () => {
      try {
        // Get temp user ID from localStorage if user is not signed in
        const tempUserId = !session.data?.user
          ? localStorage.getItem('temp_user_id')
          : null;

        // Build URL with tempUserId query param if needed
        const url = tempUserId
          ? `/api/chat?tempUserId=${tempUserId}`
          : '/api/chat';

        const response = await fetch(url);
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
  }, [session.isPending]);

  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='margin-left-right-side p-6'>
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
