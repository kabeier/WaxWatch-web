"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { SearchRequest } from "@/lib/api/domains/types";
import { useSaveSearchAlertMutation, useSearchMutation } from "@/lib/query/hooks";

function parseCsv(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

type SearchPageStateValue = {
  searchMutation: ReturnType<typeof useSearchMutation>;
  saveAlertMutation: ReturnType<typeof useSaveSearchAlertMutation>;
  keywordsInput: string;
  setKeywordsInput: (value: string) => void;
  providersInput: string;
  setProvidersInput: (value: string) => void;
  pageInput: string;
  setPageInput: (value: string) => void;
  pageSizeInput: string;
  setPageSizeInput: (value: string) => void;
  alertName: string;
  setAlertName: (value: string) => void;
  pollIntervalInput: string;
  setPollIntervalInput: (value: string) => void;
  lastSubmittedQuery: SearchRequest | null;
  setLastSubmittedQuery: (value: SearchRequest | null) => void;
  page: number;
  pageSize: number;
  pollInterval: number;
  searchErrors: string[];
  saveAlertErrors: string[];
  isBusy: boolean;
  searchPageHasError: boolean;
  saveAlertHasError: boolean;
  queryPayload: SearchRequest;
  searchItems: Array<{
    id: string;
    title: string;
    provider?: string | null;
    price?: number | null;
    currency?: string | null;
    condition?: string | null;
    seller?: string | null;
    location?: string | null;
    public_url: string;
    external_id?: string | null;
  }>;
  searchPagination: { returned?: number; total?: number } | undefined;
  providersSearched: string[];
};

const SearchPageStateContext = createContext<SearchPageStateValue | null>(null);

export function SearchPageStateProvider({ children }: { children: ReactNode }) {
  const searchMutation = useSearchMutation();
  const saveAlertMutation = useSaveSearchAlertMutation();

  const [keywordsInput, setKeywordsInput] = useState("jazz");
  const [providersInput, setProvidersInput] = useState("discogs");
  const [pageInput, setPageInput] = useState("1");
  const [pageSizeInput, setPageSizeInput] = useState("24");
  const [alertName, setAlertName] = useState("Saved from search");
  const [pollIntervalInput, setPollIntervalInput] = useState("600");
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<SearchRequest | null>(null);

  const page = Number(pageInput);
  const pageSize = Number(pageSizeInput);
  const pollInterval = Number(pollIntervalInput);

  const searchErrors = useMemo(() => {
    const errors: string[] = [];

    if (parseCsv(keywordsInput).length === 0) {
      errors.push("Enter at least one keyword to run a search.");
    }

    if (parseCsv(providersInput).length === 0) {
      errors.push("Enter at least one provider to run a search.");
    }

    if (!Number.isInteger(page) || page < 1) {
      errors.push("Page must be an integer greater than or equal to 1.");
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      errors.push("Page size must be an integer between 1 and 100.");
    }

    return errors;
  }, [keywordsInput, page, pageSize, providersInput]);

  const saveAlertErrors = useMemo(() => {
    const errors: string[] = [];

    if (alertName.trim().length < 1 || alertName.trim().length > 120) {
      errors.push("Alert name must be between 1 and 120 characters.");
    }

    if (!Number.isInteger(pollInterval) || pollInterval < 30 || pollInterval > 86400) {
      errors.push("Poll interval must be an integer between 30 and 86400 seconds.");
    }

    return errors;
  }, [alertName, pollInterval]);

  const isBusy = searchMutation.isPending || saveAlertMutation.isPending;
  const searchPageHasError =
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100;
  const saveAlertHasError =
    alertName.trim().length < 1 ||
    alertName.trim().length > 120 ||
    !Number.isInteger(pollInterval) ||
    pollInterval < 30 ||
    pollInterval > 86400;

  const queryPayload: SearchRequest = {
    keywords: parseCsv(keywordsInput),
    providers: parseCsv(providersInput),
    page,
    page_size: pageSize,
  };
  const searchItems = Array.isArray(searchMutation.data?.items) ? searchMutation.data.items : [];
  const searchPagination = searchMutation.data?.pagination;
  const providersSearched = Array.isArray(searchMutation.data?.providers_searched)
    ? searchMutation.data.providers_searched
    : [];

  return (
    <SearchPageStateContext.Provider
      value={{
        searchMutation,
        saveAlertMutation,
        keywordsInput,
        setKeywordsInput,
        providersInput,
        setProvidersInput,
        pageInput,
        setPageInput,
        pageSizeInput,
        setPageSizeInput,
        alertName,
        setAlertName,
        pollIntervalInput,
        setPollIntervalInput,
        lastSubmittedQuery,
        setLastSubmittedQuery,
        page,
        pageSize,
        pollInterval,
        searchErrors,
        saveAlertErrors,
        isBusy,
        searchPageHasError,
        saveAlertHasError,
        queryPayload,
        searchItems,
        searchPagination,
        providersSearched,
      }}
    >
      {children}
    </SearchPageStateContext.Provider>
  );
}

export function useSearchPageState() {
  const context = useContext(SearchPageStateContext);

  if (!context) {
    throw new Error("useSearchPageState must be used within SearchPageStateProvider");
  }

  return context;
}
