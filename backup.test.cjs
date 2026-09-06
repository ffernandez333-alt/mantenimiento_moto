const { test } = require('node:test');
const assert = require('node:assert/strict');
const backup = require('./backup.js');
class Storage {
  constructor(data = {}) { this.data = new Map(Object.entries(data)); }
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index]; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) {
    if (this.failKey === key) { this.failKey = null; throw new Error('QuotaExceededError'); }
    this.data.set(key, value);
  }
  removeItem(key) { this.data.delete(key); }
}
function fixture() {
  return new Storage({
    motoProfiles: JSON.stringify([{ id: 'moto-1', brand: 'KTM', model: '250' }, { id: 'moto-2', brand: 'Yamaha', model: 'WR' }]),
    activeBikeId: 'moto-2',
    'motoEvents:moto-1': JSON.stringify([{ type: 'Salida', date: '05 sep 2026', attachments: [{ name: 'foto.png', data: 'data:image/png;base64,AAAA' }] }]),
    'motoEvents:moto-2': '[]',
    'motoMaintenanceTasks:motoMaintenancePlan:moto-2:Cada%2020%20horas': '{"0":{"done":true,"note":"Revisado"}}',
    'motoMaintenanceSession:motoMaintenancePlan:moto-2:Cada%2020%20horas': '{"date":"2026-09-05","markerHours":42}',
    unrelated: 'do not export'
  });
}
test('round trip preserves both bikes, attachments and workshop progress; leaves unrelated data alone', () => {
  const original = fixture();
  const copy = JSON.parse(JSON.stringify(backup.create(original)));
  assert.equal(copy.data.unrelated, undefined);
  const target = new Storage({ unrelated: 'keep', 'motoEvents:old-bike': '[]' });
  backup.restore(target, copy);
  assert.deepEqual(backup.create(target).data, copy.data);
  assert.equal(target.getItem('unrelated'), 'keep');
  assert.equal(target.getItem('motoEvents:old-bike'), null);
});
test('invalid, foreign and future backups cannot change existing data', () => {
  const original = fixture();
  const before = [...original.data];
  const valid = backup.create(original);
  for (const bad of [null, {}, { ...valid, version: 2 }, { ...valid, data: { ...valid.data, unrelated: 'bad' } }, { ...valid, data: { ...valid.data, motoProfiles: '[]' } }, { ...valid, data: { ...valid.data, activeBikeId: 'missing' } }, { ...valid, data: { ...valid.data, 'motoEvents:moto-1': 'broken JSON' } }]) {
    assert.throws(() => backup.restore(original, bad));
    assert.deepEqual([...original.data], before);
  }
});
test('storage failure restores all previous records after a partial write', () => {
  const target = new Storage({ unrelated: 'keep', motoProfiles: '[{"id":"old"}]', activeBikeId: 'old', 'motoEvents:old': '[]' });
  const before = Object.fromEntries(target.data);
  target.failKey = 'motoEvents:moto-1';
  assert.throws(() => backup.restore(target, backup.create(fixture())), /conservado/);
  assert.deepEqual(Object.fromEntries(target.data), before);
});
