import { useMemo, useState } from 'react';
import { useApp } from '../../store/appStore';
import { groupPostsByDay } from '../../utils/format';

const HEAT_COLORS = [
  'rgba(0,0,0,0.05)',
  'rgba(9,128,88,0.20)',
  'rgba(9,128,88,0.45)',
  'rgba(9,128,88,0.70)',
  '#098058',
];

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getColor(count) {
  if (count === 0) return HEAT_COLORS[0];
  if (count === 1) return HEAT_COLORS[1];
  if (count === 2) return HEAT_COLORS[2];
  if (count === 3) return HEAT_COLORS[3];
  return HEAT_COLORS[4];
}

function buildHeatmap(posts) {
  const byDay = groupPostsByDay(posts);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setHours(0, 0, 0, 0);
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const weeks = [];
  const cur = new Date(gridStart);
  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const key = cur.toISOString().split('T')[0];
      week.push({ date: key, count: byDay[key] || 0, inRange: cur >= start && cur <= today, month: cur.getMonth() });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach(week => {
    const m = week[0].month;
    if (m !== lastMonth) { monthLabels.push(MONTH_NAMES[m]); lastMonth = m; }
    else monthLabels.push(null);
  });
  return { weeks, monthLabels };
}

function computeStats(posts) {
  const byDay = groupPostsByDay(posts);
  const sortedDates = Object.keys(byDay).sort();
  let currentStreak = 0, longestStreak = 0, runStreak = 0, bestDay = 0, bestDayLabel = 'N/A';
  let checkDate = new Date();
  while (true) {
    const key = checkDate.toISOString().split('T')[0];
    if (byDay[key]) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }
  for (let i = 0; i < sortedDates.length; i++) {
    const curr = new Date(sortedDates[i]);
    const prev = i > 0 ? new Date(sortedDates[i - 1]) : null;
    if (prev) {
      const diff = (curr - prev) / 86400000;
      if (diff === 1) runStreak++;
      else { longestStreak = Math.max(longestStreak, runStreak); runStreak = 1; }
    } else runStreak = 1;
    if (byDay[sortedDates[i]] > bestDay) {
      bestDay = byDay[sortedDates[i]];
      bestDayLabel = new Date(sortedDates[i]).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
    }
  }
  longestStreak = Math.max(longestStreak, runStreak);
  const avgPerWeek = sortedDates.length > 0 ? (posts.length / 52).toFixed(1) : '0';
  return { currentStreak, longestStreak, bestDay, bestDayLabel, avgPerWeek };
}

export default function ConsistencySection() {
  const { state } = useApp();
  const { posts } = state;
  const [tooltip, setTooltip] = useState(null);

  const { weeks, monthLabels } = useMemo(() => buildHeatmap(posts), [posts]);
  const stats = useMemo(() => computeStats(posts), [posts]);

  if (posts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="section-title">Consistencia</h1>
        <div className="card p-12 text-center">
          <p className="text-text-secondary text-sm">Sin datos aún — sincroniza tus plataformas para ver el mapa de publicaciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Consistencia</h1>
        <p className="text-text-secondary mt-2 text-sm">Tu actividad de publicación en las últimas 52 semanas</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Racha actual',  value: `${stats.currentStreak}d`, icon: '🔥' },
          { label: 'Racha máxima',  value: `${stats.longestStreak}d`, icon: '🏆' },
          { label: 'Prom. semanal', value: stats.avgPerWeek,          icon: '📅' },
          { label: 'Día pico',      value: stats.bestDayLabel,        icon: '⚡' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="label">{s.label}</p>
            <p className="font-display font-bold text-2xl text-text-primary leading-tight mt-1" style={{ letterSpacing: '-0.03em' }}>
              {s.icon} {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-6 overflow-x-auto">
        <div className="relative" style={{ minWidth: weeks.length * 15 }}>
          <div className="flex gap-0.5 mb-1 pl-8">
            {monthLabels.map((m, i) => (
              <div key={i} style={{ width: 14, flexShrink: 0 }} className="text-xs text-text-muted font-medium">
                {m || ''}
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5 mr-1 pt-0.5">
              {DAY_LABELS.map((label, i) => (
                <div key={label} style={{ height: 14 }} className="text-xs text-text-muted flex items-center justify-end pr-1 w-7">
                  {i % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 3,
                        backgroundColor: day.inRange ? getColor(day.count) : 'transparent',
                        cursor: day.inRange ? 'pointer' : 'default',
                        flexShrink: 0,
                        border: day.inRange ? '1px solid rgba(0,0,0,0.06)' : 'none',
                      }}
                      onMouseEnter={e => {
                        if (!day.inRange) return;
                        const rect = e.target.getBoundingClientRect();
                        setTooltip({ day, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-4">
          <span className="text-xs text-text-muted mr-1">Menos</span>
          {HEAT_COLORS.map((c, i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: c, border: '1px solid rgba(0,0,0,0.08)' }} />
          ))}
          <span className="text-xs text-text-muted ml-1">Más</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 card px-3 py-2 text-xs pointer-events-none"
          style={{ top: tooltip.y - 50, left: tooltip.x - 40 }}
        >
          <p className="font-semibold text-text-primary">{tooltip.day.date}</p>
          <p className="text-text-muted">{tooltip.day.count} publicación{tooltip.day.count !== 1 ? 'es' : ''}</p>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-display font-semibold text-base text-text-primary mb-4" style={{ letterSpacing: '-0.02em' }}>Publicaciones por día de semana</h2>
        <div className="flex items-end gap-2 h-28">
          {DAY_LABELS.map(day => {
            const dayCounts = posts.filter(p => DAY_LABELS[new Date(p.timestamp).getDay()] === day);
            const maxCount  = Math.max(...DAY_LABELS.map(d => posts.filter(p => DAY_LABELS[new Date(p.timestamp).getDay()] === d).length), 1);
            const h = Math.round((dayCounts.length / maxCount) * 100);
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-text-secondary">{dayCounts.length}</span>
                <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{ height: `${Math.max(h, 4)}%`, background: `rgba(9,128,88,${0.15 + (h / 100) * 0.65})` }}
                  />
                </div>
                <span className="text-xs text-text-muted">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
