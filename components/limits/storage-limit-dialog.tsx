'use client';

import { XIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatStorageSize } from '@/lib/user-tiers';

interface StorageLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStorage: number; // in bytes
  maxStorage: number; // in bytes
  userType: 'UNREGISTERED' | 'FREE';
  onSignup?: () => void;
  onUpgrade?: () => void;
}

export function StorageLimitDialog({
  open,
  onOpenChange,
  currentStorage,
  maxStorage,
  userType,
  onSignup,
  onUpgrade,
}: StorageLimitDialogProps) {
  const isUnregistered = userType === 'UNREGISTERED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Close button */}
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader>
          <DialogTitle>
            {isUnregistered ? 'Assets Not Available' : 'Storage Limit Reached'}
          </DialogTitle>
          <DialogDescription>
            {isUnregistered
              ? 'Asset uploads are not available for non-registered users.'
              : `You've reached your ${formatStorageSize(maxStorage)} storage limit.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {!isUnregistered && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Current storage</p>
                <p className="text-2xl font-bold">{formatStorageSize(currentStorage)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Limit</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {formatStorageSize(maxStorage)}
                </p>
              </div>
            </div>
          )}

          {isUnregistered ? (
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold mb-2">Sign up to get started</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 2GB storage for assets</li>
                <li>• Upload images, PDFs, and more</li>
                <li>• Up to 10 chats</li>
                <li>• Up to 1,000 words per chat</li>
              </ul>
            </div>
          ) : (
            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold mb-2">Upgrade to Pro</h4>
              <ul className="space-y-1 text-sm">
                <li>✨ 50GB storage for assets</li>
                <li>✨ Unlimited chats</li>
                <li>✨ Unlimited words per chat</li>
                <li>✨ Priority support</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          {isUnregistered ? (
            <Button onClick={onSignup} className="w-full">
              Sign up with Google
            </Button>
          ) : (
            <Button onClick={onUpgrade} className="w-full">
              Upgrade to Pro
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
