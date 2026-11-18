/**
 * Where the Moon is, relative to the Sun.
 *
 * Adapted from Moontool, the public-domain program by John Walker
 * (fourmilab.ch/moontool), whose algorithms come from "Practical Astronomy With
 * Your Calculator" by Peter Duffett-Smith (Cambridge University Press, 1981):
 * the Sun's position from Kepler's equation, the Moon's from its mean motion
 * plus a handful of corrections. The angle between them is the Moon's
 * elongation, and everything else about the phase follows from that.
 *
 * Angles are in degrees, as in Moontool, and go through RADIANS only for the
 * trigonometry.
 */

export const DAY_MS = 86_400_000;
const UNIX_EPOCH_JD = 2440587.5;
export const RADIANS = Math.PI / 180;

export const fixAngle = (degrees: number): number => ((degrees % 360) + 360) % 360;

export const julianDate = (date: Date): number => date.getTime() / DAY_MS + UNIX_EPOCH_JD;

// Both bodies are described at the epoch 1980 January 0.0 (Julian date 2444238.5).
const EPOCH_JD = 2444238.5;

const SUN_ECCENTRICITY = 0.016718;
const SUN_LONGITUDE_AT_EPOCH = 278.83354;
const SUN_LONGITUDE_AT_PERIGEE = 282.596403;
const SUN_DEGREES_PER_DAY = 360 / 365.2422;

const MOON_MEAN_LONGITUDE_AT_EPOCH = 64.975464;
const MOON_MEAN_LONGITUDE_RATE = 13.1763966; // degrees per day
const MOON_PERIGEE_LONGITUDE_AT_EPOCH = 349.383063;
const MOON_PERIGEE_RATE = 0.1114041; // degrees per day

// The corrections to the Moon's mean longitude, in degrees (Moontool's names for them).
const EVECTION = 1.2739;
const ANNUAL_EQUATION = 0.1858;
const ANOMALY_CORRECTION = 0.37;
const CENTRE_EQUATION = 6.2886;
const CENTRE_CORRECTION = 0.214;
const VARIATION = 0.6583;

/** Solve Kepler's equation for the eccentric anomaly, in radians. */
function solveKepler(meanAnomaly: number, eccentricity: number): number {
  let e = meanAnomaly;
  let delta: number;
  do {
    delta = e - eccentricity * Math.sin(e) - meanAnomaly;
    e -= delta / (1 - eccentricity * Math.cos(e));
  } while (Math.abs(delta) > 1e-6);
  return e;
}

interface Sun {
  /** Geocentric ecliptic longitude, in degrees. */
  longitude: number;
  /** In radians. */
  meanAnomaly: number;
}

/** The Sun on a day counted from the epoch. */
function sunPosition(day: number): Sun {
  const meanAnomaly =
    RADIANS *
    fixAngle(SUN_DEGREES_PER_DAY * day + SUN_LONGITUDE_AT_EPOCH - SUN_LONGITUDE_AT_PERIGEE);
  const eccentricAnomaly = solveKepler(meanAnomaly, SUN_ECCENTRICITY);
  const trueAnomaly =
    2 *
    Math.atan(
      Math.sqrt((1 + SUN_ECCENTRICITY) / (1 - SUN_ECCENTRICITY)) * Math.tan(eccentricAnomaly / 2),
    );
  return { longitude: fixAngle(trueAnomaly / RADIANS + SUN_LONGITUDE_AT_PERIGEE), meanAnomaly };
}

/** The Moon's true longitude, in degrees: its mean motion, then the corrections. */
function moonLongitude(day: number, sun: Sun): number {
  const meanLongitude = fixAngle(MOON_MEAN_LONGITUDE_RATE * day + MOON_MEAN_LONGITUDE_AT_EPOCH);
  const meanAnomaly = fixAngle(
    meanLongitude - MOON_PERIGEE_RATE * day - MOON_PERIGEE_LONGITUDE_AT_EPOCH,
  );
  const evection =
    EVECTION * Math.sin(RADIANS * (2 * (meanLongitude - sun.longitude) - meanAnomaly));
  const annualEquation = ANNUAL_EQUATION * Math.sin(sun.meanAnomaly);
  const correctedAnomaly =
    RADIANS *
    (meanAnomaly + evection - annualEquation - ANOMALY_CORRECTION * Math.sin(sun.meanAnomaly));
  const correctedLongitude =
    meanLongitude +
    evection +
    CENTRE_EQUATION * Math.sin(correctedAnomaly) -
    annualEquation +
    CENTRE_CORRECTION * Math.sin(2 * correctedAnomaly);
  return (
    correctedLongitude + VARIATION * Math.sin(RADIANS * 2 * (correctedLongitude - sun.longitude))
  );
}

/** The Moon's angle ahead of the Sun, in degrees: 0 is new, 180 is full. */
export function elongation(date: Date): number {
  const day = julianDate(date) - EPOCH_JD;
  const sun = sunPosition(day);
  return fixAngle(moonLongitude(day, sun) - sun.longitude);
}
