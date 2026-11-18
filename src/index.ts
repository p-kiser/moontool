/**
 * The phase of the Moon, from a date alone: how much of it is lit, how old it is, what the phase
 * is called, when each phase of its cycle falls, and an SVG of the lit disc.
 *
 * Adapted from Moontool, the public-domain program by John Walker (fourmilab.ch/moontool), whose
 * algorithms come from "Practical Astronomy With Your Calculator" by Peter Duffett-Smith.
 */
export { elongation, julianDate } from './elongation.ts';
export {
  illumination,
  isWaxing,
  lunation,
  lunationNumber,
  moonAge,
  moonReport,
  nextPhase,
  phaseName,
  previousPhase,
  SYNODIC_MONTH,
  type Phase,
} from './moon.ts';
export { moonShape, type MoonShape } from './shape.ts';
export { timeline, type Mark, type Timeline } from './timeline.ts';
export type { Age, Lunation, MoonReport } from './types.ts';
