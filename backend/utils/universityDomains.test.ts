import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// DEV_AUTO_VERIFY_DOMAINS is read once at module load, so each case has to
// re-import the module with the env it's exercising.
const loadIsAutoVerifiedDomain = async () => {
  vi.resetModules();
  return (await import("./universityDomains.js")).isAutoVerifiedDomain;
};

describe("isAutoVerifiedDomain", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDevDomains = process.env.DEV_AUTO_VERIFY_DOMAINS;

  beforeEach(() => {
    delete process.env.DEV_AUTO_VERIFY_DOMAINS;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalDevDomains === undefined) {
      delete process.env.DEV_AUTO_VERIFY_DOMAINS;
    } else {
      process.env.DEV_AUTO_VERIFY_DOMAINS = originalDevDomains;
    }
  });

  it("auto-verifies a recognized university domain in production", async () => {
    process.env.NODE_ENV = "production";
    const isAutoVerifiedDomain = await loadIsAutoVerifiedDomain();

    expect(isAutoVerifiedDomain("ubbcluj.ro")).toBe(true);
  });

  it("returns false for an undefined domain", async () => {
    const isAutoVerifiedDomain = await loadIsAutoVerifiedDomain();

    expect(isAutoVerifiedDomain(undefined)).toBe(false);
  });

  it("does not auto-verify a consumer domain outside production unless opted in", async () => {
    process.env.NODE_ENV = "development";
    const isAutoVerifiedDomain = await loadIsAutoVerifiedDomain();

    expect(isAutoVerifiedDomain("gmail.com")).toBe(false);
  });

  it("auto-verifies an explicitly opted-in domain outside production", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_AUTO_VERIFY_DOMAINS = "gmail.com";
    const isAutoVerifiedDomain = await loadIsAutoVerifiedDomain();

    expect(isAutoVerifiedDomain("gmail.com")).toBe(true);
  });

  it("ignores the opt-in list in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_AUTO_VERIFY_DOMAINS = "gmail.com";
    const isAutoVerifiedDomain = await loadIsAutoVerifiedDomain();

    expect(isAutoVerifiedDomain("gmail.com")).toBe(false);
  });
});
