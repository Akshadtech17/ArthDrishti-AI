import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getTodaysBotdName, BOTD_BUSINESSES } from "@/lib/api";
import { getProToken } from "@/lib/pro";

// ── BOTD determinism ──────────────────────────────────────────────────────────

describe("getTodaysBotdName", () => {
  it("always returns a business from the list", () => {
    const name = getTodaysBotdName();
    expect(BOTD_BUSINESSES).toContain(name);
  });

  it("returns the same value on the same day (deterministic)", () => {
    expect(getTodaysBotdName()).toBe(getTodaysBotdName());
  });

  it("cycles through the full list without repeating within 30 days", () => {
    const seen = new Set<string>();
    const now = Date.now();
    for (let i = 0; i < BOTD_BUSINESSES.length; i++) {
      vi.spyOn(Date, "now").mockReturnValue(now + i * 86_400_000);
      seen.add(getTodaysBotdName());
    }
    expect(seen.size).toBe(BOTD_BUSINESSES.length);
    vi.restoreAllMocks();
  });
});

// ── Pro token (localStorage) ───────────────────────────────────────────────────

describe("getProToken", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns null when no pro data stored", () => {
    expect(getProToken()).toBeNull();
  });

  it("returns null when stored token is expired", () => {
    localStorage.setItem(
      "arthdrishti_pro",
      JSON.stringify({ token: "expired-token", expiresAt: Date.now() - 1000 })
    );
    expect(getProToken()).toBeNull();
  });

  it("returns the token when it is still valid", () => {
    localStorage.setItem(
      "arthdrishti_pro",
      JSON.stringify({ token: "valid-token", expiresAt: Date.now() + 86_400_000 })
    );
    expect(getProToken()).toBe("valid-token");
  });

  it("clears expired token from localStorage automatically", () => {
    localStorage.setItem(
      "arthdrishti_pro",
      JSON.stringify({ token: "old-token", expiresAt: Date.now() - 1 })
    );
    getProToken();
    expect(localStorage.getItem("arthdrishti_pro")).toBeNull();
  });
});

// ── Daily limit (localStorage) ────────────────────────────────────────────────

describe("daily limit storage", () => {
  const LIMIT_KEY = "arthdrishti_daily";

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("starts with no usage record", () => {
    expect(localStorage.getItem(LIMIT_KEY)).toBeNull();
  });

  it("stores usage keyed by date", () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(LIMIT_KEY, JSON.stringify({ date: today, used: 1, hasUnlocked: false }));
    const stored = JSON.parse(localStorage.getItem(LIMIT_KEY)!);
    expect(stored.used).toBe(1);
    expect(stored.date).toBe(today);
  });
});

// ── BOTD business list integrity ──────────────────────────────────────────────

describe("BOTD_BUSINESSES", () => {
  it("contains at least 30 unique businesses", () => {
    expect(new Set(BOTD_BUSINESSES).size).toBe(BOTD_BUSINESSES.length);
    expect(BOTD_BUSINESSES.length).toBeGreaterThanOrEqual(30);
  });

  it("includes key Indian businesses", () => {
    const list = BOTD_BUSINESSES.map((b) => b.toLowerCase());
    ["zerodha", "zomato", "swiggy"].forEach((name) => {
      expect(list.some((b) => b.includes(name))).toBe(true);
    });
  });
});
