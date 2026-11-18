import { describe, expect, test } from 'vitest';
import { at, DAY, MOONTOOL } from './fixtures.ts';
import { moonReport } from './moon.ts';
import { timeline } from './timeline.ts';

describe('timeline', () => {
  const line = timeline(moonReport(MOONTOOL.moment));

  test('has the five phases of the cycle, new moon to new moon', () => {
    expect(line.marks.map((m) => m.name)).toStrictEqual([
      'New moon',
      'First quarter',
      'Full moon',
      'Last quarter',
      'New moon',
    ]);
  });
  test("puts the cycle's own new moons at the two ends", () => {
    const [first, , , , last] = line.marks;
    expect(first.at).toBe(0);
    expect(last.at).toBe(1);
  });
  test('puts each phase where it falls in time, so not evenly', () => {
    // Moontool's own times for this cycle (see MOONTOOL): the full moon comes
    // 15.1 days into a cycle of 29.5.
    const start = MOONTOOL.previousNew.getTime();
    const span = MOONTOOL.nextNew.getTime() - start;
    const [, firstQuarter, full, lastQuarter] = line.marks;
    const phases = [
      [firstQuarter, MOONTOOL.firstQuarter],
      [full, MOONTOOL.full],
      [lastQuarter, MOONTOOL.lastQuarter],
    ] as const;
    for (const [mark, date] of phases) {
      const expected = (date.getTime() - start) / span;
      expect(Math.abs(mark.at - expected), mark.name).toBeLessThan(0.01);
    }
  });
  test('puts the moment being shown between the ends', () => {
    // 19.6 days into the cycle.
    expect(Math.abs(line.now - 0.665), String(line.now)).toBeLessThan(0.01);
  });
  test('draws each phase with the right face', () => {
    const [newMoon, first, full, last] = line.marks;
    expect([first.illumination, first.waxing]).toStrictEqual([0.5, true]);
    expect([full.illumination, full.waxing]).toStrictEqual([1, true]);
    expect([last.illumination, last.waxing]).toStrictEqual([0.5, false]);
    expect(newMoon.illumination).toBe(0);
  });
  test('is at the start just after a new moon and at the end just before the next', () => {
    // The cycle's own ends, not Moontool's printed times: ours are minutes off. The
    // very instant of a new moon is both the end of one cycle and the start of the
    // next, and either is right, so the test keeps a minute away from it.
    const { previousNew, nextNew } = moonReport(MOONTOOL.moment).lunation;
    expect(timeline(moonReport(new Date(previousNew.getTime() + 60_000))).now).toBeLessThan(0.001);
    expect(timeline(moonReport(new Date(nextNew.getTime() - 60_000))).now).toBeGreaterThan(0.999);
  });

  test('always runs in order, with the moment on the line, from 1950 to 2100', () => {
    const start = at('1950-01-01T00:00:00Z').getTime();
    const end = at('2100-12-31T00:00:00Z').getTime();
    for (let t = start; t < end; t += 37 * DAY + 5_000_000) {
      const { marks, now } = timeline(moonReport(new Date(t)));
      const times = marks.map((m) => m.at);
      for (const [i, time] of times.entries()) {
        const earlier = times[i - 1];
        if (earlier !== undefined) {
          expect(time, `${new Date(t).toISOString()}: ${times}`).toBeGreaterThan(earlier);
        }
      }
      expect(now, new Date(t).toISOString()).toBeGreaterThanOrEqual(0);
      expect(now, new Date(t).toISOString()).toBeLessThanOrEqual(1);
    }
  });
});
