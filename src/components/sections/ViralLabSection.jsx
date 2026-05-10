import { useState } from 'react';
import { useApp } from '../../store/appStore';
import { detectNiche, analyzeViralContent } from '../../services/openaiService';

const PLATFORMS_LAB = ['instagram', 'tiktok', 'youtube'];

function fmtNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n || 0);
}

function generateMockViralPosts(niche, platform, count = 8) {
  const creators = ['@viral.creator', '@top.content.mx', '@growth.hack.pro', '@niche.master', '@trending.now', '@mega.viral', '@real.creator', '@content.pro'];
  const types    = ['reel', 'carousel', 'reel', 'reel', 'carousel', 'reel', 'story', 'reel'];
  const captions = [
    `5 secretos de ${niche} que nadie te dice`,
    `Esto cambió todo en ${niche} (honestidad total)`,
    `El error #1 que cometes en ${niche}`,
    `De 0 a referente en ${niche}: mi ruta real`,
    `Por qué el 90% fracasa en ${niche}`,
    `${niche}: 3 años de aprendizaje en 60 segundos`,
    `Si empezara en ${niche} hoy, haría esto primero`,
    `La táctica de ${niche} que nadie quiere revelar`,
  ];
  const viewBases = [450_000, 890_000, 1_200_000, 320_000, 670_000, 2_100_000, 780_000, 540_000];

  return Array.from({ length: count }, (_, i) => {
    const views    = viewBases[i % viewBases.length] + Math.floor(Math.random() * 300_000);
    const likes    = Math.floor(views * (0.06  + Math.random() * 0.06));
    const comments = Math.floor(views * (0.005 + Math.random() * 0.005));
    const shares   = Math.floor(views * (0.015 + Math.random() * 0.01));
    return {
      id:         `mock_${i}_${Date.now()}`,
      platform,
      type:       types[i % types.length],
      creator:    creators[i % creators.length],
      caption:    captions[i % captions.length],
      thumbnail:  null,
      likes,
      comments,
      views,
      shares,
      engagement: likes + comments + shares,
      hashtags:   [`#${niche.replace(/\s+/g, '')}`, `#${niche.replace(/\s+/g, '')}tips`, '#viral', '#tendencia', '#contenido'],
      timestamp:  new Date(Date.now() - (i + 1) * 2 * 86_400_000).toISOString(),
    };
  });
}

const TYPE_LABELS = { reel: 'Reel', carousel: 'Carrusel', story: 'Historia', video: 'Video', post: 'Post', short: 'Short' };

