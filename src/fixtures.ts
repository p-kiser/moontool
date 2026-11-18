/** Reference values shared by the tests. */

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const at = (iso: string): Date => new Date(iso);

// What Moontool 3.0 itself printed for 22 December 1994, 13:53:34 UTC
// (fourmilab.ch/moontool/moontool.gif). An answer from the original program,
// not from the code we are porting. It prints whole percents (81 where we get
// 81.56) and its minutes can differ by one; its own Julian date is 0.5 above the
// standard one, so that is not used here (see the julianDate tests).
export const MOONTOOL = {
  moment: at('1994-12-22T13:53:34Z'),
  litPercent: 81,
  age: { days: 18, hours: 22, minutes: 29 },
  lunation: 890,
  previousNew: at('1994-12-02T23:54:00Z'),
  firstQuarter: at('1994-12-09T21:06:00Z'),
  full: at('1994-12-18T02:18:00Z'),
  lastQuarter: at('1994-12-25T19:07:00Z'),
  nextNew: at('1995-01-01T10:56:00Z'),
};

// Phase times for 2026 from the ephem library (PyEphem 4.2.1, an independent
// implementation), in UTC. Our model should agree within the bound used in the
// tests; over 2026 to 2028 its worst miss against these was 35 minutes.
export const EPHEM_2026 = {
  new: [
    '2026-01-18T19:51:54Z',
    '2026-02-17T12:01:04Z',
    '2026-03-19T01:23:24Z',
    '2026-04-17T11:51:44Z',
    '2026-05-16T20:00:58Z',
    '2026-06-15T02:54:04Z',
    '2026-07-14T09:43:31Z',
    '2026-08-12T17:36:39Z',
    '2026-09-11T03:26:55Z',
    '2026-10-10T15:50:01Z',
    '2026-11-09T07:02:03Z',
    '2026-12-09T00:51:46Z',
  ],
  full: [
    '2026-01-03T10:02:50Z',
    '2026-02-01T22:09:10Z',
    '2026-03-03T11:37:49Z',
    '2026-04-02T02:11:54Z',
    '2026-05-01T17:23:06Z',
    '2026-05-31T08:45:07Z',
    '2026-06-29T23:56:35Z',
    '2026-07-29T14:35:37Z',
    '2026-08-28T04:18:26Z',
    '2026-09-26T16:48:57Z',
    '2026-10-26T04:11:44Z',
    '2026-11-24T14:53:29Z',
    '2026-12-24T01:28:09Z',
  ],
} as const;
