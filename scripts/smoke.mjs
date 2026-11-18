// Imports the built package by its own name, as users do, and checks Moontool 3.0's values for
// 1994-12-22 13:53:34 UTC. Needs no dev dependencies, so CI runs it on every supported Node.
import assert from 'node:assert/strict';
import { moonReport, moonShape, SYNODIC_MONTH } from '@pkiser/moontool';

const moon = moonReport(new Date('1994-12-22T13:53:34Z'));
assert.equal(moon.lunation.number, 890);
assert.equal(moon.phaseName, 'Waning gibbous');
assert.equal(Math.round(moon.illumination * 100), 82);
assert.equal(moon.waxing, false);
assert.match(moonShape(moon.illumination, moon.waxing).lit, /^M 0 -1 A 1 1 /);
assert.equal(SYNODIC_MONTH, 29.530588853);

console.log(`@pkiser/moontool works on Node ${process.version}`);
