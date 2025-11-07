import { RealtimeService } from './interfaces/realtime.interface';
import { LiveblocksRealtimeService } from './services/liveblocks.service';

type RealtimeProvider = 'liveblocks' | 'cloudflare';

export class RealtimeFactory {
  static create(provider: RealtimeProvider): RealtimeService {
    switch (provider) {
      case 'liveblocks':
        const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error(
            'NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not defined in environment variables'
          );
        }
        return new LiveblocksRealtimeService(publicKey);

      case 'cloudflare':
        const durableObjectUrl =
          process.env.NEXT_PUBLIC_CLOUDFLARE_DURABLE_OBJECT_URL;
        if (!durableObjectUrl) {
          throw new Error(
            'NEXT_PUBLIC_CLOUDFLARE_DURABLE_OBJECT_URL is not defined in environment variables'
          );
        }
        // TODO: Implement CloudflareRealtimeService when ready
        throw new Error('Cloudflare provider not implemented yet');

      default:
        throw new Error(`Unknown realtime provider: ${provider}`);
    }
  }
}
