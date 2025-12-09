'use client';

import { useState } from 'react';
import { Copy, Check, Monitor } from 'lucide-react';
import Image from 'next/image';

export default function MobileBlockedPage() {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    // Remove /mobile-blocked from the URL when copying
    const cleanUrl = window.location.origin;
    navigator.clipboard.writeText(cleanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <Image src="/logo.svg" height={48} width={48} alt="logo" />
          <div className="font-heading text-2xl font-bold text-black dark:text-white">
            ChatShare
          </div>
        </div>

        <div className="flex justify-center">
          <Monitor className="h-16 w-16 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Desktop Only</h1>
          <p className="text-muted-foreground">
            This app is not currently functional on mobile devices. Please open
            it on a desktop or tablet for the best experience.
          </p>
        </div>

        <button
          onClick={copyUrl}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy URL
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground">
          Copy this link and open it on your desktop
        </p>
      </div>
    </div>
  );
}
