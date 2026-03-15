import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  expectedConnectOrigins,
  getAbsoluteOriginOrNull,
  isDirectExecution,
} from "../../scripts/verify-deployment.mjs";

const tempDirs = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("getAbsoluteOriginOrNull", () => {
  it("returns null for empty and relative values", () => {
    expect(getAbsoluteOriginOrNull("", "NEXT_PUBLIC_API_BASE_URL")).toBeNull();
    expect(getAbsoluteOriginOrNull("   ", "NEXT_PUBLIC_API_BASE_URL")).toBeNull();
    expect(getAbsoluteOriginOrNull("/api", "NEXT_PUBLIC_API_BASE_URL")).toBeNull();
    expect(getAbsoluteOriginOrNull(" /proxy ", "NEXT_PUBLIC_API_BASE_URL")).toBeNull();
  });

  it("throws a descriptive error for malformed NEXT_PUBLIC_API_BASE_URL values", () => {
    expect(() => getAbsoluteOriginOrNull("api.example.com", "NEXT_PUBLIC_API_BASE_URL")).toThrow(
      'Invalid NEXT_PUBLIC_API_BASE_URL origin: "api.example.com"',
    );

    expect(() => getAbsoluteOriginOrNull("://bad", "NEXT_PUBLIC_API_BASE_URL")).toThrow(
      "Leave it empty or use a relative path to keep same-origin defaults.",
    );
  });

  it("throws a descriptive error for malformed wildcard CSP_CONNECT_SRC values", () => {
    expect(() => getAbsoluteOriginOrNull("*.example.com", "CSP_CONNECT_SRC[0]")).toThrow(
      'Invalid CSP_CONNECT_SRC[0] origin: "*.example.com"',
    );

    expect(() => getAbsoluteOriginOrNull("*.example.com", "CSP_CONNECT_SRC[0]")).toThrow(
      "For cross-origin mode, provide only explicit absolute URL origins in CSP_CONNECT_SRC.",
    );
  });
});

describe("expectedConnectOrigins", () => {
  it("returns same-origin defaults when values are empty or relative", () => {
    const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const originalConnectSrc = process.env.CSP_CONNECT_SRC;

    process.env.NEXT_PUBLIC_API_BASE_URL = "/api";
    process.env.CSP_CONNECT_SRC = " , /proxy ,";

    expect(expectedConnectOrigins()).toEqual(["'self'"]);

    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    process.env.CSP_CONNECT_SRC = originalConnectSrc;
  });
});

describe("isDirectExecution", () => {
  it("returns false when argv[1] is missing", () => {
    expect(isDirectExecution(import.meta.url, undefined)).toBe(false);
  });

  it("supports equivalent realpath targets for symlinked entry paths", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "verify-deployment-test-"));
    tempDirs.push(tempDir);

    const scriptPath = join(tempDir, "script.mjs");
    const symlinkPath = join(tempDir, "script-link.mjs");

    writeFileSync(scriptPath, "export const marker = true;\n");
    symlinkSync(scriptPath, symlinkPath);

    expect(isDirectExecution(pathToFileURL(scriptPath).href, symlinkPath)).toBe(true);
  });
});
