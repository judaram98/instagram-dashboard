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
        if (line.startsWith('## ')) return <h3 key={i} className="font-display font-bold text-base text-text-primary mt-4 mb-1" style={{ letterSpacing: '-0.02em' }}>{line.replace('## ', '')}</h3>;
        if (line.startsWith('• ') || line.startsWith('- ')) return <p key={i} className="text-text-secondary analysis-list-item">{line.slice(2)}</p>;
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-text-secondary">{line}</p>;
      })}
    </div>
  );
}

const CHART_TOOLTIP = {
  backgroundColor: '#FFFFFF',
  borderColor: 'rgba(0,0,0,0.10)',
  borderWidth: 1,
  titleFont: { family: 'DM Sans', size: 12 },
  bodyFont:  { family: 'DM Sans', size: 12 },
  padding: 12,
  cornerRadius: 10,
  titleColor: '#0F1E25',
  bodyColor:  '#4A5D66',
};

const CHART_OPTS_BAR = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: { legend: { display: false }, tooltip: CHART_TOOLTIP },
  scales: {
    x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#96A6AE' }, border: { display: false } },
    y: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#6B7E87' } },
  },
};

const CHART_OPTS_DONUT = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { font: { family: 'DM Sans', size: 11 }, usePointStyle: true, pointStyleWidth: 8, boxHeight: 6, color: '#6B7E87' },
    },
    tooltip: CHART_TOOLTIP,
  },
};

