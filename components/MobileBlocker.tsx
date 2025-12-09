'use client';

import { useState } from 'react';
import { Copy, Check, Monitor } from 'lucide-react';

export function MobileBlocker() {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background p-6 md:hidden">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <Monitor className="h-16 w-16 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Desktop Only</h1>
          <p className="text-muted-foreground">
            This app is not currently functional on mobile devices. Please open it on a desktop or tablet for the best experience.
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
