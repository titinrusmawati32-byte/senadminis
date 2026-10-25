/**
 * MemoryCache with Realtime Multi-Device Sync & TTL
 * Memastikan akses dari berbagai perangkat (HP, Tablet, Laptop) selalu mendapatkan data terbaru
 * secara realtime tanpa terhalang cache basi.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  // TTL sangat singkat (5 detik) untuk responsivitas UI sekaligus sinkronisasi cepat antar perangkat
  private defaultTTL = 5 * 1000;
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.setupRealtimeListeners();
  }

  private setupRealtimeListeners() {
    if (typeof window === 'undefined') return;

    // 1. Ketika user membuka kembali tab di HP/laptop atau berganti aplikasi,
    // langsung bersihkan cache & picu sinkronisasi data terbaru.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.invalidate();
        window.dispatchEvent(new CustomEvent('app:realtime-refresh', { detail: { source: 'visibility' } }));
      }
    });

    window.addEventListener('focus', () => {
      this.invalidate();
      window.dispatchEvent(new CustomEvent('app:realtime-refresh', { detail: { source: 'focus' } }));
    });

    // 2. Cross-tab synchronization via BroadcastChannel
    try {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('admin_guru_realtime_sync');
        this.channel.onmessage = (event) => {
          const { table } = event.data || {};
          this.invalidate(table);
          window.dispatchEvent(new CustomEvent('app:realtime-refresh', { detail: event.data }));
        };
      }
    } catch {
      // Browser lama yang belum mendukung BroadcastChannel
    }
  }

  get<T>(key: string, ttl: number = this.defaultTTL): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Mengirim sinyal perubahan ke tab/jendela lain
   */
  broadcastChange(table: string, action: string) {
    this.invalidate(table);
    if (this.channel) {
      try {
        this.channel.postMessage({ table, action, timestamp: Date.now() });
      } catch {}
    }
  }
}

export const memoryCache = new MemoryCache();
