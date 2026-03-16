"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { webAuthSessionAdapter } from "@/lib/auth-session";
import { handleAuthorizationFailureWithAdapter } from "@/lib/auth/session-lifecycle";
import { queryKeys } from "@/lib/query/keys";

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

function isSseContentType(contentType: string | null) {
  if (!contentType) {
    return false;
  }

  const [mimeType] = contentType.split(";", 1).map((segment) => segment.trim());
  return mimeType?.toLowerCase() === "text/event-stream";
}

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

    const processStream = async (response: Response) => {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("sse_missing_response_body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let blockHasNotification = false;

      const finalizeBlock = () => {
        if (blockHasNotification) {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
        }

        blockHasNotification = false;
      };

      const flushLine = (rawLine: string) => {
        const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
        if (line.length === 0) {
          finalizeBlock();
          return;
        }

        if (line.startsWith("event:")) {
          const eventName = line.slice(6).trim() || "message";
          blockHasNotification = eventName === "notification";
        }
      };

      while (active) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.length > 0) {
            const remainingLines = buffer.split("\n");
            for (const remainingLine of remainingLines) {
              flushLine(remainingLine);
            }
          }

          finalizeBlock();
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

    const scheduleReconnect = () => {
      if (!active || reconnectTimer !== undefined) {
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
      if (!active) {
        return;
      }

      const token = await webAuthSessionAdapter.getAccessToken();

      streamAbortController = new AbortController();

      try {
        const headers: HeadersInit = {
          Accept: "text/event-stream",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch("/api/stream/events", {
          method: "GET",
          headers,
          credentials: "include",
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

        if (!isSseContentType(response.headers.get("content-type"))) {
          throw new Error("sse_unexpected_content_type");
        }

        reconnectAttempt = 0;
        await processStream(response);

        if (!active) {
          return;
        }

        scheduleReconnect();
      } catch {
        if (!active || streamAbortController?.signal.aborted) {
          return;
        }

        console.warn("[SSE] stream connection failed; scheduling reconnect", {
          endpoint: "/api/stream/events",
          reconnectAttempt,
        });

        scheduleReconnect();
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
