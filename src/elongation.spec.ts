import { describe, expect, test } from 'vitest';
import { elongation, fixAngle, julianDate } from './elongation.ts';
import { at, MOONTOOL } from './fixtures.ts';
import { illumination, moonAge } from './moon.ts';

describe('fixAngle', () => {
  test('wraps any angle into 0 to 360', () => {
    expect(fixAngle(0)).toBe(0);
    expect(fixAngle(360)).toBe(0);
    expect(fixAngle(725)).toBe(5);
    expect(fixAngle(-90)).toBe(270);
    expect(fixAngle(-720)).toBe(0);
  });
});

describe('julianDate', () => {
  test('the Unix epoch is JD 2440587.5', () => {
    expect(julianDate(at('1970-01-01T00:00:00Z'))).toBe(2440587.5);
  });
  test('J2000 is JD 2451545.0', () => {
    expect(julianDate(at('2000-01-01T12:00:00Z'))).toBe(2451545.0);
  });
  test('counts whole days from J2000', () => {
    // 1995-01-01 0h is 1826 days before 2000-01-01 0h (JD 2451544.5), so
    // 22 December 1994 13:53:34 is ten days before it, plus 0.57887 of a day.
    expect(Math.abs(julianDate(MOONTOOL.moment) - 2449709.07887) < 0.00001).toBe(true);
  });
});

describe('elongation, against the moon phase snippets (github.com/iriswebb/moonphase)', () => {
  // Their test file: Unix seconds and the lit percent to one decimal.
  const lit = (unixSeconds: number): string =>
    (illumination(elongation(new Date(unixSeconds * 1000))) * 100).toFixed(1);
  test('matches the reference values', () => {
    expect(lit(-178070400)).toBe('1.2');
    expect(lit(361411200)).toBe('93.6');
    expect(lit(1704931200)).toBe('0.4');
    expect(lit(2898374400)).toBe('44.2');
  });
});

describe('elongation, against Moontool itself', () => {
  const e = elongation(MOONTOOL.moment);
  test("is lit within a percent of Moontool's figure", () => {
    expect(Math.abs(illumination(e) * 100 - MOONTOOL.litPercent) < 1).toBe(true);
  });
  test('is as old as Moontool says, give or take a few minutes', () => {
    const age = moonAge(e);
    const minutes = (a: typeof age) => a.days * 1440 + a.hours * 60 + a.minutes;
    expect(Math.abs(minutes(age) - minutes(MOONTOOL.age)) <= 5, JSON.stringify(age)).toBe(true);
  });
});
