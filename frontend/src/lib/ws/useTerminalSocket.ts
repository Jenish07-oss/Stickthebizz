"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAccessToken } from "../api/client";
import {
  playScanChime,
  playApprovalBell,
  playRejectBuzz,
  playMilestoneFanfare,
} from "../audio";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export interface UseTerminalSocketOptions {
  merchantId?: string;
  customerId?: string;
  onCheckInNew?: (payload: any) => void;
  onCheckInApproved?: (payload: any) => void;
  onCheckInRejected?: (payload: any) => void;
  onRewardBurned?: (payload: any) => void;
  onQrRotated?: (payload: any) => void;
  onQueueUpdated?: (payload: any) => void;
}

export function useTerminalSocket(options: UseTerminalSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Lazy initialize HTML5 audio element for merchant terminal chime
  useEffect(() => {
    if (typeof window !== "undefined") {
      chimeAudioRef.current = new Audio("/sounds/chime.mp3");
      chimeAudioRef.current.volume = 0.6;
    }
  }, []);

  const playChime = useCallback(() => {
    try {
      if (chimeAudioRef.current) {
        chimeAudioRef.current.currentTime = 0;
        chimeAudioRef.current.play().catch(() => {
          playScanChime(); // Synthesizer fallback
        });
      } else {
        playScanChime();
      }
    } catch {
      playScanChime();
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = getAccessToken() || "";
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (options.merchantId) params.set("merchantId", options.merchantId);
    if (options.customerId) params.set("customerId", options.customerId);

    const wsUrl = `${WS_BASE_URL}?${params.toString()}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0;

        // Start 25s ping-pong keepalive
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.event;
          const payload = data.payload || data;

          if (eventType === "checkin.new" || eventType === "new_scan") {
            playChime();
            options.onCheckInNew?.(payload);
          } else if (eventType === "checkin.approved" || eventType === "visit_approved") {
            playApprovalBell();
            options.onCheckInApproved?.(payload);
          } else if (eventType === "checkin.rejected" || eventType === "visit_rejected") {
            playRejectBuzz();
            options.onCheckInRejected?.(payload);
          } else if (eventType === "reward_burned") {
            playMilestoneFanfare();
            options.onRewardBurned?.(payload);
          } else if (eventType === "qr_rotated") {
            options.onQrRotated?.(payload);
          } else if (eventType === "queue_updated") {
            options.onQueueUpdated?.(payload);
          }
        } catch {
          // Ignore non-json frames
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Exponential backoff reconnect: 1s, 2s, 4s, 8s, up to max 15s
        const backoffMs = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
        retryCountRef.current++;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, backoffMs);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setIsConnected(false);
    }
  }, [options, playChime]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof message === "string" ? message : JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    send,
  };
}

