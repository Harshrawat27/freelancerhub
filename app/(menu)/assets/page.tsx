'use client';

import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  ExternalLink,
  Loader2,
  Package,
  FolderDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getColumns } from './columns';
import { DataTable } from './data-table';
import { Row } from '@tanstack/react-table';
import { motion } from 'framer-motion';

export interface Asset {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface ChatWithAssets {
  id: string;
  title: string;
  assets: Asset[];
}

export default function AssetsPage() {
  const router = useRouter();
  const [data, setData] = useState<ChatWithAssets[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null); // 'all' or chatId

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets/all');
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error(error);
        toast.error('Could not load assets.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const downloadAsset = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(`Failed to download ${fileName}`);
    }
  };

  const downloadAssetsAsZip = async (
    assets: Asset[],
    zipName: string,
    downloadId: string
  ) => {
    if (assets.length === 0) {
      toast.info('No assets to download.');
      return;
    }
    setDownloading(downloadId);
    try {
      const zip = new JSZip();
      toast.info(`Preparing ${assets.length} files for download...`);

      const promises = assets.map(async (asset) => {
        const response = await fetch(asset.fileUrl);
        if (!response.ok) {
          console.warn(`Failed to fetch ${asset.fileName}, skipping.`);
          return;
        }
        const blob = await response.blob();
        zip.file(asset.fileName, blob);
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${zipName}.zip`);
      toast.success('Download started!');
    } catch (error) {
      console.error('Error creating zip file:', error);
      toast.error('Failed to create zip file.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAllForChat = (chat: ChatWithAssets) => {
    downloadAssetsAsZip(
      chat.assets,
      chat.title.replace(/[\s/\\?%*:|"<>]/g, '_'), // Sanitize file name
      chat.id
    );
  };

  const handleDownloadAll = () => {
    const allAssets = data.flatMap((chat) => chat.assets);
    downloadAssetsAsZip(allAssets, 'all_assets', 'all');
  };

  const columns = useMemo(
    () => getColumns(downloading, handleDownloadAllForChat),
    [downloading]
  );

  const renderAsset = (asset: Asset) => (
    <div
      key={asset.id}
      className='flex items-center gap-4 p-3 bg-muted/50 rounded-lg'
    >
      {asset.fileType.startsWith('image/') ? (
        <img
          src={asset.fileUrl}
          alt={asset.fileName}
          className='w-12 h-12 rounded object-cover bg-muted'
        />
      ) : (
        <div className='w-12 h-12 rounded bg-muted flex items-center justify-center'>
          <FileText className='w-6 h-6 text-muted-foreground' />
        </div>
      )}
      <div className='flex-1 min-w-0'>
        <p
          className='font-medium truncate cursor-pointer hover:underline'
          onClick={() =>
            router.push(
              `/chats/${
                data.find((c) => c.assets.some((a) => a.id === asset.id))?.id
              }`
            )
          }
        >
          {asset.fileName}
        </p>
        <p className='text-xs text-muted-foreground'>
          {(asset.fileSize / 1024).toFixed(1)} KB •{' '}
          {new Date(asset.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => window.open(asset.fileUrl, '_blank')}
          aria-label='Open in new tab'
        >
          <ExternalLink className='w-4 h-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => downloadAsset(asset.fileUrl, asset.fileName)}
          aria-label='Download'
        >
          <Download className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );

  const renderSubComponent = (row: Row<ChatWithAssets>) => {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className='overflow-hidden'
      >
        <div className='p-4 space-y-3 bg-background'>
          {row.original.assets.map(renderAsset)}
        </div>
      </motion.div>
    );
  };

  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='margin-left-right-side p-6 flex flex-col min-h-screen'>
        <Topbar
          pageName='Assets'
          button={
            <Button
              onClick={handleDownloadAll}
              disabled={isLoading || data.length === 0 || downloading === 'all'}
            >
              {downloading === 'all' ? (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              ) : (
                <FolderDown className='w-4 h-4 mr-2' />
              )}
              Download All Assets
            </Button>
          }
        />

        <div className='mt-6'>
          {isLoading ? (
            <div className='flex items-center justify-center h-64'>
              <Loader2 className='w-8 h-8 animate-spin text-primary' />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              loading={isLoading}
              renderSubComponent={renderSubComponent}
            />
          )}
        </div>
      </main>
    </div>
  );
}
