import { beforeEach, describe, expect, it } from "vitest";
import { incrementSessionCount } from "./easter-eggs";

beforeEach(() => {
  sessionStorage.clear();
});

describe("incrementSessionCount", () => {
  it("starts at 1 for a key with no stored count", () => {
    expect(incrementSessionCount("test-key")).toBe(1);
  });

  it("increments on each call for the same key", () => {
    incrementSessionCount("test-key");
    incrementSessionCount("test-key");
    expect(incrementSessionCount("test-key")).toBe(3);
  });

  it("tracks separate counts per key", () => {
    incrementSessionCount("a");
    incrementSessionCount("a");
    incrementSessionCount("b");
    expect(incrementSessionCount("a")).toBe(3);
    expect(incrementSessionCount("b")).toBe(2);
  });

  it("persists the count in sessionStorage", () => {
    incrementSessionCount("test-key");
    expect(sessionStorage.getItem("test-key")).toBe("1");
  });
});
