type RouterState = {
  query: Record<string, string | string[] | undefined>;
};

const routerState: RouterState = {
  query: {},
};

export function __setRouterQuery(query: RouterState["query"]) {
  routerState.query = query;
}

export function useRouter() {
  return {
    query: routerState.query,
  };
}
