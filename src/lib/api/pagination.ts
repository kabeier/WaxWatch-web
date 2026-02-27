const DEFAULT_MAX_LIMIT = 100;

export type LimitOffsetParams = {
  limit?: number;
  offset?: number;
};

export type CursorParams = {
  cursor?: string;
  limit?: number;
};

export function validateLimit(limit: number | undefined, maxLimit = DEFAULT_MAX_LIMIT): void {
  if (limit === undefined) {
    return;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    throw new Error(`"limit" must be an integer between 1 and ${maxLimit}`);
  }
}

export function validateOffset(offset: number | undefined): void {
  if (offset === undefined) {
    return;
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error('"offset" must be a non-negative integer');
  }
}

export function validateCursor(cursor: string | undefined): void {
  if (cursor === undefined) {
    return;
  }

  if (cursor.trim().length === 0) {
    throw new Error('"cursor" must not be empty');
  }
}

export function appendLimitOffset(params: URLSearchParams, options: LimitOffsetParams, maxLimit?: number): URLSearchParams {
  validateLimit(options.limit, maxLimit);
  validateOffset(options.offset);

  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }

  return params;
}

export function appendCursorPagination(params: URLSearchParams, options: CursorParams, maxLimit?: number): URLSearchParams {
  validateLimit(options.limit, maxLimit);
  validateCursor(options.cursor);

  if (options.cursor !== undefined) {
    params.set('cursor', options.cursor);
  }

  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  return params;
}
