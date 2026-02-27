const baseUrl = process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:4173';
const readyTimeoutMs = Number(process.env.READY_TIMEOUT_MS ?? 15000);
const readyPollIntervalMs = Number(process.env.READY_POLL_INTERVAL_MS ?? 500);

const requiredHeaders = [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'permissions-policy',
  'strict-transport-security'
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function assertOk(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}`);
  }
  return response;
}

async function waitForReady() {
  const deadline = Date.now() + readyTimeoutMs;
  let lastStatus = 0;

  while (Date.now() <= deadline) {
    const response = await fetch(`${baseUrl}/ready`);
    lastStatus = response.status;

    if (response.ok) {
      return;
    }

    if (response.status !== 503) {
      throw new Error(`/ready returned unexpected status ${response.status}`);
    }

    await sleep(readyPollIntervalMs);
  }

  throw new Error(`/ready did not become healthy within ${readyTimeoutMs}ms (last status ${lastStatus})`);
}

const home = await assertOk('/');
for (const header of requiredHeaders) {
  if (!home.headers.get(header)) {
    throw new Error(`Missing required header: ${header}`);
  }
}

await assertOk('/health');
await waitForReady();

console.log(`Deployment verification passed for ${baseUrl}`);
