const baseUrl = process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:4173';

const requiredHeaders = [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'permissions-policy',
  'strict-transport-security'
];

async function assertOk(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}`);
  }
  return response;
}

const home = await assertOk('/');
for (const header of requiredHeaders) {
  if (!home.headers.get(header)) {
    throw new Error(`Missing required header: ${header}`);
  }
}

await assertOk('/health');
await assertOk('/ready');

console.log(`Deployment verification passed for ${baseUrl}`);
