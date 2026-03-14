import { describe, expect, it } from "vitest";
import { getImmediateProxyIp, isTrustedProxyIp, parseTrustedProxyCidrs } from "./proxy-trust";

describe("proxy-trust", () => {
  it("accepts trusted proxy source and preserves valid cidr entries", () => {
    const config = parseTrustedProxyCidrs("10.0.0.0/8, 2001:db8::/32");

    expect(config.invalidCidrs).toEqual([]);
    expect(isTrustedProxyIp("10.1.1.1", config)).toBe(true);
    expect(isTrustedProxyIp("2001:db8::42", config)).toBe(true);
    expect(isTrustedProxyIp("192.168.1.1", config)).toBe(false);
  });

  it("falls back to localhost defaults when cidr config is empty", () => {
    const config = parseTrustedProxyCidrs("");

    expect(isTrustedProxyIp("127.0.0.1", config)).toBe(true);
    expect(isTrustedProxyIp("::1", config)).toBe(true);
    expect(isTrustedProxyIp("10.0.0.1", config)).toBe(false);
  });

  it("reports malformed cidr entries and ignores them", () => {
    const config = parseTrustedProxyCidrs("10.0.0.0/8,10.2.0.0/8foo,garbage,192.168.0.0/99");

    expect(config.invalidCidrs).toEqual(["10.2.0.0/8foo", "garbage", "192.168.0.0/99"]);
    expect(isTrustedProxyIp("10.2.2.2", config)).toBe(true);
    expect(isTrustedProxyIp("192.168.0.1", config)).toBe(false);
  });

  it("matches ipv4-mapped ipv6 source addresses against ipv4 cidrs", () => {
    const config = parseTrustedProxyCidrs("10.0.0.0/8");

    expect(isTrustedProxyIp("::ffff:10.1.1.1", config)).toBe(true);
    expect(isTrustedProxyIp("::ffff:203.0.113.8", config)).toBe(false);
  });

  it("extracts immediate proxy ip from platform ip first then forwarded chain", () => {
    expect(
      getImmediateProxyIp({
        ip: "10.10.10.10",
        headers: new Headers({ "x-forwarded-for": "198.51.100.1, 203.0.113.5" }),
      }),
    ).toBe("10.10.10.10");

    expect(
      getImmediateProxyIp({
        headers: new Headers({ "x-forwarded-for": "198.51.100.1, 203.0.113.5" }),
      }),
    ).toBe("203.0.113.5");
  });
});
