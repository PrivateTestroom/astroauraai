import { describe, expect, it } from "bun:test";
import { Body, SunPosition } from "astronomy-engine";
import { computeChart, siderealLongitude } from "./engine";
import { lahiriAyanamsa, norm360 } from "./constants";

describe("astrology engine solar longitude", () => {
  it("calculates the Sun geocentrically and returns a sidereal longitude", () => {
    const date = new Date("2026-10-09T06:00:00.000Z");
    const expected = norm360(SunPosition(date).elon - lahiriAyanamsa(date));

    expect(siderealLongitude(Body.Sun, date)).toBeCloseTo(expected, 8);
  });

  it("computes a complete daily chart without throwing on the Sun", () => {
    const chart = computeChart({
      year: 2005,
      month: 11,
      day: 9,
      hour: 11,
      minute: 18,
      lat: 15.49,
      lon: 73.83,
      timeKnown: true,
    });

    expect(chart.sunRashi.sanskrit).toBe("Tula");
    expect(chart.moonRashi.sanskrit).toBe("Vrishabha");
  });
});