function TypeBadge({ type }) {
  return (
    <span className="post-type-badge text-xs font-semibold px-2 py-0.5 rounded-md">
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function ViralPostCard({ post, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`viral-post-card text-left w-full ${active ? 'viral-post-card-active' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-text-muted truncate">{post.creator}</p>
        <TypeBadge type={post.type} />
      </div>
      <p className="text-sm font-medium text-text-primary line-clamp-2 mb-3">{post.caption}</p>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>👁 {fmtNum(post.views)}</span>
        <span>❤️ {fmtNum(post.likes)}</span>
        <span>💬 {fmtNum(post.comments)}</span>
      </div>
    </button>
  );
}

function AnalysisPanel({ post, analysis, loading, error, onAnalyze }) {
  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-muted mb-0.5">{post.creator}</p>
          <p className="font-semibold text-text-primary text-sm line-clamp-2">{post.caption}</p>
        </div>
        <TypeBadge type={post.type} />
      </div>

      <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="text-center flex-1">
          <p className="text-lg font-bold text-text-primary">{fmtNum(post.views)}</p>
          <p className="text-xs text-text-muted">Vistas</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-lg font-bold text-text-primary">{fmtNum(post.likes)}</p>
          <p className="text-xs text-text-muted">Likes</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-lg font-bold text-text-primary">{fmtNum(post.engagement)}</p>
          <p className="text-xs text-text-muted">Interacción</p>
        </div>
      </div>

      {!analysis && !loading && (
        <button onClick={onAnalyze} className="btn-primary w-full">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Analizar con IA
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-6">
          <svg className="w-5 h-5 animate-spin-slow text-accent-DEFAULT" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
          </svg>
          <span className="text-sm text-text-secondary">Analizando con IA…</span>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">⚠️ {error}</p>}

      {analysis && (
        <div className="space-y-3 animate-slide-up">
          <div className="analysis-block">
            <p className="label mb-2">🎣 Gancho (Hook)</p>
            <p className="text-sm text-text-secondary">{analysis.hook}</p>
          </div>

          <div className="analysis-block">
            <p className="label mb-2">🔄 Tácticas de Retención</p>
            <ul className="space-y-1.5">
              {analysis.retentionTactics.map((t, i) => (
                <li key={i} className="analysis-list-item text-sm text-text-secondary">{t}</li>
              ))}
            </ul>
          </div>

          <div className="analysis-block">
            <p className="label mb-2">#️⃣ Análisis de Hashtags / Copy</p>
            <p className="text-sm text-text-secondary">{analysis.hashtagAnalysis}</p>
          </div>

          <div className="analysis-block">
            <p className="label mb-2">✨ Cómo replicarlo de forma única</p>
            <p className="text-sm text-text-secondary">{analysis.replicationGuide}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViralLabSection() {
  const { state } = useApp();
  const { posts, credentials } = state;

  const [niche, setNiche]               = useState('');
  const [nicheLoading, setNicheLoading] = useState(false);
  const [nicheError, setNicheError]     = useState('');

  const [searchQuery, setSearchQuery]       = useState('');
  const [searchPlatform, setSearchPlatform] = useState('instagram');
  const [viralPosts, setViralPosts]         = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);

  const [selectedPost, setSelectedPost]       = useState(null);
  const [analysis, setAnalysis]               = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError]     = useState('');

  async function handleDetectNiche() {
    if (!credentials.openaiKey) {
      setNicheError('Configura tu API Key de OpenAI en Ajustes.');
      return;
    }
    setNicheLoading(true);
    setNicheError('');
    try {
      const detected = await detectNiche(credentials.openaiKey, posts);
      setNiche(detected);
      setSearchQuery(detected);
    } catch (err) {
      setNicheError(err.message);
    } finally {
      setNicheLoading(false);
    }
  }

  function handleSearch() {
    const query = searchQuery.trim() || niche || 'contenido general';
    setSearchLoading(true);
    setSelectedPost(null);
    setAnalysis(null);
    setTimeout(() => {
      setViralPosts(generateMockViralPosts(query, searchPlatform, 8));
      setSearchLoading(false);
    }, 1200);
  }

  async function handleAnalyze() {
    if (!selectedPost || !credentials.openaiKey) return;
    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysis(null);
    try {
      const result = await analyzeViralContent(credentials.openaiKey, selectedPost, posts);
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  }

  function handleSelectPost(post) {
    setSelectedPost(post);
    setAnalysis(null);
    setAnalysisError('');
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Viral Lab</h1>
        <p className="text-text-secondary mt-2 text-sm">Analiza contenido viral de tu nicho y descubre las tácticas ganadoras</p>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text-primary text-sm mb-1">Tu Nicho Detectado</p>
            {niche ? (
              <p className="text-accent-DEFAULT font-bold capitalize">{niche}</p>
            ) : (
              <p className="text-text-muted text-sm">Detecta tu nicho automáticamente desde tus publicaciones</p>
            )}
            {nicheError && <p className="text-red-600 text-xs mt-1">⚠️ {nicheError}</p>}
          </div>
          <button onClick={handleDetectNiche} disabled={nicheLoading} className="btn-secondary flex-shrink-0">
            {nicheLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
                </svg>
                Detectando…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Detectar Nicho
              </>
            )}
          </button>
        </div>

        <div className="section-divider" />

        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="label block mb-1.5">Nicho a buscar</label>
            <input
              type="text"
              className="input-field"
              placeholder="ej. fitness, finanzas personales, viajes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="label block mb-1.5">Plataforma</label>
            <select className="input-field py-2.5 w-32" value={searchPlatform} onChange={e => setSearchPlatform(e.target.value)}>
              {PLATFORMS_LAB.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSearch} disabled={searchLoading} className="btn-primary">
            {searchLoading ? (
              <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            {searchLoading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </div>

      {viralPosts.length === 0 && !searchLoading && (
        <div className="ideas-empty p-10 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <p className="text-text-muted text-sm">Detecta tu nicho y lanza una búsqueda para ver contenido viral de otros creadores.</p>
        </div>
      )}

      {(viralPosts.length > 0 || selectedPost) && (
        <div className={`grid gap-5 ${selectedPost ? 'grid-cols-[1fr_340px]' : 'grid-cols-1'}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text-primary text-sm">Posts virales encontrados</p>
              <span className="text-xs text-text-muted">{viralPosts.length} resultados</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {viralPosts.map(post => (
                <ViralPostCard
                  key={post.id}
                  post={post}
                  active={selectedPost?.id === post.id}
                  onClick={() => handleSelectPost(post)}
                />
              ))}
            </div>
          </div>

          {selectedPost && (
            <div className="space-y-3">
              <p className="font-semibold text-text-primary text-sm">Análisis de contenido</p>
              <AnalysisPanel
                post={selectedPost}
                analysis={analysis}
                loading={analysisLoading}
                error={analysisError}
                onAnalyze={handleAnalyze}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
