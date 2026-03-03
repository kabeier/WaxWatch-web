import "@testing-library/jest-dom";

globalThis.fetch = (async () =>
  new Response(JSON.stringify({ items: [], unreadCount: 0, connected: false }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })) as typeof fetch;
