function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function parseConnectOrigin(rawValue, sourceLabel, { allowRelative = false } = {}) {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  if (value.includes("*")) {
    throw new Error(
      `${sourceLabel} contains an unsupported wildcard origin: ${value}. Use explicit origins only.`,
    );
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    if (allowRelative && value.startsWith("/")) {
      return null;
    }
    throw new Error(`${sourceLabel} must contain absolute URL origins. Invalid value: ${value}`);
  }

  const isHttps = parsed.protocol === "https:";
  const isLocal = isLocalHostname(parsed.hostname);
  const isProduction = process.env.NODE_ENV === "production";

  if (!isHttps && !(parsed.protocol === "http:" && isLocal)) {
    throw new Error(
      `${sourceLabel} must use https (except local http://localhost development origins). Invalid value: ${value}`,
    );
  }

  if (isProduction && !isLocal && !isHttps) {
    throw new Error(`${sourceLabel} must use https in production for non-local origins. Invalid value: ${value}`);
  }

  return parsed.origin;
}

function getTrustedConnectOrigins() {
  const connectSrcRaw = process.env.CSP_CONNECT_SRC ?? "";
  const configuredOrigins = connectSrcRaw
    .split(",")
    .map((item) => parseConnectOrigin(item, "CSP_CONNECT_SRC"))
    .filter(Boolean);

  const derivedApiOrigin = parseConnectOrigin(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
    "NEXT_PUBLIC_API_BASE_URL",
    { allowRelative: true },
  );

  const originSet = new Set(configuredOrigins);
  if (derivedApiOrigin) {
    originSet.add(derivedApiOrigin);
  }

  return [...originSet];
}

const connectSrcDirective = ["'self'", ...getTrustedConnectOrigins()].join(" ");

const csp = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  `connect-src ${connectSrcDirective}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,

  async rewrites() {
    return [
      { source: "/health", destination: "/api/health" },
      { source: "/ready", destination: "/api/ready" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
