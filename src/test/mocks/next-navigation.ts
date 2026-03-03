type SearchParamsState = {
  params: Record<string, string | undefined>;
};

const state: SearchParamsState = {
  params: {},
};

export function __setSearchParams(params: SearchParamsState["params"]) {
  state.params = params;
}

export function useSearchParams() {
  return {
    get: (key: string) => state.params[key] ?? null,
  };
}
