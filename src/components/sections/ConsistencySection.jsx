import { useMemo, useState } from 'react';
import { useApp } from '../../store/appStore';
import { groupPostsByDay } from '../../utils/format';

const HEAT_COLORS = ['#EBF5F6', '#C7E4E6', '#5AAFB4', '#2E8F96', '#0F5257'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const dow = gridStart.getDay();
  gridStart.setDate(gridStart.getDate() - dow);

  const weeks = [];
  const cur = new Date(gridStart);

  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const key = cur.toISOString().split('T')[0];
      week.push({
        date: key,
        count: byDay[key] || 0,
        inRange: cur >= start && cur <= today,
        month: cur.getMonth(),
        day: cur.getDate(),
        fullDate: new Date(cur),
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const m = week[0].month;
    if (m !== lastMonth) {
      monthLabels.push({ i, label: MONTH_NAMES[m] });
      lastMonth = m;
    } else {
      monthLabels.push(null);
    }
  });

  return { weeks, monthLabels };
}

function computeStats(posts) {
  const byDay = groupPostsByDay(posts);
  const sortedDates = Object.keys(byDay).sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let runStreak = 0;
  let bestDay = 0;
  let bestDayLabel = 'N/A';

  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date();

  while (true) {
    const key = checkDate.toISOString().split('T')[0];
    if (byDay[key]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  for (let i = 0; i < sortedDates.length; i++) {
    const curr = new Date(sortedDates[i]);
    const prev = i > 0 ? new Date(sortedDates[i - 1]) : null;
    if (prev) {
      const diff = (curr - prev) / 86400000;
      if (diff === 1) {
        runStreak++;
      } else {
        longestStreak = Math.max(longestStreak, runStreak);
        runStreak = 1;
      }
    } else {
      runStreak = 1;
    }
    if (byDay[sortedDates[i]] > bestDay) {
      bestDay = byDay[sortedDates[i]];
      bestDayLabel = new Date(sortedDates[i]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  longestStreak = Math.max(longestStreak, runStreak);

  const daysWithPosts = sortedDates.length;
  const avgPerWeek = daysWithPosts > 0 ? (posts.length / 52).toFixed(1) : '0';

  return { currentStreak, longestStreak, bestDay, bestDayLabel, avgPerWeek, totalActiveDays: daysWithPosts };
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
        <h1 className="section-title">Consistency</h1>
        <div className="card p-12 text-center">
          <p className="text-ink-muted">No data yet — sync your platforms to see your posting heatmap.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Consistency</h1>
        <p className="text-ink-muted mt-1">Your posting activity over the last 52 weeks</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Current Streak', value: `${stats.currentStreak}d`, icon: '🔥' },
          { label: 'Longest Streak', value: `${stats.longestStreak}d`, icon: '🏆' },
          { label: 'Avg / Week', value: stats.avgPerWeek, icon: '📅' },
          { label: 'Peak Day', value: stats.bestDayLabel, icon: '⚡' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="label">{s.label}</p>
            <p className="font-display font-bold text-2xl text-ink">{s.icon} {s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 overflow-x-auto">
        <div className="relative" style={{ minWidth: weeks.length * 15 }}>
          <div className="flex gap-0.5 mb-1 pl-8">
            {monthLabels.map((m, i) => (
              <div key={i} style={{ width: 14, flexShrink: 0 }} className="text-xs text-ink-muted font-medium">
                {m ? m.label : ''}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5 mr-1 pt-0.5">
              {DAY_LABELS.map((label, i) => (
                <div key={label} style={{ height: 14 }} className="text-xs text-ink-muted flex items-center justify-end pr-1 w-7">
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
          <span className="text-xs text-ink-muted mr-1">Less</span>
          {HEAT_COLORS.map((c, i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: c }} />
          ))}
          <span className="text-xs text-ink-muted ml-1">More</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 card px-3 py-2 text-xs shadow-lg pointer-events-none"
          style={{ top: tooltip.y - 48, left: tooltip.x - 40 }}
        >
          <p className="font-semibold text-ink">{tooltip.day.date}</p>
          <p className="text-ink-muted">{tooltip.day.count} post{tooltip.day.count !== 1 ? 's' : ''}</p>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-display font-semibold text-base mb-4">Day of Week Breakdown</h2>
        <div className="flex items-end gap-2 h-28">
          {DAY_LABELS.map(day => {
            const dayCounts = posts.filter(p => {
              const d = new Date(p.timestamp).getDay();
              return DAY_LABELS[d] === day;
            });
            const maxCount = Math.max(...DAY_LABELS.map(d => posts.filter(p => DAY_LABELS[new Date(p.timestamp).getDay()] === d).length), 1);
            const h = Math.round((dayCounts.length / maxCount) * 100);
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-ink">{dayCounts.length}</span>
                <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{ height: `${Math.max(h, 4)}%`, backgroundColor: '#0F5257', opacity: 0.3 + (h / 100) * 0.7 }}
                  />
                </div>
                <span className="text-xs text-ink-muted">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
