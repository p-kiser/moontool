import { describe, expect, test } from 'vitest';
import { moonShape } from './shape.ts';

// These tests read the paths as geometry, not as text, so a change in formatting (spacing,
// rounding of the output) does not break them but a wrong shape does.
//
// The disc has radius 1 and is centred on 0 0. SVG's y axis points down, and an arc with
// sweep 1 runs clockwise on screen. Lit on the right is the northern hemisphere's waxing moon.

type Point = [x: number, y: number];

/** One elliptical arc of a path, with the point it starts from. */
interface Arc {
  rx: number;
  ry: number;
  /** 1 is clockwise on screen, 0 counterclockwise. */
  sweep: number;
  from: Point;
  to: Point;
}

interface ParsedPath {
  start: Point;
  arcs: Arc[];
  closed: boolean;
}

/** Reads the only path syntax moonShape uses: `M x y`, then `A rx ry rotation large sweep x y`, then optionally `Z`. */
function parse(path: string): ParsedPath {
  const tokens = path.trim().split(/\s+/);
  let position = 0;
  const word = (): string => {
    const token = tokens[position++];
    if (token === undefined) throw new Error(`path ends too early: "${path}"`);
    return token;
  };
  const number = (): number => Number(word());
  const point = (): Point => [number(), number()];

  if (word() !== 'M') throw new Error(`path must start with M: "${path}"`);
  const start = point();
  let current = start;
  const arcs: Arc[] = [];
  let closed = false;
  while (position < tokens.length) {
    const command = word();
    if (command === 'Z') {
      closed = true;
    } else if (command === 'A') {
      const rx = number();
      const ry = number();
      number(); // x-axis rotation
      number(); // large-arc flag
      const sweep = number();
      const to = point();
      arcs.push({ rx, ry, sweep, from: current, to });
      current = to;
    } else {
      throw new Error(`unexpected command ${command} in "${path}"`);
    }
  }
  return { start, arcs, closed };
}

/** The lit part: the outer edge from the top pole to the bottom pole, then the terminator back. */
function litPart(path: string): { start: Point; outer: Arc; back: Arc; closed: boolean } {
  const { start, arcs, closed } = parse(path);
  const [outer, back, ...rest] = arcs;
  if (!outer || !back || rest.length > 0) throw new Error(`expected two arcs: "${path}"`);
  return { start, outer, back, closed };
}

/** The line between lit and dark: a single arc from the top pole to the bottom pole. */
function terminatorLine(path: string): { start: Point; arc: Arc } {
  const { start, arcs } = parse(path);
  const [arc, ...rest] = arcs;
  if (!arc || rest.length > 0) throw new Error(`expected one arc: "${path}"`);
  return { start, arc };
}

/** The side of the disc an arc passes through, on screen. */
function side(arc: Arc): 'left' | 'right' {
  // Going down the disc, clockwise passes the right side. Going up, it passes the left.
  const goingDown = arc.to[1] > arc.from[1];
  return (arc.sweep === 1) === goingDown ? 'right' : 'left';
}

const opposite = (s: 'left' | 'right'): 'left' | 'right' => (s === 'left' ? 'right' : 'left');

const label = (lit: number, waxing: boolean): string =>
  `${lit} lit, ${waxing ? 'waxing' : 'waning'}`;

/** Lit fractions from a sliver to nearly full, with the quarter in the middle. */
const SAMPLES = [0.01, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 0.99];
const BOTH_WAYS = [true, false];

