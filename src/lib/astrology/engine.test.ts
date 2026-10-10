import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Body, SunPosition } from "astronomy-engine";
import { computeChart, siderealLongitude } from "./engine";
import { lahiriAyanamsa, norm360 } from "./constants";

describe("astrology engine solar longitude", () => {
  it("calculates the Sun geocentrically and returns a sidereal longitude", () => {
    const date = new Date("2026-10-09T06:00:00.000Z");
    const expected = norm360(SunPosition(date).elon - lahiriAyanamsa(date));

    assert.ok(Math.abs(siderealLongitude(Body.Sun, date) - expected) < 1e-8);
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

    assert.equal(chart.sunRashi.sanskrit, "Tula");
    assert.equal(chart.moonRashi.sanskrit, "Mesha");
  });
});