import { useState } from 'react';
import { useApp } from '../store/appStore';

const PLATFORM_META = {
  instagram: {
    name: 'Instagram',
    placeholder: 'usuario',
    color: 'from-purple-500 to-pink-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  tiktok: {
    name: 'TikTok',
    placeholder: 'usuario',
    color: 'from-zinc-600 to-zinc-800',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.79a8.27 8.27 0 0 0 4.83 1.55V6.88a4.87 4.87 0 0 1-1.06-.19z" />
      </svg>
    ),
  },
  youtube: {
    name: 'YouTube',
    placeholder: '@canal o nombre del canal',
    color: 'from-red-500 to-red-700',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
};

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function SetupScreen() {
  const { dispatch } = useApp();

  const [platforms, setPlatforms] = useState({
    instagram: { enabled: false, handle: '' },
    tiktok:    { enabled: false, handle: '' },
    youtube:   { enabled: false, handle: '' },
  });
  const [apifyToken, setApifyToken] = useState('');
  const [openaiKey, setOpenaiKey]   = useState('');
  const [showApify, setShowApify]   = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [errors, setErrors]         = useState({});

  function togglePlatform(key) {
    setPlatforms(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
    setErrors(prev => { const e = { ...prev }; delete e.platforms; delete e.handles; return e; });
  }

  function setHandle(key, val) {
    setPlatforms(prev => ({ ...prev, [key]: { ...prev[key], handle: val } }));
    setErrors(prev => { const e = { ...prev }; delete e.handles; return e; });
  }

  function validate() {
    const errs = {};
    const hasEnabled = Object.values(platforms).some(p => p.enabled);
    if (!hasEnabled) errs.platforms = 'Activa al menos una plataforma para continuar.';
    const missingHandle = Object.entries(platforms)
      .filter(([, p]) => p.enabled && !p.handle.trim())
      .map(([k]) => k);
    if (missingHandle.length > 0)
      errs.handles = `Ingresa un usuario para: ${missingHandle.join(', ')}.`;
    if (!apifyToken.trim()) errs.apifyToken = 'El token de Apify es obligatorio.';
    if (!openaiKey.trim()) errs.openaiKey = 'La clave de OpenAI es obligatoria.';
    else if (!openaiKey.startsWith('sk-')) errs.openaiKey = 'La clave debe comenzar con "sk-".';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    dispatch({
      type: 'SETUP_COMPLETE',
      payload: { apifyToken: apifyToken.trim(), openaiKey: openaiKey.trim(), platforms },
    });
  }

  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-slide-up">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 platform-badge-pill mb-6">
            <span className="accent-dot animate-pulse-dot" />
            Creator Pulse
          </div>
          <h1 className="font-display font-bold mb-3" style={{ fontSize: '42px', letterSpacing: '-0.04em', lineHeight: '1.05' }}>
            Conecta tu<br />
            <span className="text-accent-gradient">universo creativo</span>
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Vincula tus plataformas y claves API para<br />desbloquear tu panel de analíticas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-8">
          <div>
            <div className="label mb-4">Conectar Plataformas</div>
            {errors.platforms && <p className="text-red-600 text-sm mb-3">⚠️ {errors.platforms}</p>}
            {errors.handles   && <p className="text-red-600 text-sm mb-3">⚠️ {errors.handles}</p>}
            <div className="space-y-2">
              {Object.entries(PLATFORM_META).map(([key, meta]) => {
                const active = platforms[key].enabled;
                return (
                  <div key={key} className={`platform-row ${active ? 'platform-row-active' : ''}`}>
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} text-white flex items-center justify-center flex-shrink-0`}>
                          {meta.icon}
                        </div>
                        <span className="font-medium text-text-primary text-sm">{meta.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePlatform(key)}
                        className={`toggle-wrap ${active ? 'toggle-wrap-on' : 'toggle-wrap-off'}`}
                        aria-label={`Activar ${meta.name}`}
                      >
                        <div className={`toggle-knob ${active ? 'toggle-knob-on' : ''}`} />
                      </button>
                    </div>
                    {active && (
                      <div className="px-4 pb-4">
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                          <input
                            type="text"
                            className="input-field pl-8"
                            placeholder={meta.placeholder}
                            value={platforms[key].handle}
                            onChange={e => setHandle(key, e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="label mb-4">Claves API</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Token de Apify
                  <a href="https://console.apify.com/account/integrations" target="_blank" rel="noreferrer" className="ml-2 text-xs font-normal text-accent-DEFAULT hover:text-accent-bright transition-colors">
                    Obtener token ↗
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showApify ? 'text' : 'password'}
                    className={`input-field pr-11 font-mono text-sm ${errors.apifyToken ? 'input-error' : ''}`}
                    placeholder="apify_api_••••••••••••"
                    value={apifyToken}
                    onChange={e => { setApifyToken(e.target.value); setErrors(p => { const n = {...p}; delete n.apifyToken; return n; }); }}
                  />
                  <button type="button" onClick={() => setShowApify(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                    <EyeIcon open={showApify} />
                  </button>
                </div>
                {errors.apifyToken && <p className="text-red-600 text-xs mt-1">{errors.apifyToken}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Clave de OpenAI
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="ml-2 text-xs font-normal text-accent-DEFAULT hover:text-accent-bright transition-colors">
                    Obtener clave ↗
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showOpenai ? 'text' : 'password'}
                    className={`input-field pr-11 font-mono text-sm ${errors.openaiKey ? 'input-error' : ''}`}
                    placeholder="sk-••••••••••••••••••••"
                    value={openaiKey}
                    onChange={e => { setOpenaiKey(e.target.value); setErrors(p => { const n = {...p}; delete n.openaiKey; return n; }); }}
                  />
                  <button type="button" onClick={() => setShowOpenai(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                    <EyeIcon open={showOpenai} />
                  </button>
                </div>
                {errors.openaiKey && <p className="text-red-600 text-xs mt-1">{errors.openaiKey}</p>}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full text-base py-3.5">
            Ingresar al Panel
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </button>

          <p className="text-center text-xs text-text-muted">
            🔒 Todas las credenciales se almacenan localmente en tu navegador y nunca se transmiten a ningún servidor.
          </p>
        </form>
      </div>
    </div>
  );
}
