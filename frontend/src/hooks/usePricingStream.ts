import { useEffect, useRef, useState, useCallback } from "react";
import { PricingSocket } from "@/services/pricingSocket";
import type { SpotPriceResponse, EnergySource } from "@/types";

/* ── Hook ────────────────────────────────────────────── */

interface UsePricingStreamOptions {
  /** Filter to specific energy sources */
  sources?: EnergySource[];
  /** Enable/disable the stream (default: true) */
  enabled?: boolean;
}

interface UsePricingStreamReturn {
  /** Latest prices from WebSocket (all sources or filtered) */
  prices: SpotPriceResponse[];
  /** Whether the WebSocket is currently connected */
  isConnected: boolean;
  /** Whether we're waiting for the first message */
  isLoading: boolean;
  /** Last error event, if any */
  error: Event | CloseEvent | null;
  /** Manually reconnect */
  reconnect: () => void;
}

export function usePricingStream(
  options: UsePricingStreamOptions = {},
): UsePricingStreamReturn {
  const { sources, enabled = true } = options;
  const [prices, setPrices] = useState<SpotPriceResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Event | CloseEvent | null>(null);
  const socketRef = useRef<PricingSocket | null>(null);

  const connect = useCallback(() => {
    socketRef.current?.disconnect();

    const socket = new PricingSocket({
      sources,
      onUpdate: (data) => {
        setPrices(data);
        setIsLoading(false);
      },
      onOpen: () => {
        setIsConnected(true);
        setError(null);
      },
      onError: (err) => {
        setIsConnected(false);
        setError(err);
      },
    });

    socketRef.current = socket;
    socket.connect();
  }, [sources]);

  useEffect(() => {
    if (!enabled) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled, connect]);

  const reconnect = useCallback(() => {
    setIsLoading(true);
    connect();
  }, [connect]);

  return { prices, isConnected, isLoading, error, reconnect };
}
