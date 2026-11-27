import { describe, expect, it } from "vitest";
import { agoLabel, percent, timeLabel } from "./student-format";

describe("student labels", () => {
  it("shows time as hours and minutes", () => {
    expect(timeLabel(0)).toBe("0m");
    expect(timeLabel(25 * 60)).toBe("25m");
    expect(timeLabel(12 * 3600 + 5 * 60)).toBe("12h 05m");
  });
  it("shows accuracy", () => {
    expect(percent(0, 0)).toBe("–");
    expect(percent(2, 3)).toBe("67%");
  });
  it("says how long ago", () => {
    const now = Date.parse("2026-11-27T12:00:00Z");
    expect(agoLabel(null, now)).toBe("never");
    expect(agoLabel("2026-11-27T11:59:30Z", now)).toBe("just now");
    expect(agoLabel("2026-11-27T11:40:00Z", now)).toBe("20 min ago");
    expect(agoLabel("2026-11-27T09:00:00Z", now)).toBe("3 h ago");
    expect(agoLabel("2026-11-26T08:00:00Z", now)).toBe("yesterday");
    expect(agoLabel("2026-11-23T12:00:00Z", now)).toBe("4 days ago");
    expect(agoLabel("2026-11-01T12:00:00Z", now)).toBe("1 Nov 2026");
  });
});
