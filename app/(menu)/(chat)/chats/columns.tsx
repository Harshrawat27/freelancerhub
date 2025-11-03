'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

export type Chat = {
  id: string;
  title: string;
  rawText: string;
  senderPositions: any;
  nameMapping: any;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export const columns: ColumnDef<Chat>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className='font-medium text-foreground'>{row.getValue('title')}</div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      const formatted = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
      return <div className='text-muted-foreground'>{formatted}</div>;
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Updated
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('updatedAt'));
      const formatted = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
      return <div className='text-muted-foreground'>{formatted}</div>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const chat = row.original;

      return (
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            window.location.href = `/chats/${chat.id}`;
          }}
        >
          View
        </Button>
      );
    },
  },
];
