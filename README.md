# @pkiser/moontool

The phase of the Moon, worked out from a date alone: how much of it is lit, how old it is, what
the phase is called, when each phase of its cycle falls, and an SVG path of the lit disc.

No dependencies, no network, no DOM. Runs in browsers and Node 18 or newer. ESM with TypeScript
types.

```sh
npm install @pkiser/moontool
```

```ts
import { moonReport, moonShape } from '@pkiser/moontool';

const moon = moonReport(new Date());
moon.phaseName; // 'Waxing gibbous'
moon.illumination; // 0.82 (0 is new, 1 is full)
moon.age; // { days: 10, hours: 4, minutes: 12 }
moon.nextFull; // Date
moon.lunation; // { number, previousNew, firstQuarter, full, lastQuarter, nextNew }

const { lit, terminator } = moonShape(moon.illumination, moon.waxing);
// <svg viewBox="-1 -1 2 2"><path d={lit} /><path d={terminator} /></svg>
```

## API

| Export                            | What it gives                                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `moonReport(date)`                | Everything below for one moment: `illumination`, `waxing`, `phaseName`, `age`, `lunation`, `nextFull`.                                              |
| `elongation(date)`                | The Moon's angle ahead of the Sun in degrees: 0 new, 90 first quarter, 180 full, 270 last quarter.                                                  |
| `illumination(elongation)`        | Lit fraction of the disc, 0 to 1.                                                                                                                   |
| `isWaxing(elongation)`            | True from new moon to full moon.                                                                                                                    |
| `phaseName(elongation)`           | `New moon`, `Waxing crescent`, `First quarter`, `Waxing gibbous`, `Full moon`, `Waning gibbous`, `Last quarter`, …                                  |
| `moonAge(elongation)`             | Time since the last new moon, as days, hours and minutes.                                                                                           |
| `nextPhase(date, phase)`          | The next `'new'`, `'first-quarter'`, `'full'` or `'last-quarter'` after `date`.                                                                     |
| `previousPhase(date, phase)`      | The same, going back.                                                                                                                               |
| `lunation(date)`                  | The cycle `date` is in: its Brown lunation number and the five phase times from new moon to new moon.                                               |
| `lunationNumber(newMoon)`         | The Brown lunation number of a new moon, as Moontool counts them.                                                                                   |
| `timeline(report)`                | The cycle as a line from 0 to 1: the five phases and where `report.date` falls, for drawing.                                                        |
| `moonShape(illumination, waxing)` | SVG paths for a disc of radius 1 centred on 0 0: the lit part and the terminator. Lit side right when waxing, as seen from the northern hemisphere. |
| `julianDate(date)`                | The Julian date of a moment.                                                                                                                        |
| `SYNODIC_MONTH`                   | Mean length of a lunar month in days, 29.530588853.                                                                                                 |

## How it works and how accurate it is

Everything comes from one number, the **elongation**: the angle of the Moon ahead of the Sun. The
Sun's position comes from Kepler's equation, the Moon's from its mean motion plus a handful of
corrections for the irregularities of its orbit. The lit fraction is `(1 − cos(elongation)) / 2`,
and the Moon is waxing while the elongation is below 180°. Phase times are found by searching for
the moment the elongation reaches 0°, 90°, 180° or 270°.

Phase times agree with [PyEphem](https://rhodesmill.org/pyephem/) to within 45 minutes for every
phase of 2026, and the tests check this. The tests also check the values Moontool 3.0 itself
printed for 22 December 1994. This is good enough to say when the next full moon is, not for
astronomy that needs the minute.

## Credits

Adapted from [Moontool](https://www.fourmilab.ch/moontool/), the public-domain program by John
Walker (Fourmilab), whose algorithms come from _Practical Astronomy With Your Calculator_ by Peter
Duffett-Smith (Cambridge University Press). Please keep this credit when you build on it.

## Licence

MIT. See [LICENSE](LICENSE).
