/** The state of the Moon at one moment. */
export interface MoonReport {
  date: Date;
  /** Lit fraction of the disc: 0 is new, 1 is full. */
  illumination: number;
  /** True from new moon to full moon. */
  waxing: boolean;
  phaseName: string;
  /** Time since the last new moon. */
  age: Age;
  /** The phases around this moment, including the next new moon. */
  lunation: Lunation;
  /** The next full moon after this moment (the cycle's own may already be past). */
  nextFull: Date;
}

export interface Age {
  days: number;
  hours: number;
  minutes: number;
}

/** One cycle, from new moon to new moon. */
export interface Lunation {
  /** Brown lunation number, as Moontool counts them. */
  number: number;
  previousNew: Date;
  firstQuarter: Date;
  full: Date;
  lastQuarter: Date;
  nextNew: Date;
}
