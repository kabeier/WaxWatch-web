"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { webAuthSessionAdapter } from "@/lib/auth-session";
import { handleAuthorizationFailureWithAdapter } from "@/lib/auth/session-lifecycle";
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
    let reconnectTimer: number | undefined;
    let streamAbortController: AbortController | null = null;
    let reconnectAttempt = 0;
    let active = true;

    const stop = () => {
      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
      }
      reconnectTimer = undefined;
      streamAbortController?.abort();
      streamAbortController = null;
    };

    const hasAccessToken = async () => Boolean(await webAuthSessionAdapter.getAccessToken());

    const processStream = async (response: Response) => {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("sse_missing_response_body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let currentEventName = "message";

      const flushLine = (rawLine: string) => {
        const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
        if (line.length === 0) {
          if (currentEventName === "notification") {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
          }
          currentEventName = "message";
          return;
        }

        if (line.startsWith("event:")) {
          currentEventName = line.slice(6).trim() || "message";
        }
      };

      while (active) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.length > 0) {
            flushLine(buffer);
          }
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        let lineBreakIndex = buffer.indexOf("\n");
        while (lineBreakIndex !== -1) {
          const line = buffer.slice(0, lineBreakIndex);
          flushLine(line);
          buffer = buffer.slice(lineBreakIndex + 1);
          lineBreakIndex = buffer.indexOf("\n");
        }
      }
    };

    const scheduleReconnect = async () => {
      if (!active || reconnectTimer !== undefined) {
        return;
      }

      const token = await webAuthSessionAdapter.getAccessToken();
      if (!token) {
        stop();
        return;
      }

      const delayMs = getBackoffDelay(reconnectAttempt);
      reconnectAttempt += 1;

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        void connect();
      }, delayMs);
    };

    const connect = async () => {
      const token = await webAuthSessionAdapter.getAccessToken();
      if (!token || !active) {
        stop();
        return;
      }

      streamAbortController = new AbortController();

      try {
        const response = await fetch("/api/stream/events", {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: streamAbortController.signal,
        });

        if (!active) {
          return;
        }

        if (response.status === 401 || response.status === 403) {
          await handleAuthorizationFailureWithAdapter(webAuthSessionAdapter, {
            path: "/api/stream/events",
            status: response.status,
          });
          stop();
          return;
        }

        if (!response.ok) {
          throw new Error(`sse_connect_failed_${response.status}`);
        }

        reconnectAttempt = 0;
        await processStream(response);

        if (!active) {
          return;
        }

        if (!(await hasAccessToken())) {
          stop();
          return;
        }

        await scheduleReconnect();
      } catch {
        if (!active || streamAbortController?.signal.aborted) {
          return;
        }

        console.warn("[SSE] stream connection failed; scheduling reconnect", {
          endpoint: "/api/stream/events",
          reconnectAttempt,
        });

        if (!(await hasAccessToken())) {
          stop();
          return;
        }

        await scheduleReconnect();
      }
    };

    const handleAuthEvent = (event: Event) => {
      const authEvent = event as CustomEvent<string>;
      if (authEvent.detail === "reauth-required" || authEvent.detail === "signed-out") {
        stop();
      }
    };

    void connect();
    window.addEventListener("waxwatch:auth", handleAuthEvent as EventListener);

    return () => {
      active = false;
      window.removeEventListener("waxwatch:auth", handleAuthEvent as EventListener);
      stop();
    };
  }, [queryClient]);

  return null;
}