export default function AudienceSection() {
  const { state } = useApp();
  const { posts, credentials } = state;

  const [analysis, setAnalysis]       = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [concept, setConcept]         = useState('');
  const [prediction, setPrediction]   = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predError, setPredError]     = useState('');

  const topHashtags    = useMemo(() => getTopHashtags(posts, 12), [posts]);
  const engByDay       = useMemo(() => getEngagementByDay(posts), [posts]);
  const typeBreakdown  = useMemo(() => {
    const counts = posts.reduce((acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {});
    return Object.entries(counts);
  }, [posts]);

  const hashtagChartData = {
    labels: topHashtags.map(h => `#${h.tag}`),
    datasets: [{
      data: topHashtags.map(h => h.count),
      backgroundColor: topHashtags.map((_, i) => `rgba(9,128,88,${1 - (i / topHashtags.length) * 0.60})`),
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const dayChartData = {
    labels: engByDay.map(d => d.label),
    datasets: [{
      label: 'Interacción promedio',
      data: engByDay.map(d => d.avg),
      backgroundColor: 'rgba(9,128,88,0.12)',
      borderColor: '#098058',
      borderWidth: 2,
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const TYPE_PALETTE = ['#098058', '#0BAF74', '#CDD5D9', '#96A6AE', '#6B7E87'];
  const donutData = {
    labels: typeBreakdown.map(([t]) => t),
    datasets: [{ data: typeBreakdown.map(([, c]) => c), backgroundColor: TYPE_PALETTE.slice(0, typeBreakdown.length), borderWidth: 0 }],
  };

  async function handleAnalyze() {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try { setAnalysis(await analyzeAudience(credentials.openaiKey, posts)); }
    catch (err) { setAnalysisError(err.message); }
    finally { setIsAnalyzing(false); }
  }

  async function handlePredict() {
    if (!concept.trim() || isPredicting) return;
    setIsPredicting(true);
    setPredError('');
    try { setPrediction(await predictVirality(credentials.openaiKey, concept.trim(), posts)); }
    catch (err) { setPredError(err.message); }
    finally { setIsPredicting(false); }
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="section-title">Audiencia y Tendencias</h1>
        <div className="card p-12 text-center">
          <p className="text-text-secondary text-sm">Sin datos aún — sincroniza tus plataformas para ver insights de audiencia.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Audiencia y Tendencias</h1>
        <p className="text-text-secondary mt-2 text-sm">Análisis profundo de tus patrones de rendimiento</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-display font-semibold text-sm text-text-primary mb-4" style={{ letterSpacing: '-0.02em' }}>Hashtags más usados</h2>
          {topHashtags.length > 0 ? (
            <div style={{ height: Math.min(topHashtags.length * 28 + 20, 320) }}>
              <Bar data={hashtagChartData} options={{ ...CHART_OPTS_BAR }} />
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">No se encontraron hashtags.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-sm text-text-primary mb-4" style={{ letterSpacing: '-0.02em' }}>Interacción por día</h2>
          <div className="chart-height-sm">
            <Bar data={dayChartData} options={{ ...CHART_OPTS_BAR, indexAxis: 'x' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <h2 className="font-display font-semibold text-sm text-text-primary mb-4" style={{ letterSpacing: '-0.02em' }}>Mix de contenido</h2>
          {typeBreakdown.length > 0 ? (
            <div style={{ height: 180 }}>
              <Doughnut data={donutData} options={CHART_OPTS_DONUT} />
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">Sin datos</p>
          )}
        </div>

        <div className="card p-5 col-span-2">
          <h2 className="font-display font-semibold text-sm text-text-primary mb-3" style={{ letterSpacing: '-0.02em' }}>Estadísticas rápidas</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Mejor plataforma',   value: (() => { const b = Object.entries(posts.reduce((a,p)=>{ a[p.platform]=(a[p.platform]||0)+p.engagement; return a; },{})).sort((a,b)=>b[1]-a[1])[0]; return b?b[0]:'N/A'; })() },
              { label: 'Tipo top',            value: (() => { const b = Object.entries(posts.reduce((a,p)=>{ a[p.type]=(a[p.type]||0)+p.engagement; return a; },{})).sort((a,b)=>b[1]-a[1])[0]; return b?b[0]:'N/A'; })() },
              { label: 'Mejor día',           value: (() => { const b = [...engByDay].sort((a,b)=>b.avg-a.avg)[0]; return b?.label||'N/A'; })() },
              { label: 'Interacción prom.',   value: fmtNumber(Math.round(posts.reduce((s,p)=>s+p.engagement,0)/posts.length)) },
              { label: 'Total vistas',        value: fmtNumber(posts.reduce((s,p)=>s+(p.views||0),0)) },
              { label: 'Hashtags únicos',     value: fmtNumber(new Set(posts.flatMap(p=>p.hashtags||[])).size) },
            ].map(s => (
              <div key={s.label} className="settings-row">
                <p className="label">{s.label}</p>
                <p className="font-display font-bold text-text-primary text-sm mt-0.5 capitalize" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-base text-text-primary" style={{ letterSpacing: '-0.02em' }}>Análisis de audiencia IA</h2>
            <p className="text-text-muted text-sm mt-0.5">Impulsado por GPT-4o Mini</p>
          </div>
          <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn-primary">
            {isAnalyzing ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
                </svg>
                Analizando…
              </>
            ) : (
              <>✨ {analysis ? 'Re-analizar' : 'Analizar audiencia'}</>
            )}
          </button>
        </div>
        {analysisError && <p className="text-red-600 text-sm mb-3">⚠️ {analysisError}</p>}
        {analysis ? (
          <div className="analysis-output-wrap p-5 animate-fade-in">
            <MarkdownOutput text={analysis} />
          </div>
        ) : !isAnalyzing && (
          <div className="analysis-empty text-center py-8 text-text-muted text-sm">
            Haz clic en "Analizar audiencia" para obtener insights impulsados por IA sobre tu rendimiento y comportamiento de audiencia.
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-base text-text-primary mb-1" style={{ letterSpacing: '-0.02em' }}>🔥 Predictor de viralidad</h2>
        <p className="text-text-secondary text-sm mb-4">Describe un concepto de contenido y obtén una puntuación de potencial viral basada en datos.</p>
        <div className="flex gap-3">
          <input
            type="text"
            className="input-field flex-1"
            placeholder='Ej: "Un video de 60 segundos mostrando mi rutina matutina como creador"'
            value={concept}
            onChange={e => setConcept(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePredict()}
          />
          <button onClick={handlePredict} disabled={!concept.trim() || isPredicting} className="btn-primary flex-shrink-0">
            {isPredicting ? (
              <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
              </svg>
            ) : 'Predecir'}
          </button>
        </div>
        {predError && <p className="text-red-600 text-sm mt-3">⚠️ {predError}</p>}
        {prediction && (
          <div className="analysis-output-wrap p-5 mt-4 animate-slide-up">
            <MarkdownOutput text={prediction} />
          </div>
        )}
      </div>
    </div>
  );
}
