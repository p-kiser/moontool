import { describe, expect, test } from 'vitest';
import { elongation } from './elongation.ts';
import { at, DAY, EPHEM_2026, HOUR, MOONTOOL } from './fixtures.ts';
import {
  illumination,
  isWaxing,
  lunation,
  lunationNumber,
  moonAge,
  nextPhase,
  phaseName,
  previousPhase,
  moonReport,
  SYNODIC_MONTH,
} from './moon.ts';

const hoursBetween = (a: Date, b: Date): number => Math.abs(a.getTime() - b.getTime()) / HOUR;
/** The distance from a phase angle, going the short way round. */
const angleError = (actual: number, wanted: number): number =>
  Math.abs(((actual - wanted + 540) % 360) - 180);

describe('illumination', () => {
  test('is the lit fraction of the disc at four known angles', () => {
    expect(illumination(0)).toBeCloseTo(0, 12);
    expect(illumination(90)).toBeCloseTo(0.5, 12);
    expect(illumination(180)).toBeCloseTo(1, 12);
    expect(illumination(270)).toBeCloseTo(0.5, 12);
  });
});

describe('isWaxing', () => {
  test('is true from new moon up to full moon, false from then on', () => {
    expect(isWaxing(0)).toBe(true);
    expect(isWaxing(179)).toBe(true);
    expect(isWaxing(180)).toBe(false);
    expect(isWaxing(359)).toBe(false);
  });
  test('wraps its angle first', () => {
    expect(isWaxing(-10)).toBe(false); // 350
    expect(isWaxing(370)).toBe(true); // 10
  });
});

describe('moonAge', () => {
  test('is zero at new moon', () => {
    expect(moonAge(0)).toStrictEqual({ days: 0, hours: 0, minutes: 0 });
  });
  test('is half a synodic month at full moon', () => {
    expect(moonAge(180)).toStrictEqual({ days: 14, hours: 18, minutes: 22 });
  });
});

describe('phaseName', () => {
  const cases: [number, string][] = [
    [0, 'New moon'],
    [20, 'New moon'],
    [45, 'Waxing crescent'],
    [90, 'First quarter'],
    [135, 'Waxing gibbous'],
    [180, 'Full moon'],
    [225, 'Waning gibbous'],
    [270, 'Last quarter'],
    [315, 'Waning crescent'],
    [345, 'New moon'],
  ];
  for (const [angle, name] of cases) {
    test(`${angle} degrees is ${name}`, () => expect(phaseName(angle)).toBe(name));
  }
  test('a hair either side of the quarter band', () => {
    expect(phaseName(85)).toBe('Waxing crescent'); // 45.6 percent lit
    expect(phaseName(86)).toBe('First quarter'); // 46.5 percent lit
  });
});

describe('nextPhase and previousPhase', () => {
  const targets = { new: 0, 'first-quarter': 90, full: 180, 'last-quarter': 270 } as const;
  const starts = [
    '1994-12-22T13:53:34Z',
    '2000-01-01T00:00:00Z',
    '2011-07-15T06:00:00Z',
    '2026-11-05T12:00:00Z',
  ].map(at);

  for (const [name, angle] of Object.entries(targets) as [keyof typeof targets, number][]) {
    test(`next ${name} is later, and at ${angle} degrees`, () => {
      for (const start of starts) {
        const found = nextPhase(start, name);
        expect(found.getTime(), `${start.toISOString()} -> ${found.toISOString()}`).toBeGreaterThan(
          start.getTime(),
        );
        expect(found.getTime() - start.getTime()).toBeLessThanOrEqual(30 * DAY);
        expect(angleError(elongation(found), angle)).toBeLessThan(0.001);
      }
    });
    test(`previous ${name} is earlier, and at ${angle} degrees`, () => {
      for (const start of starts) {
        const found = previousPhase(start, name);
        expect(found.getTime(), `${start.toISOString()} -> ${found.toISOString()}`).toBeLessThan(
          start.getTime(),
        );
        expect(start.getTime() - found.getTime()).toBeLessThanOrEqual(30 * DAY);
        expect(angleError(elongation(found), angle)).toBeLessThan(0.001);
      }
    });
  }

  test("asking from a phase's own moment gives the following one, not itself", () => {
    const full = nextPhase(at('2026-11-05T12:00:00Z'), 'full');
    const following = nextPhase(full, 'full');
    const gap = (following.getTime() - full.getTime()) / DAY;
    expect(gap > 29 && gap < 30, `gap ${gap}`).toBe(true);
    const before = previousPhase(full, 'full');
    expect(before.getTime() < full.getTime() - 29 * DAY).toBe(true);
  });

  test('full moons are one synodic month apart, give or take the real wobble', () => {
    let moment = at('2024-01-01T00:00:00Z');
    for (let i = 0; i < 36; i++) {
      const next = nextPhase(moment, 'full');
      const gap = (next.getTime() - moment.getTime()) / DAY;
      if (i > 0)
        expect(gap > 29.2 && gap < 29.95, `gap ${gap} at ${next.toISOString()}`).toBe(true);
      moment = next;
    }
  });

  test('agrees with the phase times Moontool printed, within an hour', () => {
    const { previousNew, firstQuarter, full, lastQuarter, nextNew } = MOONTOOL;
    expect(hoursBetween(previousPhase(MOONTOOL.moment, 'new'), previousNew) <= 1).toBe(true);
    expect(hoursBetween(nextPhase(previousNew, 'first-quarter'), firstQuarter) <= 1).toBe(true);
    expect(hoursBetween(nextPhase(firstQuarter, 'full'), full) <= 1).toBe(true);
    expect(hoursBetween(nextPhase(full, 'last-quarter'), lastQuarter) <= 1).toBe(true);
    expect(hoursBetween(nextPhase(lastQuarter, 'new'), nextNew) <= 1).toBe(true);
  });
});

