const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('./maintenance-schedule.js');
const event = (hours, extra = {}) => ({ type: 'Mantenimiento', dateISO: '2026-09-01', maintenanceInterval: 'Cada 20 horas', maintenanceStatus: 'completed', realHours: hours, ...extra });
const calc = (events, current, label = 'Cada 20 horas') => calculate(events, label, current, '2026-09-05');
test('a late maintenance resets the interval from actual completion hours', () => {
  const result = calc([event(213)], 220);
  assert.equal(result.due, 233); assert.equal(result.remaining, 13);
  assert.equal(calc([event(213), event(238, { dateISO: '2026-09-03' })], 240).due, 258);
});
test('25 percent boundaries are inclusive and never move the due reading', () => {
  for (const [current, status] of [[232.9, 'upcoming'], [233, 'due'], [233.1, 'within_margin'], [238, 'within_margin'], [238.01, 'overdue'], [280, 'overdue']]) {
    const result = calc([event(213)], current);
    assert.equal(result.status, status); assert.equal(result.due, 233);
  }
  const extended = event(213, { maintenanceInterval: 'Cada 40 horas' });
  assert.equal(calc([extended], 263, 'Cada 40 horas').status, 'within_margin');
  assert.equal(calc([extended], 263.01, 'Cada 40 horas').status, 'overdue');
});
test('only completed events of the same interval qualify', () => {
  const events = [event(100), event(120, { maintenanceStatus: 'in_progress' }), event(125, { maintenanceInterval: 'Cada 40 horas' }), event(130, { maintenanceTotal: 3, maintenanceCompleted: 2 })];
  assert.equal(calc(events, 130).due, 120);
  assert.equal(calc(events, 130, 'Cada 40 horas').due, 165);
});
test('invalid, future and ambiguous legacy records are excluded', () => {
  for (const invalid of [event(''), event(null), event('X.XXX'), event(-1), event(20, { dateISO: '2026-09-06' }), event(20, { dateISO: '2026-02-30' }), event(20, { maintenanceInterval: null, description: 'Revisión de 240 horas' }), event(undefined, { hours: 20 })]) {
    assert.equal(calc([invalid], 25).status, 'no_history');
  }
  assert.equal(calc([event(0)], 0).due, 20);
  assert.equal(calc([event('213,5')], 220).due, 233.5);
});
test('legacy explicit intervals and last date work without relying on array order', () => {
  const legacy = { type: 'Mantenimiento', description: 'Revisión de 20 horas', dateISO: '2026-08-01', realHours: '193' };
  assert.equal(calc([event(213), legacy], 220).due, 233);
  assert.equal(calc([legacy], 220).due, 213);
});
test('missing history, lower current readings and calendar intervals are explicit', () => {
  assert.equal(calc([], 195).status, 'no_history');
  assert.equal(calc([event(213)], 195).status, 'inconsistent');
  assert.equal(calc([event(213)], 220, 'Cada 12 meses').status, 'not_hourly');
});
