import { createApiClient, type ApiClientOptions } from './client';
import { createDomainServices } from './domains/index';

export type WaxWatchApiOptions = ApiClientOptions;

export function createWaxWatchApi(options: WaxWatchApiOptions) {
  const client = createApiClient(options);
  return createDomainServices(client);
}

export * from './client';
export * from './errors';
export * from './pagination';
export * from './rateLimit';
export * from './domains/types';