describe('phase times, against ephem', () => {
  const bound = 45; // minutes
  for (const phase of ['new', 'full'] as const) {
    test(`every ${phase} moon of 2026 is within ${bound} minutes`, () => {
      for (const iso of EPHEM_2026[phase]) {
        const truth = at(iso);
        const ours = nextPhase(new Date(truth.getTime() - 3 * DAY), phase);
        const minutes = Math.abs(ours.getTime() - truth.getTime()) / 60_000;
        expect(minutes <= bound, `${phase} ${iso}: off by ${minutes.toFixed(0)} minutes`).toBe(
          true,
        );
      }
    });
  }
});

describe('lunationNumber', () => {
  test('lunation 1 is the new moon of January 1923', () => {
    expect(lunationNumber(at('1923-01-17T03:00:00Z'))).toBe(1);
  });
  test('lunation 953 is the new moon of 6 January 2000', () => {
    expect(lunationNumber(at('2000-01-06T18:14:00Z'))).toBe(953);
  });
  test('matches the numbers Moontool printed', () => {
    expect(lunationNumber(MOONTOOL.previousNew)).toBe(890);
    expect(lunationNumber(MOONTOOL.nextNew)).toBe(891);
  });
});

describe('lunation', () => {
  test('holds the five phases around a moment, in order', () => {
    const l = lunation(MOONTOOL.moment);
    expect(l.number).toBe(MOONTOOL.lunation);
    const times = [l.previousNew, l.firstQuarter, l.full, l.lastQuarter, l.nextNew].map((d) =>
      d.getTime(),
    );
    for (const [i, time] of times.entries()) {
      const earlier = times[i - 1];
      if (earlier !== undefined) expect(time).toBeGreaterThan(earlier);
    }
    expect(l.previousNew.getTime() <= MOONTOOL.moment.getTime()).toBe(true);
    expect(MOONTOOL.moment.getTime() < l.nextNew.getTime()).toBe(true);
    const length = (l.nextNew.getTime() - l.previousNew.getTime()) / DAY;
    expect(Math.abs(length - SYNODIC_MONTH) < 0.7, `length ${length}`).toBe(true);
  });
});

describe('moonReport', () => {
  const r = moonReport(MOONTOOL.moment);
  test('describes the moment the way Moontool did', () => {
    expect(Math.abs(r.illumination * 100 - MOONTOOL.litPercent) < 1).toBe(true);
    expect(r.phaseName).toBe('Waning gibbous');
    expect(r.waxing).toBe(false);
    expect(r.lunation.number).toBe(MOONTOOL.lunation);
  });
  test('the next phases are after the moment', () => {
    expect(r.nextFull.getTime() > r.date.getTime()).toBe(true);
    expect(r.lunation.nextNew.getTime() > r.date.getTime()).toBe(true);
    // 22 December 1994 is already past its own cycle's full moon (18 December),
    // so the next full moon belongs to the following cycle.
    expect(r.lunation.nextNew.getTime() < r.nextFull.getTime()).toBe(true);
  });
  test('is waxing before the full moon and waning after', () => {
    expect(moonReport(at('1994-12-12T00:00:00Z')).waxing).toBe(true);
    expect(moonReport(at('1994-12-20T00:00:00Z')).waxing).toBe(false);
  });
});