describe('moonShape', () => {
  test('lights the right side while waxing and the left while waning', () => {
    for (const lit of SAMPLES) {
      for (const waxing of BOTH_WAYS) {
        const { outer } = litPart(moonShape(lit, waxing).lit);
        expect(side(outer), label(lit, waxing)).toBe(waxing ? 'right' : 'left');
      }
    }
  });

  test('bulges the terminator with the lit edge in a crescent, against it in a gibbous moon', () => {
    for (const lit of SAMPLES.filter((value) => value !== 0.5)) {
      for (const waxing of BOTH_WAYS) {
        const shape = moonShape(lit, waxing);
        const edge = side(litPart(shape.lit).outer);
        const wanted = lit < 0.5 ? edge : opposite(edge);
        expect(side(litPart(shape.lit).back), label(lit, waxing)).toBe(wanted);
        expect(side(terminatorLine(shape.terminator).arc), label(lit, waxing)).toBe(wanted);
      }
    }
  });

  test('makes the terminator as wide as |1 - 2 * lit| and as tall as the disc', () => {
    for (let step = 1; step < 40; step++) {
      const lit = step / 40;
      for (const waxing of BOTH_WAYS) {
        const shape = moonShape(lit, waxing);
        const { back } = litPart(shape.lit);
        const wanted = Math.abs(1 - 2 * lit);
        expect(back.rx, label(lit, waxing)).toBeCloseTo(wanted, 3);
        expect(back.ry, label(lit, waxing)).toBe(1);
        if (shape.terminator !== '') {
          const { arc } = terminatorLine(shape.terminator);
          expect(arc.rx, label(lit, waxing)).toBeCloseTo(wanted, 3);
          expect(arc.ry, label(lit, waxing)).toBe(1);
        }
      }
    }
  });

  test('draws the terminator as a straight line at the quarters', () => {
    for (const waxing of BOTH_WAYS) {
      expect(terminatorLine(moonShape(0.5, waxing).terminator).arc.rx).toBe(0);
    }
  });

  test('runs from pole to pole, and closes the lit part', () => {
    for (const lit of SAMPLES) {
      for (const waxing of BOTH_WAYS) {
        const shape = moonShape(lit, waxing);
        const part = litPart(shape.lit);
        expect(part.start, label(lit, waxing)).toStrictEqual([0, -1]);
        expect(part.outer.to, label(lit, waxing)).toStrictEqual([0, 1]);
        expect(part.back.to, label(lit, waxing)).toStrictEqual([0, -1]);
        expect(part.closed, label(lit, waxing)).toBe(true);
        const line = terminatorLine(shape.terminator);
        expect(line.start, label(lit, waxing)).toStrictEqual([0, -1]);
        expect(line.arc.to, label(lit, waxing)).toStrictEqual([0, 1]);
      }
    }
  });

  test('lights nothing at new moon and the whole disc at full moon, with no line between', () => {
    for (const waxing of BOTH_WAYS) {
      // Both arcs are the rim. On the same side they enclose nothing, on opposite sides the disc.
      const newMoon = litPart(moonShape(0, waxing).lit);
      expect(newMoon.back.rx).toBe(1);
      expect(side(newMoon.back)).toBe(side(newMoon.outer));
      expect(moonShape(0, waxing).terminator).toBe('');

      const fullMoon = litPart(moonShape(1, waxing).lit);
      expect(fullMoon.back.rx).toBe(1);
      expect(side(fullMoon.back)).toBe(opposite(side(fullMoon.outer)));
      expect(moonShape(1, waxing).terminator).toBe('');
    }
  });

  test('leaves the terminator out when a sliver is thinner than about 0.5% of the radius', () => {
    // 0.5% of the radius is the half pixel a 1px line spills over the rim, at the size the moon is normally drawn.
    for (const waxing of BOTH_WAYS) {
      expect(moonShape(0.001, waxing).terminator).toBe(''); // lit sliver 0.2%
      expect(moonShape(0.999, waxing).terminator).toBe(''); // dark sliver 0.2%
      expect(moonShape(0.01, waxing).terminator).not.toBe(''); // lit sliver 2%
      expect(moonShape(0.99, waxing).terminator).not.toBe(''); // dark sliver 2%
    }
  });

  test('rounds the terminator width to four places', () => {
    const { arc } = terminatorLine(moonShape(0.1234, true).terminator);
    expect(arc.rx).toBe(0.7532);
  });
});
