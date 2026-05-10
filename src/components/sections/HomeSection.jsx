import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useApp } from '../../store/appStore';
import { scrapeAllPlatforms } from '../../services/apifyService';
import { fmtNumber, getGreeting, pctChange, getWeeklyStats } from '../../utils/format';
import '../../utils/chartSetup';

function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    let start = null;
    const from = 0;
    const to = value;

    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    }

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <>{fmtNumber(display)}</>;
}

function TrendBadge({ change }) {
  if (change === null) return <span className="text-ink-muted text-xs">No prev. data</span>;
  const up = parseFloat(change) >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? '▲' : '▼'} {Math.abs(change)}%
      <span className="text-ink-muted font-normal ml-1">vs last week</span>
    </span>
  );
}

function EmptyState({ onSync, isLoading }) {
  return (
    <div className="card p-12 text-center animate-fade-in">
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
        </svg>
      </div>
      <h3 className="font-display font-bold text-lg text-ink mb-1">No data yet</h3>
      <p className="text-ink-muted text-sm mb-5 max-w-xs mx-auto">Sync your platforms to start seeing analytics, trends, and AI-powered insights.</p>
      <button onClick={onSync} disabled={isLoading} className="btn-primary mx-auto">
        {isLoading ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  );
}

export default function HomeSection() {
  const { state, dispatch } = useApp();
  const { posts, credentials } = state;

  async function handleSync() {
    try {
      dispatch({ type: 'SET_LOADING', loading: true, message: 'Starting scrapers…', progress: 5 });
      const newPosts = await scrapeAllPlatforms(credentials, (platform, msg, overall) => {
        dispatch({ type: 'SET_LOADING', loading: true, message: `${platform}: ${msg}`, progress: overall });
      });
      dispatch({ type: 'SET_POSTS', payload: newPosts });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

  const thisWeek = posts.filter(p => new Date(p.timestamp) >= oneWeekAgo);
  const lastWeek = posts.filter(p => { const d = new Date(p.timestamp); return d >= twoWeeksAgo && d < oneWeekAgo; });

  const totalPosts = posts.length;
  const totalEngagement = posts.reduce((s, p) => s + p.engagement, 0);
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const avgEngRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(1) : '0.0';

  const thisEng = thisWeek.reduce((s, p) => s + p.engagement, 0);
  const lastEng = lastWeek.reduce((s, p) => s + p.engagement, 0);
  const thisViews = thisWeek.reduce((s, p) => s + (p.views || 0), 0);
  const lastViews = lastWeek.reduce((s, p) => s + (p.views || 0), 0);

  const weeklyStats = getWeeklyStats(posts, 8);

  const chartData = {
    labels: weeklyStats.map(w => w.label),
    datasets: [
      {
        label: 'Engagement',
        data: weeklyStats.map(w => w.engagement),
        borderColor: '#0F5257',
        backgroundColor: 'rgba(15,82,87,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#0F5257',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Views',
        data: weeklyStats.map(w => w.views),
        borderColor: '#5AAFB4',
        backgroundColor: 'rgba(90,175,180,0.05)',
        borderWidth: 2,
        pointBackgroundColor: '#5AAFB4',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: { font: { family: 'DM Sans', size: 12 }, usePointStyle: true, pointStyleWidth: 8, boxHeight: 6, color: '#6B7280' },
      },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { family: 'DM Sans', size: 12 },
        bodyFont: { family: 'DM Sans', size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#9CA3AF' } },
      y: { grid: { color: '#F3F4F6' }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#9CA3AF' }, border: { display: false } },
    },
  };

  const enabledNames = Object.entries(credentials.platforms)
    .filter(([, p]) => p.enabled && p.handle)
    .map(([, p]) => p.handle);

  const greeting = `${getGreeting()}${enabledNames.length > 0 ? `, @${enabledNames[0]}` : ''}`;

  const STATS = [
    { label: 'Total Posts', value: totalPosts, change: pctChange(thisWeek.length, lastWeek.length), suffix: '' },
    { label: 'Total Engagement', value: totalEngagement, change: pctChange(thisEng, lastEng), suffix: '' },
    { label: 'Total Views', value: totalViews, change: pctChange(thisViews, lastViews), suffix: '' },
    { label: 'Avg Eng. Rate', value: null, raw: `${avgEngRate}%`, change: null, suffix: '' },
  ];

  if (posts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="section-title">{greeting} 👋</h1>
          <p className="text-ink-muted mt-1">Sync your data to see your analytics.</p>
        </div>
        <EmptyState onSync={handleSync} isLoading={state.isLoading} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">{greeting} 👋</h1>
          <p className="text-ink-muted mt-1">{totalPosts} posts across {enabledNames.length} platform{enabledNames.length !== 1 ? 's' : ''} · here's your overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <div key={stat.label} className={`stat-card animate-slide-up animate-delay-${(i + 1) * 100}`}>
            <p className="label">{stat.label}</p>
            <p className="font-display font-bold text-3xl text-ink leading-none mt-1">
              {stat.value !== null ? <AnimatedNumber value={stat.value} /> : stat.raw}
            </p>
            <TrendBadge change={stat.change} />
          </div>
        ))}
      </div>

      <div className="card p-6 animate-slide-up animate-delay-300">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-base text-ink">Weekly Performance</h2>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary inline-block rounded-full" /> Engagement
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary-300 inline-block rounded-full" /> Views
            </span>
          </div>
        </div>
        <div style={{ height: 220 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(credentials.platforms)
          .filter(([, p]) => p.enabled)
          .map(([platform]) => {
            const pPosts = posts.filter(p => p.platform === platform);
            const pEng = pPosts.reduce((s, p) => s + p.engagement, 0);
            const colors = { instagram: 'from-purple-50 to-pink-50 text-purple-700', tiktok: 'bg-slate-50 text-slate-700', youtube: 'bg-red-50 text-red-600' };
            return (
              <div key={platform} className="card p-5 animate-slide-up">
                <p className="label mb-2">{platform}</p>
                <p className="font-display font-bold text-2xl text-ink">{fmtNumber(pEng)}</p>
                <p className="text-ink-muted text-xs mt-1">{pPosts.length} posts</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
