const MaintenanceSchedule = (() => {
  function hours(value) {
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
    if (typeof value !== 'string' || !value.trim()) return null;
    const text = value.trim();
    const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }
  function intervalOf(event) {
    if (event.maintenanceInterval) return event.maintenanceInterval;
    // Only explicit interval descriptions qualify; accumulated milestones (240 h,
    // 260 h...) and notes do not establish which checklist was performed.
    const match = String(event.description || '').match(/^Revisi[oó]n de (20|40|80) horas(?:\s+y\b|$)/i);
    return match ? `Cada ${match[1]} horas` : null;
  }
  function calculate(events, label, currentHours, today = new Date().toISOString().slice(0, 10)) {
    const match = /^Cada (\d+(?:[.,]\d+)?) horas(?: deportivas)?$/i.exec(label);
    const interval = match ? hours(match[1]) : null;
    if (!interval) return { status: 'not_hourly', label };
    const current = hours(currentHours);
    const candidates = events.filter(event => {
      if (event.type !== 'Mantenimiento' || intervalOf(event) !== label) return false;
      if (event.maintenanceStatus && event.maintenanceStatus !== 'completed') return false;
      if (event.maintenanceEventId && event.maintenanceStatus !== 'completed') return false;
      if (event.maintenanceTotal != null && !(event.maintenanceTotal > 0 && event.maintenanceCompleted >= event.maintenanceTotal)) return false;
      return true;
    });
    const valid = candidates.filter(event => {
      const date = event.dateISO;
      return hours(event.realHours) !== null && /^\d{4}-\d{2}-\d{2}$/.test(date || '') && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date && date <= today;
    }).sort((a, b) => b.dateISO.localeCompare(a.dateISO) || hours(b.realHours) - hours(a.realHours));
    const last = valid[0] || null;
    if (!last) return { status: 'no_history', interval, label };
    const base = hours(last.realHours);
    const due = Math.round((base + interval) * 1000) / 1000;
    if (current === null || current < base) return { status: 'inconsistent', interval, label, last, base, due };
    const remaining = Math.round((due - current) * 1000) / 1000;
    const tolerance = interval * 0.25;
    const status = remaining < -tolerance ? 'overdue' : remaining < 0 ? 'within_margin' : remaining === 0 ? 'due' : 'upcoming';
    return { status, interval, label, last, base, due, remaining, tolerance };
  }
  return { calculate, hours };
})();
if (typeof module !== 'undefined') module.exports = MaintenanceSchedule;
