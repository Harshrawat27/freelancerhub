'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronDown, Download, Loader2 } from 'lucide-react';
import { ChatWithAssets } from './page'; // Assuming type is in page.tsx

export const getColumns = (
  downloading: string | null,
  handleDownloadAllForChat: (chat: ChatWithAssets) => void
): ColumnDef<ChatWithAssets>[] => [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return (
        <div
          className='pl-2 cursor-pointer'
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              row.getIsExpanded() ? 'rotate-180' : ''
            }`}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Chat Title
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='font-medium text-foreground'>{row.getValue('title')}</div>
    ),
  },
  {
    accessorKey: 'assets',
    header: 'Asset Count',
    cell: ({ row }) => {
      const assets = row.getValue('assets') as any[];
      return <div className='text-center'>{assets.length}</div>;
    },
  },
  {
    id: 'lastModified',
    accessorFn: (row) =>
      // Get the most recent asset creation date for sorting
      row.assets.length > 0
        ? new Date(
            Math.max(...row.assets.map((a) => new Date(a.createdAt).getTime()))
          )
        : new Date(0),
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Last Upload
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const assets = row.original.assets;
      if (assets.length === 0) {
        return <div className='text-muted-foreground'>-</div>;
      }
      const lastDate = new Date(
        Math.max(...assets.map((a) => new Date(a.createdAt).getTime()))
      );
      return (
        <div className='text-muted-foreground'>
          {lastDate.toLocaleDateString()}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const chat = row.original;
      return (
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadAllForChat(chat);
            }}
            disabled={downloading === chat.id}
          >
            {downloading === chat.id ? (
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
            ) : (
              <Download className='w-4 h-4 mr-2' />
            )}
            Download All
          </Button>
        </div>
      );
    },
  },
];
