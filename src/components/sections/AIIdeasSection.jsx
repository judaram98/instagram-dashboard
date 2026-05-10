import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../store/appStore';
import { generateContentIdeas, sendChatMessage } from '../../services/openaiService';

const PLATFORMS = ['Cualquiera', 'instagram', 'tiktok', 'youtube'];
const CONTENT_TYPES = ['Cualquiera', 'Video corto', 'Carrusel', 'Tutorial', 'Detrás de cámaras', 'Tendencia', 'Educativo', 'Entretenimiento'];
const TONES = ['Auténtico y cercano', 'Divertido y relatable', 'Inspiracional', 'Educativo', 'Atrevido', 'Estético y tranquilo'];

function SparkleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.916a2 2 0 00-1.272 1.272L12 21l-1.912-5.812a2 2 0 00-1.272-1.272L3 12l5.816-1.916a2 2 0 001.272-1.272L12 3z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function FormattedOutput({ text }) {
  if (!text) return null;
  return (
    <div className="ai-output">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('🎯') || line.startsWith('📝') || line.startsWith('🏷') || line.startsWith('💡'))
          return <p key={i} className={`${i === 0 ? '' : 'mt-2'} ${line.startsWith('🎯') ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{line}</p>;
        if (line.startsWith('---')) return <hr key={i} className="my-4 border-base-800" />;
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

function IdeasTab({ posts, credentials }) {
  const [platform, setPlatform]     = useState('Cualquiera');
  const [contentType, setContentType] = useState('Cualquiera');
  const [tone, setTone]             = useState('Auténtico y cercano');
  const [count, setCount]           = useState(5);
  const [result, setResult]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const text = await generateContentIdeas(
        credentials.openaiKey, posts,
        platform === 'Cualquiera' ? '' : platform,
        contentType === 'Cualquiera' ? '' : contentType,
        tone, count,
      );
      setResult(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">Plataforma</label>
            <select className="input-field py-2.5" value={platform} onChange={e => setPlatform(e.target.value)}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p === 'Cualquiera' ? 'Cualquier plataforma' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label block mb-1.5">Tipo de contenido</label>
            <select className="input-field py-2.5" value={contentType} onChange={e => setContentType(e.target.value)}>
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label block mb-1.5">Tono / Estilo</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)} className={`tone-pill ${tone === t ? 'tone-pill-active' : ''}`}>{t}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="label block mb-1.5">
            Número de ideas: <span className="text-accent-DEFAULT font-bold normal-case">{count}</span>
          </label>
          <input type="range" min={3} max={10} value={count} onChange={e => setCount(Number(e.target.value))} className="w-full cursor-pointer accent-accent-DEFAULT" />
          <div className="flex justify-between text-xs text-text-muted mt-1"><span>3</span><span>10</span></div>
        </div>

        <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
              </svg>
              Generando ideas…
            </>
          ) : (
            <><SparkleIcon /> Generar {count} ideas</>
          )}
        </button>

        {error && <p className="text-red-600 text-sm">⚠️ {error}</p>}
      </div>

      {result && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-text-primary" style={{ letterSpacing: '-0.02em' }}>Ideas generadas</h3>
            <button onClick={() => navigator.clipboard.writeText(result)} className="btn-ghost text-xs py-1.5 px-3">Copiar todo</button>
          </div>
          <FormattedOutput text={result} />
        </div>
      )}

      {!result && !loading && (
        <div className="ideas-empty p-8 text-center">
          <SparkleIcon />
          <p className="text-text-muted text-sm mt-3">Configura tus preferencias arriba y haz clic en Generar para obtener ideas de contenido impulsadas por IA.</p>
        </div>
      )}
    </div>
  );
}

function ChatTab({ posts, credentials }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `¡Hola! Soy tu estratega de contenido IA. He analizado ${posts.length} de tus publicaciones y estoy listo para ayudarte. ¿En qué piensas?` },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const reply   = await sendChatMessage(credentials.openaiKey, history, posts, credentials);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="card overflow-hidden flex flex-col chat-container">
      <div className="p-4 chat-header flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center chat-avatar flex-shrink-0">
          <SparkleIcon />
        </div>
        <div>
          <p className="font-semibold text-text-primary text-sm" style={{ letterSpacing: '-0.01em' }}>Estratega IA</p>
          <p className="text-xs font-medium text-accent-DEFAULT">● En línea</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1 chat-ai-avatar">
                <svg className="w-3.5 h-3.5 text-accent-DEFAULT" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6H8.3A7 7 0 0 1 5 9a7 7 0 0 1 7-7z" />
                </svg>
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 chat-ai-avatar">
              <svg className="w-3.5 h-3.5 text-accent-DEFAULT" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6H8.3A7 7 0 0 1 5 9a7 7 0 0 1 7-7z" />
              </svg>
            </div>
            <div className="chat-bubble-ai">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 rounded-full bg-base-700 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-base-700 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-base-700 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 chat-input-area">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre estrategia, tendencias, tu mejor contenido…"
            rows={1}
            className="input-field resize-none py-2.5 text-sm flex-1"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button onClick={handleSend} disabled={!input.trim() || loading} className="btn-primary px-4 self-end">
            <SendIcon />
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2">Presiona Enter para enviar, Shift+Enter para nueva línea.</p>
      </div>
    </div>
  );
}

export default function AIIdeasSection() {
  const { state } = useApp();
  const { posts, credentials } = state;
  const [tab, setTab] = useState('ideas');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Ideas IA</h1>
        <p className="text-text-secondary mt-2 text-sm">Generación de contenido potenciada por tus datos reales</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('ideas')} className={`tab-btn ${tab === 'ideas' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
          ✨ Generar ideas
        </button>
        <button onClick={() => setTab('chat')} className={`tab-btn ${tab === 'chat' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
          💬 Chat IA
        </button>
      </div>

      {posts.length === 0 && (
        <div className="ai-info-banner p-4 text-sm">
          💡 Sincroniza primero tus plataformas para obtener ideas más precisas y orientadas a datos.
        </div>
      )}

      {tab === 'ideas' ? (
        <IdeasTab posts={posts} credentials={credentials} />
      ) : (
        <ChatTab posts={posts} credentials={credentials} />
      )}
    </div>
  );
}
