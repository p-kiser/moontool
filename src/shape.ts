/**
 * The moon's face, as SVG paths on a disc of radius 1 centred on 0 0.
 *
 * The lit part is bounded by the Moon's outer edge (a half circle) and the
 * terminator, the line between day and night, which is half an ellipse as tall
 * as the disc and as wide as |cos| of the elongation. That width is also
 * |1 - 2 * lit|. A crescent has the terminator bulging the same way as the lit
 * edge, a gibbous moon the other way.
 *
 * SVG's y axis points down, and an arc with sweep 1 runs clockwise on screen.
 * The lit side is the right when waxing, as seen from the northern hemisphere.
 */

export interface MoonShape {
  /** The lit part, to be filled. */
  lit: string;
  /** The line between lit and dark, to be stroked. Empty when there is no such line to see. */
  terminator: string;
}

/**
 * A sliver thinner than this, as a fraction of the radius, is just the rim, and
 * its terminator is left out. The line is 1px wide and so spills half a pixel
 * over the rim, and that is about 0.005 of the radius at the size the moon is
 * normally drawn.
 */
const HAIR = 0.005;

const round = (n: number): number => Number(n.toFixed(4));

/** The lit fraction of the disc, 0 to 1, and whether the moon is waxing. */
export function moonShape(illumination: number, waxing: boolean): MoonShape {
  const width = round(Math.abs(1 - 2 * illumination));
  const gibbous = illumination > 0.5;
  const edge = waxing ? 1 : 0; // The outer edge, from the top down.
  const back = gibbous ? edge : 1 - edge; // The terminator, from the bottom up.

  return {
    lit: `M 0 -1 A 1 1 0 0 ${edge} 0 1 A ${width} 1 0 0 ${back} 0 -1 Z`,
    terminator: width > 1 - HAIR ? '' : `M 0 -1 A ${width} 1 0 0 ${1 - back} 0 1`,
  };
}
