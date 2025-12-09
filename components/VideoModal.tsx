'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

export function VideoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            'px-6 py-2.5 rounded-lg text-sm font-medium',
            'bg-secondary text-secondary-foreground',
            'shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)]',
            'hover:bg-secondary/80',
            'transition-colors duration-200 cursor-pointer',
            'flex items-center gap-2'
          )}
        >
          <Play className="h-4 w-4" />
          How it works
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-6xl w-[95vw] md:min-w-[800px] md:w-[85vw] p-0 overflow-hidden bg-black border-none"
        showCloseButton={false}
      >
        {/* Close button */}
        <DialogClose className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 hover:bg-black/70 transition-colors">
          <X className="h-5 w-5 text-white" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Video */}
        <div className="relative aspect-video w-full">
          <video
            className="w-full h-full"
            controls
            autoPlay
            src="/chatsharelaunch-final.mp4"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}
