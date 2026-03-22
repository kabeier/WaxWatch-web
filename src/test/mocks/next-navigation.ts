type NavigationState = {
  params: Record<string, string | undefined>;
  pathname: string;
};

const state: NavigationState = {
  params: {},
  pathname: "/search",
};

export function __setSearchParams(params: NavigationState["params"]) {
  state.params = params;
}

export function __setPathname(pathname: string) {
  state.pathname = pathname;
}

export function useSearchParams() {
  return {
    get: (key: string) => state.params[key] ?? null,
  };
}

export function usePathname() {
  return state.pathname;
}
