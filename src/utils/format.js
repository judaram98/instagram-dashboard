export function fmtNumber(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtRelative(ts) {
  if (!ts) return '';
  const diff  = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 60)  return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months !== 1 ? 'es' : ''}`;
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function pctChange(current, previous) {
  if (!previous) return null;
  const diff = ((current - previous) / previous) * 100;
  return diff.toFixed(1);
}

export function groupPostsByDay(posts) {
  return posts.reduce((acc, p) => {
    const key = new Date(p.timestamp).toISOString().split('T')[0];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function getWeeklyStats(posts, weeksBack = 8) {
  const now   = new Date();
  const weeks = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);

    const slice = posts.filter(p => {
      const d = new Date(p.timestamp);
      return d >= start && d < end;
    });

    weeks.push({
      label:      i === 0 ? 'Esta semana' : i === 1 ? 'Sem. pasada' : `S-${i}`,
      engagement: slice.reduce((s, p) => s + p.engagement, 0),
      views:      slice.reduce((s, p) => s + (p.views || 0), 0),
      posts:      slice.length,
    });
  }

  return weeks;
}

export function getTopHashtags(posts, limit = 15) {
  const counts = posts
    .flatMap(p => p.hashtags || [])
    .reduce((acc, tag) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

export function getEngagementByDay(posts) {
  const days   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const totals = Array(7).fill(0);
  const counts = Array(7).fill(0);

  posts.forEach(p => {
    const d = new Date(p.timestamp).getDay();
    totals[d] += p.engagement;
    counts[d]++;
  });

  return days.map((label, i) => ({
    label,
    avg:   counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
    total: totals[i],
    count: counts[i],
  }));
}
