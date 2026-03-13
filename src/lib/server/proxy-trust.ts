import { isIP } from "node:net";

const DEFAULT_TRUSTED_PROXY_CIDRS = "127.0.0.1/32,::1/128";

type ParsedCidr = {
  version: 4 | 6;
  network: bigint;
  prefixLength: number;
};

export type TrustedProxyConfig = {
  cidrs: ParsedCidr[];
  invalidCidrs: string[];
};

const IPV4_BITS = 32;
const IPV6_BITS = 128;

function parseIpv4ToBigInt(ip: string): bigint {
  const octets = ip.split(".").map((part) => Number.parseInt(part, 10));
  return octets.reduce((acc, octet) => (acc << 8n) + BigInt(octet), 0n);
}

function expandIpv6(ip: string): string[] {
  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];

  const missingCount = 8 - (headParts.length + tailParts.length);
  const fillParts = missingCount > 0 ? Array.from({ length: missingCount }, () => "0") : [];

  return [...headParts, ...fillParts, ...tailParts].map((part) => part.padStart(4, "0"));
}

function normalizeIpv6Candidate(input: string): string {
  if (!input.includes(".")) {
    return input;
  }

  const lastColon = input.lastIndexOf(":");
  const ipv4Part = input.slice(lastColon + 1);
  const ipv4BigInt = parseIpv4ToBigInt(ipv4Part);
  const high = Number((ipv4BigInt >> 16n) & 0xffffn).toString(16);
  const low = Number(ipv4BigInt & 0xffffn).toString(16);
  return `${input.slice(0, lastColon)}:${high}:${low}`;
}

function parseIpv6ToBigInt(ip: string): bigint {
  const expanded = expandIpv6(normalizeIpv6Candidate(ip));
  return expanded.reduce((acc, part) => (acc << 16n) + BigInt(Number.parseInt(part, 16)), 0n);
}

function bitsForVersion(version: 4 | 6): number {
  return version === 4 ? IPV4_BITS : IPV6_BITS;
}

function toBigInt(ip: string, version: 4 | 6): bigint {
  return version === 4 ? parseIpv4ToBigInt(ip) : parseIpv6ToBigInt(ip);
}

function maskBits(bitCount: number, prefixLength: number): bigint {
  if (prefixLength === 0) {
    return 0n;
  }

  const hostBits = BigInt(bitCount - prefixLength);
  return ((1n << BigInt(bitCount)) - 1n) ^ ((1n << hostBits) - 1n);
}

function normalizeIp(ip: string): string | null {
  const trimmed = ip.trim();
  if (!trimmed) {
    return null;
  }

  const withoutBrackets =
    trimmed.startsWith("[") && trimmed.endsWith("]") ? trimmed.slice(1, -1) : trimmed;
  const withoutZone = withoutBrackets.split("%")[0] ?? withoutBrackets;

  return isIP(withoutZone) ? withoutZone : null;
}

function parseCidrEntry(entry: string): ParsedCidr | null {
  const [rawAddress, rawPrefix] = entry.split("/");
  const normalizedAddress = normalizeIp(rawAddress ?? "");

  if (!normalizedAddress) {
    return null;
  }

  const version = isIP(normalizedAddress) as 4 | 6;
  const maxBits = bitsForVersion(version);
  const defaultPrefix = maxBits;

  const prefixLength = rawPrefix === undefined ? defaultPrefix : Number.parseInt(rawPrefix, 10);
  if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > maxBits) {
    return null;
  }

  const ipValue = toBigInt(normalizedAddress, version);
  const network = ipValue & maskBits(maxBits, prefixLength);

  return { version, network, prefixLength };
}

export function parseTrustedProxyCidrs(rawValue: string | undefined): TrustedProxyConfig {
  const cidrs: ParsedCidr[] = [];
  const invalidCidrs: string[] = [];

  const source = rawValue && rawValue.trim().length > 0 ? rawValue : DEFAULT_TRUSTED_PROXY_CIDRS;

  source
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const parsed = parseCidrEntry(entry);
      if (!parsed) {
        invalidCidrs.push(entry);
        return;
      }

      cidrs.push(parsed);
    });

  return { cidrs, invalidCidrs };
}

export function isTrustedProxyIp(
  ip: string | null | undefined,
  config: TrustedProxyConfig,
): boolean {
  if (!ip) {
    return false;
  }

  const normalizedIp = normalizeIp(ip);
  if (!normalizedIp) {
    return false;
  }

  const version = isIP(normalizedIp) as 4 | 6;
  const ipValue = toBigInt(normalizedIp, version);

  return config.cidrs.some((cidr) => {
    if (cidr.version !== version) {
      return false;
    }

    const network = ipValue & maskBits(bitsForVersion(version), cidr.prefixLength);
    return network === cidr.network;
  });
}

export function getImmediateProxyIp(request: {
  ip?: string | null;
  headers: Headers;
}): string | null {
  const platformIp = normalizeIp(request.ip ?? "");
  if (platformIp) {
    return platformIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return null;
  }

  const chain = forwardedFor
    .split(",")
    .map((entry) => normalizeIp(entry))
    .filter((entry): entry is string => entry !== null);

  if (chain.length === 0) {
    return null;
  }

  return chain[chain.length - 1] ?? null;
}
