import type * as React from "react";

export type QueryKey = readonly unknown[];

export class QueryClient {
  getQueryData<TData>(queryKey: QueryKey): TData | undefined;
  setQueryData<TData>(queryKey: QueryKey, data: TData): TData;
  fetchQuery<TData>(options: { queryKey: QueryKey; queryFn: () => Promise<TData> | TData }): Promise<TData>;
  subscribe(queryKey: QueryKey, listener: () => void): () => void;
  invalidateQueries(options: { queryKey: QueryKey }): void;
}

export function QueryClientProvider(props: { client: QueryClient; children: React.ReactNode }): React.ReactElement;
export function useQueryClient(): QueryClient;
export function useQuery<TData>(options: {
  queryKey: QueryKey;
  queryFn: () => Promise<TData> | TData;
  enabled?: boolean;
}): {
  data: TData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  isError: boolean;
};
