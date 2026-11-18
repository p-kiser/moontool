/**
 * The phase of the moon: how lit it is, how old, what it is called, and when
 * each phase falls. Where the Moon is comes from elongation.ts, which is
 * adapted from Moontool. Moontool has its own routine for the phase times; here
 * they are found by searching on the elongation.
 */
import { DAY_MS, elongation, fixAngle, julianDate, RADIANS } from './elongation.ts';
import type { Age, Lunation, MoonReport } from './types.ts';

/** Mean time from one new moon to the next, in days. */
export const SYNODIC_MONTH = 29.530588853;

/** How fast the elongation grows on average, in degrees per day. */
const MEAN_RATE = 360 / SYNODIC_MONTH;

// A mean new moon (2000 January 6), and its Brown lunation number.
const NEW_MOON_JD = 2451550.09766;
const NEW_MOON_LUNATION = 953;

export type Phase = 'new' | 'first-quarter' | 'full' | 'last-quarter';
const PHASE_ANGLE: Record<Phase, number> = {
  new: 0,
  'first-quarter': 90,
  full: 180,
  'last-quarter': 270,
};

/** The lit fraction of the disc, 0 to 1. */
export const illumination = (elongationDegrees: number): number =>
  (1 - Math.cos(elongationDegrees * RADIANS)) / 2;

/** True from new moon to full moon. */
export const isWaxing = (elongationDegrees: number): boolean => fixAngle(elongationDegrees) < 180;

/** Time since the last new moon, as the Moon's angle says. */
export function moonAge(elongationDegrees: number): Age {
  const totalMinutes = Math.round((fixAngle(elongationDegrees) / 360) * SYNODIC_MONTH * 1440);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

// Where the names change, as the lit fraction of the disc.
const NEW_BELOW = 0.04;
const FULL_ABOVE = 0.96;
const QUARTER_FROM = 0.46;
const QUARTER_TO = 0.54;

export function phaseName(elongationDegrees: number): string {
  const lit = illumination(elongationDegrees);
  const waxing = isWaxing(elongationDegrees);
  if (lit < NEW_BELOW) return 'New moon';
  if (lit > FULL_ABOVE) return 'Full moon';
  if (lit >= QUARTER_FROM && lit <= QUARTER_TO) return waxing ? 'First quarter' : 'Last quarter';
  return `${waxing ? 'Waxing' : 'Waning'} ${lit < 0.5 ? 'crescent' : 'gibbous'}`;
}

/** The search stops when the elongation is this close to the target, in degrees (a few milliseconds). */
const TOLERANCE = 1e-6;
/**
 * Closer than this to the target counts as already there, so the search looks
 * for the next one. It has to be coarser than TOLERANCE, or a phase we just
 * found would count as still ahead of us.
 */
const AT_TARGET = 1e-4;
/** A safety cap. The search normally finishes in a few steps. */
const MAX_STEPS = 25;

/** An angle difference wrapped into -180 up to 180. */
const wrapSigned = (degrees: number): number => ((degrees + 540) % 360) - 180;

/**
 * The first moment after (or, going back, before) `from` when the Moon is at
 * `target` degrees. The elongation only ever grows, between 11 and 15 degrees a
 * day, so starting from the average pace and correcting converges in a few steps.
 */
function findPhase(from: Date, target: number, direction: 1 | -1): Date {
  const elongationAt = (time: number): number => elongation(new Date(time));
  const now = elongation(from);
  let ahead = direction === 1 ? fixAngle(target - now) : fixAngle(now - target);
  if (ahead < AT_TARGET) ahead = 360;
  let time = from.getTime() + direction * (ahead / MEAN_RATE) * DAY_MS;
  for (let step = 0; step < MAX_STEPS; step++) {
    const error = wrapSigned(target - elongationAt(time));
    time += (error / MEAN_RATE) * DAY_MS;
    if (Math.abs(error) < TOLERANCE) return new Date(time);
  }
  throw new Error(`No phase at ${target} degrees found near ${from.toISOString()}`);
}

export const nextPhase = (after: Date, phase: Phase): Date =>
  findPhase(after, PHASE_ANGLE[phase], 1);

export const previousPhase = (before: Date, phase: Phase): Date =>
  findPhase(before, PHASE_ANGLE[phase], -1);

/** The Brown lunation number of the new moon at `newMoon`. Moontool counts the same way. */
export const lunationNumber = (newMoon: Date): number =>
  Math.round((julianDate(newMoon) - NEW_MOON_JD) / SYNODIC_MONTH) + NEW_MOON_LUNATION;

/** The cycle that `date` is in, from one new moon to the next. */
export function lunation(date: Date): Lunation {
  const previousNew = previousPhase(date, 'new');
  const firstQuarter = nextPhase(previousNew, 'first-quarter');
  const full = nextPhase(firstQuarter, 'full');
  const lastQuarter = nextPhase(full, 'last-quarter');
  const nextNew = nextPhase(lastQuarter, 'new');
  return {
    number: lunationNumber(previousNew),
    previousNew,
    firstQuarter,
    full,
    lastQuarter,
    nextNew,
  };
}

/** The state of the Moon at `date`. */
export function moonReport(date: Date): MoonReport {
  const angle = elongation(date);
  return {
    date,
    illumination: illumination(angle),
    waxing: isWaxing(angle),
    phaseName: phaseName(angle),
    age: moonAge(angle),
    lunation: lunation(date),
    nextFull: nextPhase(date, 'full'),
  };
}
