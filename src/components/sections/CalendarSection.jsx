import { useState } from 'react';
import { useApp } from '../../store/appStore';
import { generateProductionKit } from '../../services/openaiService';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_HEADERS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function buildCalendarDays(year, month) {
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const firstWeekday   = new Date(year, month, 1).getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ day: d, month: m, year: y, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, month, year, current: true });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ day: d, month: m, year: y, current: false });
  }
  return days;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const CONTENT_TYPE_LABELS = { reel: 'Reel', carousel: 'Carrusel', story: 'Historia', post: 'Post', video: 'Video' };

function ViralityMeter({ score }) {
  const barCls   = score >= 80 ? 'virality-bar-high' : score >= 50 ? 'virality-bar-mid' : 'virality-bar-low';
  const badgeCls = score >= 80 ? 'virality-badge-high' : score >= 50 ? 'virality-badge-mid' : 'virality-badge-low';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="label">Predicción de Viralidad</span>
        <span className={`virality-score-badge ${badgeCls}`}>{score}</span>
      </div>
      <div className="virality-bar">
        <div className={`virality-bar-fill ${barCls}`} style={{ '--virality-w': `${score}%` }} />
      </div>
    </div>
  );
}

function ProductionKitRenderer({ kit }) {
  const { production } = kit;
  if (!production) return null;

  if (production.type === 'reel' || production.type === 'video') {
    return (
      <div className="space-y-3">
        {(production.script || []).map((seg, i) => (
          <div key={i} className="script-segment">
            <div className="flex items-center gap-2 mb-2">
              <span className="time-badge">{seg.segment}</span>
            </div>
            <p className="text-sm font-medium text-text-primary">💬 {seg.dialogue}</p>
            <p className="text-xs text-text-secondary mt-1">🎥 B-Roll: {seg.broll}</p>
          </div>
        ))}
      </div>
    );
  }

  if (production.type === 'carousel') {
    return (
      <div className="space-y-3">
        {(production.frames || []).map((frame, i) => (
          <div key={i} className="kit-frame-card">
            <div className="flex items-start gap-3">
              <span className="kit-frame-num mt-0.5">{frame.frame}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{frame.text}</p>
                <p className="text-xs text-text-secondary mt-1">🎨 Prompt IA: {frame.imagePrompt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (production.type === 'story') {
    return (
      <div className="space-y-3">
        {(production.steps || []).map((step, i) => (
          <div key={i} className="kit-frame-card">
            <div className="flex items-start gap-3">
              <span className="kit-frame-num mt-0.5">{step.step}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{step.text}</p>
                <p className="text-xs text-text-secondary mt-1">🎨 {step.imagePrompt}</p>
                {step.stickers && <p className="text-xs text-accent-DEFAULT mt-1">✨ {step.stickers}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (production.type === 'post') {
    return (
      <div className="space-y-3">
        <div className="analysis-block">
          <p className="label mb-2">🎨 Prompt para imagen IA</p>
          <p className="text-sm text-text-secondary">{production.imagePrompt}</p>
        </div>
        {(production.editingTips || []).length > 0 && (
          <div className="analysis-block">
            <p className="label mb-2">✏️ Tips de edición</p>
            <ul className="space-y-1.5">
              {production.editingTips.map((tip, i) => (
                <li key={i} className="analysis-list-item text-sm text-text-secondary">{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function KitModal({ post, posts, apiKey, onClose, onRemove }) {
  const [kit, setKit]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleGenerateKit() {
    if (!apiKey) { setError('Configura tu API Key de OpenAI en Ajustes.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await generateProductionKit(apiKey, post, posts);
      setKit(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const score = kit?.viralityScore ?? post.viralityScore ?? 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel-lg">
        <div className="modal-header mb-5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">
              {post.date} · {CONTENT_TYPE_LABELS[post.contentType] || post.contentType}
            </p>
            <h3 className="font-display font-bold text-text-primary">{post.title}</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 flex-shrink-0 ml-4">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="analysis-block mb-2">
          <p className="text-sm text-text-secondary">{post.concept}</p>
          <p className="text-xs text-text-muted mt-2">{(post.hashtags || []).join(' ')}</p>
        </div>

        {!kit && !loading && (
          <button onClick={handleGenerateKit} className="btn-primary w-full my-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Generar Kit de Producción
          </button>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-8">
            <svg className="w-5 h-5 animate-spin-slow text-accent-DEFAULT" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
            </svg>
            <span className="text-sm text-text-secondary">Generando kit con IA…</span>
          </div>
        )}

        {error && <p className="text-red-600 text-sm my-2">⚠️ {error}</p>}

        {kit && (
          <div className="space-y-4 animate-slide-up">
            <div className="analysis-block">
              <p className="label mb-2">📝 Copy optimizado</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{kit.copy}</p>
            </div>

            <div className="analysis-block">
              <p className="label mb-2">#️⃣ Hashtags</p>
              <p className="text-sm text-accent-DEFAULT font-medium flex-wrap">{(kit.hashtags || []).join('  ')}</p>
            </div>

            <div className="analysis-block">
              <p className="label mb-2">⏰ Hora recomendada</p>
              <p className="text-sm text-text-secondary">{kit.recommendedTime}</p>
            </div>

            <div className="space-y-3">
              <p className="label">
                {kit.production?.type === 'reel' || kit.production?.type === 'video' ? '🎬 Guion Exacto' :
                 kit.production?.type === 'carousel' ? '🖼️ Frames del Carrusel' :
                 kit.production?.type === 'story' ? '📱 Pasos de Historia' :
                 '🖼️ Producción'}
              </p>
              <ProductionKitRenderer kit={kit} />
            </div>

            <ViralityMeter score={score} />
            {kit.viralityReason && (
              <p className="text-xs text-text-muted">{kit.viralityReason}</p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-base-800 mt-4">
          <button onClick={onRemove} className="btn-danger text-xs py-2 px-4">
            Eliminar
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarSection() {
  const { state, dispatch } = useApp();
  const { scheduledPosts, posts, credentials } = state;

  const now = new Date();
  const [currentYear, setCurrentYear]   = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [activePost, setActivePost]     = useState(null);

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  function prevMonth() {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11); }
    else setCurrentMonth(m => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0); }
    else setCurrentMonth(m => m + 1);
  }

  function getPostsForDay(year, month, day) {
    const ds = toDateStr(year, month, day);
    return scheduledPosts.filter(p => p.date === ds);
  }

  function handleDayClick(dayObj) {
    if (!dayObj.current) return;
    const dayPosts = getPostsForDay(dayObj.year, dayObj.month, dayObj.day);
    if (dayPosts.length === 0) return;
    setActivePost(dayPosts[0]);
  }

  function handleRemovePost(postId) {
    dispatch({ type: 'REMOVE_SCHEDULED_POST', payload: postId });
    setActivePost(null);
  }

  const calDays = buildCalendarDays(currentYear, currentMonth);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">Calendario</h1>
          <p className="text-text-secondary mt-2 text-sm">
            {scheduledPosts.length} idea{scheduledPosts.length !== 1 ? 's' : ''} agendada{scheduledPosts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-ghost p-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="font-display font-semibold text-text-primary text-sm min-w-[140px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} className="btn-ghost p-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {scheduledPosts.length === 0 && (
        <div className="ai-info-banner p-4 text-sm">
          💡 Genera ideas en la sección "Ideas IA" y agéndalas aquí para ver tu calendario de contenido.
        </div>
      )}

      <div className="cal-grid">
        {DAY_HEADERS.map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {calDays.map((dayObj, i) => {
          const ds       = toDateStr(dayObj.year, dayObj.month, dayObj.day);
          const isToday  = ds === todayStr && dayObj.current;
          const dayPosts = getPostsForDay(dayObj.year, dayObj.month, dayObj.day);
          const hasPosts = dayPosts.length > 0 && dayObj.current;

          return (
            <div
              key={i}
              onClick={() => handleDayClick(dayObj)}
              className={[
                'cal-day',
                !dayObj.current  ? 'cal-day-other'    : '',
                isToday          ? 'cal-day-today'     : '',
                hasPosts         ? 'cursor-pointer'    : '',
              ].join(' ').trim()}
            >
              {isToday ? (
                <span className="cal-day-num-today">{dayObj.day}</span>
              ) : (
                <span className={`cal-day-num ${!dayObj.current ? 'cal-day-num-other' : ''}`}>
                  {dayObj.day}
                </span>
              )}
              {hasPosts && (
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 2).map(p => (
                    <div key={p.id} className="cal-post-chip">{p.title}</div>
                  ))}
                  {dayPosts.length > 2 && (
                    <p className="text-xs text-text-muted pl-1">+{dayPosts.length - 2} más</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activePost && (
        <KitModal
          post={activePost}
          posts={posts}
          apiKey={credentials.openaiKey}
          onClose={() => setActivePost(null)}
          onRemove={() => handleRemovePost(activePost.id)}
        />
      )}
    </div>
  );
}
