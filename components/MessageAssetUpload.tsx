'use client';

import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
} from '@/components/ui/file-upload';

interface MessageAssetUploadProps {
  messageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesAdded: (messageId: string, files: File[]) => void;
  existingFiles?: File[];
}

export function MessageAssetUpload({
  messageId,
  open,
  onOpenChange,
  onFilesAdded,
  existingFiles = [],
}: MessageAssetUploadProps) {
  const [files, setFiles] = React.useState<File[]>(existingFiles);

  // Sync files with existingFiles when dialog opens or messageId changes
  React.useEffect(() => {
    if (open) {
      setFiles(existingFiles);
    }
  }, [open, messageId, existingFiles]);

  const onFileValidate = React.useCallback(
    (file: File): string | null => {
      // Calculate total size including existing files
      const totalSize = files.reduce((sum, f) => sum + f.size, 0) + file.size;
      const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB per message

      if (totalSize > MAX_TOTAL_SIZE) {
        return 'Total file size cannot exceed 100MB per message';
      }

      return null;
    },
    [files]
  );

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast.error(message, {
      description: `"${
        file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
      }" was rejected`,
    });
  }, []);

  const handleSave = () => {
    onFilesAdded(messageId, files);
    // Clear the dialog's file state after saving
    setFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Upload Assets for Message</DialogTitle>
          <DialogDescription>
            Upload files to attach to this message (max 100MB total per message)
          </DialogDescription>
        </DialogHeader>

        <FileUpload
          value={files}
          onValueChange={setFiles}
          onFileValidate={onFileValidate}
          onFileReject={onFileReject}
          maxSize={100 * 1024 * 1024} // 100MB individual file limit
          className='w-full max-w-full'
          multiple
        >
          <FileUploadDropzone>
            <div className='flex flex-col items-center gap-1'>
              <div className='flex items-center justify-center rounded-full border p-2.5'>
                <Upload className='size-6 text-muted-foreground' />
              </div>
              <p className='font-medium text-sm'>Drag & drop files here</p>
              <p className='text-muted-foreground text-xs'>
                Or click to browse (Images, PDFs, Documents, etc.)
              </p>
            </div>
          </FileUploadDropzone>
          <FileUploadList className='max-w-full overflow-hidden'>
            {files.map((file) => (
              <FileUploadItem key={file.name} value={file} className='max-w-full'>
                <FileUploadItemPreview className='shrink-0' />
                <FileUploadItemMetadata className='min-w-0 flex-1' />
                <FileUploadItemDelete asChild>
                  <Button variant='ghost' size='icon' className='size-7 shrink-0'>
                    <X />
                  </Button>
                </FileUploadItemDelete>
              </FileUploadItem>
            ))}
          </FileUploadList>
        </FileUpload>

        <div className='flex justify-end gap-2 mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Assets</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
