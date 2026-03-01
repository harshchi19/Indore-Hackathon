import type { SpotPriceResponse, EnergySource } from "@/types";

/* ── Types ───────────────────────────────────────────── */

export type PriceUpdateHandler = (prices: SpotPriceResponse[]) => void;

interface PricingSocketOptions {
  /** Filter to specific energy sources. Omit or empty = all sources. */
  sources?: EnergySource[];
  /** Auto-reconnect on close (default: true) */
  reconnect?: boolean;
  /** Max reconnect delay in ms (default: 10000) */
  maxReconnectDelay?: number;
  /** Called on every price tick */
  onUpdate?: PriceUpdateHandler;
  /** Called when connection opens */
  onOpen?: () => void;
  /** Called when connection errors or closes */
  onError?: (error: Event | CloseEvent) => void;
}

/* ── PricingSocket class ─────────────────────────────── */

export class PricingSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private options: Required<
    Pick<PricingSocketOptions, "reconnect" | "maxReconnectDelay">
  > &
    PricingSocketOptions;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(options: PricingSocketOptions = {}) {
    // Route through Vite proxy in dev (same-origin ws://localhost:8080/api/...)
    // so no CORS headers are needed.  In production, fall back to whatever
    // VITE_API_BASE_URL is set to (may be an absolute URL like https://api.example.com/api/v1).
    const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
    let wsBase: string;
    if (apiBase && /^https?:\/\//.test(apiBase)) {
      // Absolute URL configured – connect directly (Docker / production)
      wsBase = apiBase.replace(/^http/, "ws");
    } else {
      // Relative or unset – use the page's own origin so the request goes
      // through the Vite dev-server /api proxy (→ localhost:8000).
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const path = apiBase ?? "/api/v1";
      wsBase = `${proto}//${window.location.host}${path}`;
    }
    this.url = wsBase + "/pricing/ws/stream";
    this.options = {
      reconnect: true,
      maxReconnectDelay: 10_000,
      ...options,
    };
  }

  /** Open the WebSocket connection */
  connect(): void {
    if (this.disposed) return;
    this.cleanup();

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.options.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data) as SpotPriceResponse[];
        const filtered =
          this.options.sources && this.options.sources.length > 0
            ? raw.filter((p) =>
                this.options.sources!.includes(p.energy_source as EnergySource),
              )
            : raw;
        this.options.onUpdate?.(filtered);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onerror = (error) => {
      this.options.onError?.(error);
    };

    this.ws.onclose = (event) => {
      this.options.onError?.(event);
      if (this.options.reconnect && !this.disposed) {
        this.scheduleReconnect();
      }
    };
  }

  /** Close the connection and prevent reconnects */
  disconnect(): void {
    this.disposed = true;
    this.cleanup();
  }

  /** Get connection readyState */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /* ── Private helpers ─────────────────────────────── */

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempt,
      this.options.maxReconnectDelay,
    );
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}

/* ── Convenience functions ───────────────────────────── */

/** Create and connect a pricing socket. Returns disconnect function. */
export function connectPricingStream(
  onUpdate: PriceUpdateHandler,
  sources?: EnergySource[],
): () => void {
  const socket = new PricingSocket({ sources, onUpdate });
  socket.connect();
  return () => socket.disconnect();
}

/** Subscribe to a single energy source. Returns disconnect function. */
export function subscribeToEnergySource(
  source: EnergySource,
  onUpdate: (price: SpotPriceResponse) => void,
): () => void {
  return connectPricingStream((prices) => {
    const match = prices.find(
      (p) => p.energy_source === source,
    );
    if (match) onUpdate(match);
  }, [source]);
}
