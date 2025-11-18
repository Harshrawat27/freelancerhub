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
import { authClient } from '@/lib/auth-client';

interface ShareRestrictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignup?: () => void;
}

export function ShareRestrictionDialog({
  open,
  onOpenChange,
  onSignup,
}: ShareRestrictionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        {/* Close button */}
        <DialogClose className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'>
          <XIcon className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </DialogClose>

        <DialogHeader>
          <DialogTitle>Private Sharing Not Available</DialogTitle>
          <DialogDescription>
            Sharing with specific email addresses is only available for
            registered users.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4'>
          <div className='rounded-lg bg-muted p-4'>
            <h4 className='font-semibold mb-2'>Sign up to unlock</h4>
            <ul className='space-y-1 text-sm text-muted-foreground'>
              <li>• Share chats with specific email addresses</li>
              <li>• Control who can view your chats</li>
              <li>• Up to 10 chats</li>
              <li>• Up to 1,000 words per chat</li>
              <li>• 2GB storage for assets</li>
            </ul>
          </div>

          <div className='rounded-lg border border-muted-foreground/20 p-4'>
            <p className='text-sm text-muted-foreground'>
              You can still share your chat publicly (visible to anyone with the
              link).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={async () => {
              await authClient.signIn.social({
                provider: 'google',
                callbackURL: '/create-chats',
              });
            }}
            className='w-full'
          >
            Sign up with Google
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
