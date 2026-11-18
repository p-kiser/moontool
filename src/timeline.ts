import type { MoonReport } from './types.ts';

/** One phase on the line, with how far along the cycle it comes. */
export interface Mark {
  name: string;
  /** How much of the disc is lit at this phase, for drawing it. */
  illumination: number;
  waxing: boolean;
  date: Date;
  /** From 0 (the cycle's new moon) to 1 (the next one). Phases are not evenly spaced. */
  at: number;
}

export interface Timeline {
  /** The cycle's five phases in order, from new moon to new moon. */
  marks: [Mark, Mark, Mark, Mark, Mark];
  /** Where the moment being shown falls on the line, 0 to 1. */
  now: number;
}

/** The cycle that holds the moment, as a line from one new moon to the next. */
export function timeline(moon: MoonReport): Timeline {
  const { previousNew, firstQuarter, full, lastQuarter, nextNew } = moon.lunation;
  const start = previousNew.getTime();
  const span = nextNew.getTime() - start;
  const along = (date: Date): number => (date.getTime() - start) / span;
  const mark = (name: string, illumination: number, waxing: boolean, date: Date): Mark => ({
    name,
    illumination,
    waxing,
    date,
    at: along(date),
  });

  return {
    marks: [
      mark('New moon', 0, true, previousNew),
      mark('First quarter', 0.5, true, firstQuarter),
      mark('Full moon', 1, true, full),
      mark('Last quarter', 0.5, false, lastQuarter),
      mark('New moon', 0, false, nextNew),
    ],
    now: Math.min(1, Math.max(0, along(moon.date))),
  };
}
