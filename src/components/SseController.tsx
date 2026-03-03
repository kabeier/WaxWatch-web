"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseAccessToken } from "@/lib/auth-session";
import { queryKeys } from "@/lib/query/keys";

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

function getBackoffDelay(attempt: number) {
  const exponentialDelay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 300);
  return exponentialDelay + jitter;
}

export default function SseController() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: number | undefined;
    let reconnectAttempt = 0;
    let active = true;

    const stop = () => {
      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
      }
      reconnectTimer = undefined;
      if (eventSource) {
        eventSource.close();
      }
      eventSource = null;
    };

    const scheduleReconnect = () => {
      if (!active || reconnectTimer !== undefined) {
        return;
      }

      const token = getSupabaseAccessToken();
      if (!token) {
        stop();
        return;
      }

      const delayMs = getBackoffDelay(reconnectAttempt);
      reconnectAttempt += 1;

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, delayMs);
    };

    const connect = () => {
      const token = getSupabaseAccessToken();
      if (!token || !active) {
        stop();
        return;
      }

      eventSource = new EventSource("/api/stream/events");

      eventSource.onopen = () => {
        reconnectAttempt = 0;
      };

      eventSource.addEventListener("notification", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
      });

      eventSource.onerror = () => {
        if (!active) {
          return;
        }

        eventSource?.close();
        eventSource = null;

        const hasToken = getSupabaseAccessToken();
        if (!hasToken) {
          stop();
          return;
        }

        scheduleReconnect();
      };
    };

    const handleAuthEvent = (event: Event) => {
      const authEvent = event as CustomEvent<string>;
      if (authEvent.detail === "reauth-required" || authEvent.detail === "signed-out") {
        stop();
      }
    };

    connect();
    window.addEventListener("waxwatch:auth", handleAuthEvent as EventListener);

    return () => {
      active = false;
      window.removeEventListener("waxwatch:auth", handleAuthEvent as EventListener);
      stop();
    };
  }, [queryClient]);

  return null;
}
