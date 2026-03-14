const DEFAULT_TRUSTED_PROXY_CIDRS = "127.0.0.1/32,::1/128";

type IpVersion = 4 | 6;

type ParsedCidr = {
  version: IpVersion;
  network: bigint;
  prefixLength: number;
};

export type TrustedProxyConfig = {
  cidrs: ParsedCidr[];
  invalidCidrs: string[];
};

const IPV4_BITS = 32;
const IPV6_BITS = 128;

function isValidIpv4(input: string): boolean {
  const parts = input.split(".");
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }

    const value = Number.parseInt(part, 10);
    return value >= 0 && value <= 255;
  });
}

function isValidIpv6(input: string): boolean {
  if (!input.includes(":")) {
    return false;
  }

  const parts = input.split("::");
  if (parts.length > 2) {
    return false;
  }

  const [head, tail] = parts;
  const headSegments = head ? head.split(":").filter(Boolean) : [];
  const tailSegments = tail ? tail.split(":").filter(Boolean) : [];

  const hasIpv4Tail =
    tailSegments.length > 0 && tailSegments[tailSegments.length - 1]?.includes(".");
  if (hasIpv4Tail) {
    const ipv4Tail = tailSegments[tailSegments.length - 1] ?? "";
    if (!isValidIpv4(ipv4Tail)) {
      return false;
    }

    tailSegments.splice(tailSegments.length - 1, 1, "ffff", "ffff");
  }

  const isValidHexSegment = (segment: string) => /^[0-9a-f]{1,4}$/i.test(segment);
  if (!headSegments.every(isValidHexSegment) || !tailSegments.every(isValidHexSegment)) {
    return false;
  }

  const totalSegments = headSegments.length + tailSegments.length;
  if (parts.length === 2) {
    return totalSegments <= 7;
  }

  return totalSegments === 8;
}

function getIpVersion(input: string): IpVersion | 0 {
  if (isValidIpv4(input)) {
    return 4;
  }

  if (isValidIpv6(input)) {
    return 6;
  }

  return 0;
}

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

function bitsForVersion(version: IpVersion): number {
  return version === 4 ? IPV4_BITS : IPV6_BITS;
}

function toBigInt(ip: string, version: IpVersion): bigint {
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
  const mappedIpv4 = withoutZone.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1];

  if (mappedIpv4 && getIpVersion(mappedIpv4) === 4) {
    return mappedIpv4;
  }

  return getIpVersion(withoutZone) ? withoutZone : null;
}

function parseCidrEntry(entry: string): ParsedCidr | null {
  const cidrParts = entry.split("/");
  if (cidrParts.length > 2) {
    return null;
  }

  const [rawAddress, rawPrefix] = cidrParts;
  const normalizedAddress = normalizeIp(rawAddress ?? "");

  if (!normalizedAddress) {
    return null;
  }

  const version = getIpVersion(normalizedAddress);
  if (!version) {
    return null;
  }

  const maxBits = bitsForVersion(version);
  const defaultPrefix = maxBits;

  if (rawPrefix !== undefined && !/^\d+$/.test(rawPrefix)) {
    return null;
  }

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

  const version = getIpVersion(normalizedIp);
  if (!version) {
    return false;
  }

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
