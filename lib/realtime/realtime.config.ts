export const realtimeConfig = {
  // Change this single line to switch providers!
  provider: (process.env.NEXT_PUBLIC_REALTIME_PROVIDER || 'liveblocks') as
    | 'liveblocks'
    | 'cloudflare',

  // Provider-specific configs
  liveblocks: {
    publicKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
  },
  cloudflare: {
    durableObjectUrl: process.env.NEXT_PUBLIC_CLOUDFLARE_DURABLE_OBJECT_URL,
  },
};
