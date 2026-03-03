/* eslint-disable react/prop-types */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const QueryClientContext = createContext(undefined);

function serializeKey(key) {
  return JSON.stringify(key);
}

function keyStartsWith(key, partial) {
  if (!Array.isArray(key) || !Array.isArray(partial)) return false;
  return partial.every((value, index) => JSON.stringify(key[index]) === JSON.stringify(value));
}

export class QueryClient {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  _notify(queryKey) {
    const cacheKey = serializeKey(queryKey);
    const set = this.listeners.get(cacheKey);
    if (!set) return;
    set.forEach((listener) => listener());
  }

  _ensureEntry(queryKey) {
    const cacheKey = serializeKey(queryKey);
    const existing = this.cache.get(cacheKey);
    if (existing) return existing;
    const entry = {
      queryKey,
      data: undefined,
      error: null,
      promise: null,
      stale: true,
      updatedAt: 0,
    };
    this.cache.set(cacheKey, entry);
    return entry;
  }

  getQueryData(queryKey) {
    return this._ensureEntry(queryKey).data;
  }

  setQueryData(queryKey, data) {
    const entry = this._ensureEntry(queryKey);
    entry.data = data;
    entry.error = null;
    entry.stale = false;
    entry.updatedAt = Date.now();
    this._notify(queryKey);
    return data;
  }

  async fetchQuery({ queryKey, queryFn }) {
    const entry = this._ensureEntry(queryKey);
    if (entry.promise) {
      return entry.promise;
    }

    entry.promise = Promise.resolve()
      .then(() => queryFn())
      .then((data) => {
        entry.data = data;
        entry.error = null;
        entry.stale = false;
        entry.updatedAt = Date.now();
        entry.promise = null;
        this._notify(queryKey);
        return data;
      })
      .catch((error) => {
        entry.error = error;
        entry.promise = null;
        entry.stale = false;
        entry.updatedAt = Date.now();
        this._notify(queryKey);
        throw error;
      });

    return entry.promise;
  }

  subscribe(queryKey, listener) {
    const cacheKey = serializeKey(queryKey);
    const set = this.listeners.get(cacheKey) ?? new Set();
    set.add(listener);
    this.listeners.set(cacheKey, set);

    return () => {
      const active = this.listeners.get(cacheKey);
      if (!active) return;
      active.delete(listener);
      if (active.size === 0) {
        this.listeners.delete(cacheKey);
      }
    };
  }

  invalidateQueries({ queryKey }) {
    this.cache.forEach((entry) => {
      if (keyStartsWith(entry.queryKey, queryKey)) {
        entry.stale = true;
        this._notify(entry.queryKey);
      }
    });
  }
}

export function QueryClientProvider({ client, children }) {
  const value = useMemo(() => ({ client }), [client]);
  return React.createElement(QueryClientContext.Provider, { value }, children);
}

export function useQueryClient() {
  const value = useContext(QueryClientContext);
  if (!value) {
    throw new Error("useQueryClient must be used inside QueryClientProvider");
  }
  return value.client;
}

export function useQuery(options) {
  const { queryKey, queryFn, enabled = true } = options;
  const client = useQueryClient();
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const [state, setState] = useState(() => {
    const data = client.getQueryData(queryKey);
    return {
      data,
      isLoading: enabled && data === undefined,
      isFetching: false,
      error: null,
      isError: false,
    };
  });

  useEffect(() => {
    let active = true;

    const sync = () => {
      const entry = client._ensureEntry(queryKey);
      setState((prev) => ({
        ...prev,
        data: entry.data,
        error: entry.error,
        isError: Boolean(entry.error),
      }));
      if (enabled && entry.stale) {
        setState((prev) => ({ ...prev, isFetching: true, isLoading: entry.data === undefined }));
        client
          .fetchQuery({ queryKey, queryFn: () => queryFnRef.current() })
          .then(() => {
            if (!active) return;
            setState((prev) => ({ ...prev, isFetching: false, isLoading: false }));
          })
          .catch((error) => {
            if (!active) return;
            setState((prev) => ({
              ...prev,
              isFetching: false,
              isLoading: false,
              error,
              isError: true,
            }));
          });
      }
    };

    const unsubscribe = client.subscribe(queryKey, sync);
    sync();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [client, enabled, queryKey]);

  return state;
}
