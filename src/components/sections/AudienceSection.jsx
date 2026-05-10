import { useState, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useApp } from '../../store/appStore';
import { analyzeAudience, predictVirality } from '../../services/openaiService';
import { getTopHashtags, getEngagementByDay, fmtNumber } from '../../utils/format';
import '../../utils/chartSetup';

function MarkdownOutput({ text }) {
  if (!text) return null;
  return (
    <div className="ai-output space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="font-display font-bold text-base text-ink mt-4 mb-1">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <p key={i} className="text-ink-muted pl-3 border-l-2 border-primary-100">{line.slice(2)}</p>;
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-ink">{line}</p>;
      })}
    </div>
  );
}

const CHART_OPTS_BAR = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111827',
      titleFont: { family: 'DM Sans', size: 12 },
      bodyFont: { family: 'DM Sans', size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: { grid: { color: '#F3F4F6' }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#9CA3AF' }, border: { display: false } },
    y: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#374151' } },
  },
};

const CHART_OPTS_DONUT = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { font: { family: 'DM Sans', size: 11 }, usePointStyle: true, pointStyleWidth: 8, boxHeight: 6, color: '#6B7280' },
    },
    tooltip: {
      backgroundColor: '#111827',
      titleFont: { family: 'DM Sans', size: 12 },
      bodyFont: { family: 'DM Sans', size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
};

export default function AudienceSection() {
  const { state } = useApp();
  const { posts, credentials } = state;

  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const [concept, setConcept] = useState('');
  const [prediction, setPrediction] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predError, setPredError] = useState('');

  const topHashtags = useMemo(() => getTopHashtags(posts, 12), [posts]);
  const engByDay = useMemo(() => getEngagementByDay(posts), [posts]);

  const typeBreakdown = useMemo(() => {
    const counts = posts.reduce((acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {});
    return Object.entries(counts);
  }, [posts]);

  const hashtagChartData = {
    labels: topHashtags.map(h => `#${h.tag}`),
    datasets: [{
      data: topHashtags.map(h => h.count),
      backgroundColor: topHashtags.map((_, i) => {
        const opacity = 1 - (i / topHashtags.length) * 0.5;
        return `rgba(15,82,87,${opacity})`;
      }),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const dayChartData = {
    labels: engByDay.map(d => d.label),
    datasets: [{
      label: 'Avg Engagement',
      data: engByDay.map(d => d.avg),
      backgroundColor: 'rgba(15,82,87,0.15)',
      borderColor: '#0F5257',
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const TYPE_PALETTE = ['#0F5257', '#5AAFB4', '#90CAD0', '#C7E4E6', '#EBF5F6'];
  const donutData = {
    labels: typeBreakdown.map(([t]) => t),
    datasets: [{
      data: typeBreakdown.map(([, c]) => c),
      backgroundColor: TYPE_PALETTE.slice(0, typeBreakdown.length),
      borderWidth: 0,
    }],
  };

  async function handleAnalyze() {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await analyzeAudience(credentials.openaiKey, posts);
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handlePredict() {
    if (!concept.trim() || isPredicting) return;
    setIsPredicting(true);
    setPredError('');
    try {
      const result = await predictVirality(credentials.openaiKey, concept.trim(), posts);
      setPrediction(result);
    } catch (err) {
      setPredError(err.message);
    } finally {
      setIsPredicting(false);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="section-title">Audience & Trends</h1>
        <div className="card p-12 text-center">
          <p className="text-ink-muted">No data yet — sync your platforms to see audience insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Audience & Trends</h1>
        <p className="text-ink-muted mt-1">Deep-dive into your performance patterns</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-display font-semibold text-sm text-ink mb-4">Top Hashtags</h2>
          {topHashtags.length > 0 ? (
            <div style={{ height: Math.min(topHashtags.length * 28 + 20, 320) }}>
              <Bar data={hashtagChartData} options={{ ...CHART_OPTS_BAR }} />
            </div>
          ) : (
            <p className="text-ink-muted text-sm text-center py-8">No hashtag data found in your posts.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-sm text-ink mb-4">Engagement by Day</h2>
          <div style={{ height: 220 }}>
            <Bar data={dayChartData} options={{ ...CHART_OPTS_BAR, indexAxis: 'x' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <h2 className="font-display font-semibold text-sm text-ink mb-4">Content Mix</h2>
          {typeBreakdown.length > 0 ? (
            <div style={{ height: 180 }}>
              <Doughnut data={donutData} options={CHART_OPTS_DONUT} />
            </div>
          ) : (
            <p className="text-ink-muted text-sm text-center py-8">No data</p>
          )}
        </div>

        <div className="card p-5 col-span-2">
          <h2 className="font-display font-semibold text-sm text-ink mb-1">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { label: 'Best Platform', value: (() => { const byCnt = posts.reduce((a, p) => { a[p.platform] = (a[p.platform]||0)+p.engagement; return a; }, {}); const best = Object.entries(byCnt).sort((a,b)=>b[1]-a[1])[0]; return best ? best[0] : 'N/A'; })() },
              { label: 'Top Content Type', value: (() => { const byCnt = posts.reduce((a, p) => { a[p.type] = (a[p.type]||0)+p.engagement; return a; }, {}); const best = Object.entries(byCnt).sort((a,b)=>b[1]-a[1])[0]; return best ? best[0] : 'N/A'; })() },
              { label: 'Best Day', value: (() => { const best = engByDay.sort((a,b)=>b.avg-a.avg)[0]; return best?.label || 'N/A'; })() },
              { label: 'Avg Engagement', value: fmtNumber(Math.round(posts.reduce((s,p)=>s+p.engagement,0)/posts.length)) },
              { label: 'Total Views', value: fmtNumber(posts.reduce((s,p)=>s+(p.views||0),0)) },
              { label: 'Unique Hashtags', value: fmtNumber(new Set(posts.flatMap(p=>p.hashtags||[])).size) },
            ].map(s => (
              <div key={s.label} className="bg-surface rounded-xl p-3">
                <p className="label">{s.label}</p>
                <p className="font-display font-bold text-ink text-base mt-0.5 capitalize">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-base text-ink">AI Audience Analysis</h2>
            <p className="text-ink-muted text-sm mt-0.5">Deep insights powered by GPT-4o Mini</p>
          </div>
          <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn-primary">
            {isAnalyzing ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
                </svg>
                Analyzing…
              </>
            ) : (
              <>✨ {analysis ? 'Re-analyze' : 'Analyze Audience'}</>
            )}
          </button>
        </div>

        {analysisError && <p className="text-red-500 text-sm mb-3">⚠️ {analysisError}</p>}

        {analysis ? (
          <div className="bg-surface rounded-xl p-5 animate-fade-in">
            <MarkdownOutput text={analysis} />
          </div>
        ) : !isAnalyzing && (
          <div className="text-center py-8 text-ink-muted text-sm border-2 border-dashed border-ink-faint/40 rounded-xl">
            Click "Analyze Audience" to get AI-powered insights about your content performance and audience behavior.
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-base text-ink mb-1">🔥 Virality Predictor</h2>
        <p className="text-ink-muted text-sm mb-4">Describe a content concept and get a data-driven viral potential score.</p>
        <div className="flex gap-3">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="e.g. 'A 60-second video showing my morning routine as a creator'"
            value={concept}
            onChange={e => setConcept(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePredict()}
          />
          <button onClick={handlePredict} disabled={!concept.trim() || isPredicting} className="btn-primary flex-shrink-0">
            {isPredicting ? (
              <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
              </svg>
            ) : (
              'Predict'
            )}
          </button>
        </div>

        {predError && <p className="text-red-500 text-sm mt-3">⚠️ {predError}</p>}

        {prediction && (
          <div className="bg-surface rounded-xl p-5 mt-4 animate-slide-up">
            <MarkdownOutput text={prediction} />
          </div>
        )}
      </div>
    </div>
  );
}
