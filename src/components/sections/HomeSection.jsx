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
    const to = value;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(to * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <>{fmtNumber(display)}</>;
}

function TrendBadge({ change }) {
  if (change === null) return <span className="text-text-muted text-xs">Sin datos previos</span>;
  const up = parseFloat(change) >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-accent-DEFAULT' : 'text-red-500'}`}>
      {up ? '▲' : '▼'} {Math.abs(change)}%
      <span className="text-text-muted font-normal ml-1">vs semana anterior</span>
    </span>
  );
}

function EmptyState({ onSync, isLoading }) {
  return (
    <div className="card p-12 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 empty-icon-wrap">
        <svg className="w-6 h-6 text-accent-DEFAULT" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
        </svg>
      </div>
      <h3 className="font-display font-bold text-lg mb-2">Sin datos aún</h3>
      <p className="text-text-secondary text-sm mb-5 max-w-xs mx-auto">Sincroniza tus plataformas para comenzar a ver analíticas, tendencias e ideas impulsadas por IA.</p>
      <button onClick={onSync} disabled={isLoading} className="btn-primary mx-auto">
        {isLoading ? 'Sincronizando…' : 'Sincronizar ahora'}
      </button>
    </div>
  );
}

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        font: { family: 'DM Sans', size: 12 },
        usePointStyle: true,
        pointStyleWidth: 8,
        boxHeight: 6,
        color: '#6B7E87',
      },
    },
    tooltip: {
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(0,0,0,0.10)',
      borderWidth: 1,
      titleFont: { family: 'DM Sans', size: 12, weight: '600' },
      bodyFont: { family: 'DM Sans', size: 12 },
      padding: 12,
      cornerRadius: 10,
      titleColor: '#0F1E25',
      bodyColor: '#4A5D66',
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'DM Sans', size: 11 }, color: '#96A6AE' },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: { font: { family: 'DM Sans', size: 11 }, color: '#96A6AE' },
      border: { display: false },
    },
  },
};

const PLATFORM_ACCENT = {
  instagram: { border: 'border-purple-200', text: 'text-purple-600' },
  tiktok:    { border: 'border-zinc-200',   text: 'text-zinc-500' },
  youtube:   { border: 'border-red-200',    text: 'text-red-500' },
};

const GREETING_ES = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

export default function HomeSection() {
  const { state, dispatch } = useApp();
  const { posts, credentials } = state;

  async function handleSync() {
    try {
      dispatch({ type: 'SET_LOADING', loading: true, message: 'Iniciando scrapers…', progress: 5 });
      const newPosts = await scrapeAllPlatforms(credentials, (platform, msg, overall) => {
        dispatch({ type: 'SET_LOADING', loading: true, message: `${platform}: ${msg}`, progress: overall });
      });
      dispatch({ type: 'SET_POSTS', payload: newPosts });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }

  const now = new Date();
  const oneWeekAgo  = new Date(now.getTime() - 7  * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

  const thisWeek = posts.filter(p => new Date(p.timestamp) >= oneWeekAgo);
  const lastWeek = posts.filter(p => { const d = new Date(p.timestamp); return d >= twoWeeksAgo && d < oneWeekAgo; });

  const totalPosts      = posts.length;
  const totalEngagement = posts.reduce((s, p) => s + p.engagement, 0);
  const totalViews      = posts.reduce((s, p) => s + (p.views || 0), 0);
  const avgEngRate      = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(1) : '0.0';

  const thisEng   = thisWeek.reduce((s, p) => s + p.engagement, 0);
  const lastEng   = lastWeek.reduce((s, p) => s + p.engagement, 0);
  const thisViews = thisWeek.reduce((s, p) => s + (p.views || 0), 0);
  const lastViews = lastWeek.reduce((s, p) => s + (p.views || 0), 0);

  const weeklyStats = getWeeklyStats(posts, 8);

  const chartData = {
    labels: weeklyStats.map(w => w.label),
    datasets: [
      {
        label: 'Interacción',
        data: weeklyStats.map(w => w.engagement),
        borderColor: '#098058',
        backgroundColor: 'rgba(9,128,88,0.07)',
        borderWidth: 2,
        pointBackgroundColor: '#098058',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Vistas',
        data: weeklyStats.map(w => w.views),
        borderColor: 'rgba(0,0,0,0.15)',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderWidth: 1.5,
        pointBackgroundColor: 'rgba(0,0,0,0.25)',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const enabledNames = Object.entries(credentials.platforms)
    .filter(([, p]) => p.enabled && p.handle)
    .map(([, p]) => p.handle);

  const greeting = `${GREETING_ES()}${enabledNames.length > 0 ? `, @${enabledNames[0]}` : ''}`;

  const STATS = [
    { label: 'Total publicaciones', value: totalPosts,      change: pctChange(thisWeek.length, lastWeek.length) },
    { label: 'Total interacciones', value: totalEngagement, change: pctChange(thisEng, lastEng) },
    { label: 'Total vistas',        value: totalViews,      change: pctChange(thisViews, lastViews) },
    { label: 'Tasa promedio',       value: null, raw: `${avgEngRate}%`, change: null },
  ];

  if (posts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="section-title">{greeting} 👋</h1>
          <p className="text-text-secondary mt-2 text-sm">Sincroniza tus datos para ver tus analíticas.</p>
        </div>
        <EmptyState onSync={handleSync} isLoading={state.isLoading} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">{greeting} 👋</h1>
        <p className="text-text-secondary mt-2 text-sm">
          {totalPosts} publicaciones en {enabledNames.length} plataforma{enabledNames.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {STATS.map((stat, i) => (
          <div key={stat.label} className={`stat-card animate-slide-up animate-delay-${(i + 1) * 100}`}>
            <p className="label">{stat.label}</p>
            <p className="font-display font-bold text-3xl text-text-primary leading-none mt-1" style={{ letterSpacing: '-0.04em' }}>
              {stat.value !== null ? <AnimatedNumber value={stat.value} /> : stat.raw}
            </p>
            <TrendBadge change={stat.change} />
          </div>
        ))}
      </div>

      <div className="card p-6 animate-slide-up animate-delay-300">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-base text-text-primary" style={{ letterSpacing: '-0.02em' }}>Rendimiento semanal</h2>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-accent-DEFAULT inline-block rounded-full" /> Interacción
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-base-600 inline-block rounded-full" /> Vistas
            </span>
          </div>
        </div>
        <div className="chart-height-sm">
          <Line data={chartData} options={CHART_OPTS} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Object.entries(credentials.platforms)
          .filter(([, p]) => p.enabled)
          .map(([platform]) => {
            const pPosts = posts.filter(p => p.platform === platform);
            const pEng   = pPosts.reduce((s, p) => s + p.engagement, 0);
            const accent = PLATFORM_ACCENT[platform] || PLATFORM_ACCENT.instagram;
            return (
              <div key={platform} className={`card p-5 border ${accent.border}`}>
                <p className="label mb-2">{platform}</p>
                <p className={`font-display font-bold text-2xl ${accent.text}`} style={{ letterSpacing: '-0.03em' }}>
                  {fmtNumber(pEng)}
                </p>
                <p className="text-text-muted text-xs mt-1">{pPosts.length} publicaciones</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
