import { useState } from 'react';
import { useApp } from '../../store/appStore';
import { fmtRelative, fmtNumber } from '../../utils/format';

const PLATFORM_META = {
  instagram: { label: 'Instagram', color: 'from-purple-500 to-pink-600' },
  tiktok:    { label: 'TikTok',    color: 'from-zinc-600 to-zinc-800' },
  youtube:   { label: 'YouTube',   color: 'from-red-500 to-red-700' },
};

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 6) + '••••••••••••' + key.slice(-4);
}

function Section({ title, children }) {
  return (
    <div className="card p-6">
      <h2 className="font-display font-semibold text-base text-text-primary mb-5 pb-3 settings-section-border" style={{ letterSpacing: '-0.02em' }}>{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsSection() {
  const { state, dispatch } = useApp();
  const { credentials, posts, lastFetched } = state;

  const [editPlatform, setEditPlatform] = useState(null);
  const [editHandle, setEditHandle]     = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [exportDone, setExportDone]     = useState(false);

  function handleEditSave(platform) {
    dispatch({ type: 'UPDATE_CREDENTIALS', payload: { platforms: { ...credentials.platforms, [platform]: { ...credentials.platforms[platform], handle: editHandle.trim() } } } });
    setEditPlatform(null);
    setEditHandle('');
  }

  function handleDisconnect(platform) {
    dispatch({ type: 'UPDATE_CREDENTIALS', payload: { platforms: { ...credentials.platforms, [platform]: { enabled: false, handle: '' } } } });
  }

  function handleConnect(platform) {
    dispatch({ type: 'UPDATE_CREDENTIALS', payload: { platforms: { ...credentials.platforms, [platform]: { enabled: true, handle: '' } } } });
    setEditPlatform(platform);
    setEditHandle('');
  }

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify({ posts, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `creator-pulse-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  }

  async function handleExportPDF() {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const el = document.createElement('div');
      el.style.padding = '24px';
      el.style.fontFamily = 'sans-serif';
      el.innerHTML = `
        <h1 style="color:#098058;margin-bottom:8px">Creator Pulse — Exportación de datos</h1>
        <p style="color:#6B7280;font-size:13px;margin-bottom:24px">Generado ${new Date().toLocaleString('es-MX')} · ${posts.length} publicaciones</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f4f4f5;text-align:left">
            <th style="padding:8px;border:1px solid #D1D5DB">Plataforma</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Tipo</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Descripción</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Interacción</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Vistas</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Fecha</th>
          </tr></thead>
          <tbody>${posts.map((p, i) => `
            <tr style="background:${i%2===0?'#fff':'#F9FAFB'}">
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${p.platform}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${p.type}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${(p.caption||'').slice(0,80)}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${p.engagement.toLocaleString('es-MX')}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${(p.views||0).toLocaleString('es-MX')}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${new Date(p.timestamp).toLocaleDateString('es-MX')}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      `;
      document.body.appendChild(el);
      await html2pdf().from(el).set({
        margin: 10,
        filename: `creator-pulse-${new Date().toISOString().split('T')[0]}.pdf`,
        html2canvas: { scale: 1.5 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      }).save();
      document.body.removeChild(el);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="section-title">Ajustes</h1>
        <p className="text-text-secondary mt-2 text-sm">Gestiona tus conexiones, claves y datos</p>
      </div>

      <Section title="Plataformas conectadas">
        <div className="space-y-2">
          {Object.entries(PLATFORM_META).map(([platform, meta]) => {
            const config    = credentials.platforms[platform];
            const isEditing = editPlatform === platform;
            return (
              <div key={platform} className={`platform-row ${config.enabled ? 'platform-row-active' : ''}`}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} text-white flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
                    {platform.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">{meta.label}</p>
                    {config.enabled ? (
                      <p className="text-text-muted text-xs truncate">@{config.handle || 'sin usuario'}</p>
                    ) : (
                      <p className="text-text-faint text-xs">No conectado</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {config.enabled ? (
                      <>
                        <button onClick={() => { setEditPlatform(isEditing ? null : platform); setEditHandle(config.handle); }} className="btn-ghost text-xs py-1.5 px-3">
                          {isEditing ? 'Cancelar' : 'Editar'}
                        </button>
                        <button onClick={() => handleDisconnect(platform)} className="btn-danger text-xs py-1.5 px-3">Desconectar</button>
                      </>
                    ) : (
                      <button onClick={() => handleConnect(platform)} className="btn-secondary text-xs py-1.5 px-3">Conectar</button>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="px-4 pb-4 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                      <input type="text" className="input-field pl-8" placeholder="usuario" value={editHandle}
                        onChange={e => setEditHandle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEditSave(platform)} autoFocus />
                    </div>
                    <button onClick={() => handleEditSave(platform)} className="btn-primary px-4">Guardar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Claves API">
        <div className="space-y-2">
          <div className="settings-row">
            <div>
              <p className="font-medium text-text-primary text-sm">Token de Apify</p>
              <p className="text-text-muted text-xs font-mono mt-0.5">{maskKey(credentials.apifyToken)}</p>
            </div>
            <button onClick={() => { dispatch({ type: 'UPDATE_CREDENTIALS', payload: { apifyToken: '' } }); dispatch({ type: 'RESET' }); }} className="btn-danger text-xs py-1.5 px-3">
              Limpiar y reiniciar
            </button>
          </div>
          <div className="settings-row">
            <div>
              <p className="font-medium text-text-primary text-sm">Clave de OpenAI</p>
              <p className="text-text-muted text-xs font-mono mt-0.5">{maskKey(credentials.openaiKey)}</p>
            </div>
            <button onClick={() => { dispatch({ type: 'UPDATE_CREDENTIALS', payload: { openaiKey: '' } }); dispatch({ type: 'RESET' }); }} className="btn-danger text-xs py-1.5 px-3">
              Limpiar y reiniciar
            </button>
          </div>
        </div>
      </Section>

      <Section title="Gestión de datos">
        <div className="space-y-2">
          <div className="settings-row">
            <div>
              <p className="font-medium text-text-primary text-sm">Publicaciones en caché</p>
              <p className="text-text-muted text-xs mt-0.5">
                {posts.length} publicaciones almacenadas{lastFetched ? ` · última sincronización ${fmtRelative(lastFetched)}` : ''}
              </p>
            </div>
            <button onClick={() => dispatch({ type: 'SET_POSTS', payload: [] })} disabled={posts.length === 0} className="btn-ghost text-xs py-1.5 px-3">
              Limpiar caché
            </button>
          </div>
          <div className="settings-row">
            <div>
              <p className="font-medium text-text-primary text-sm">Exportar datos</p>
              <p className="text-text-muted text-xs mt-0.5">Descarga tus publicaciones en JSON o PDF</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportJSON} disabled={posts.length === 0} className="btn-secondary text-xs py-1.5 px-3">
                {exportDone ? '✓ Exportado!' : 'JSON'}
              </button>
              <button onClick={handleExportPDF} disabled={posts.length === 0} className="btn-secondary text-xs py-1.5 px-3">PDF</button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Zona de peligro">
        <div className="danger-zone">
          <p className="font-semibold text-red-600 text-sm mb-1">Reiniciar todo</p>
          <p className="text-red-500 text-xs mb-4">Esto eliminará todas las credenciales guardadas, publicaciones y ajustes. Esta acción no se puede deshacer.</p>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="btn-danger text-sm">Reiniciar panel</button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-red-600 text-sm font-medium">¿Estás absolutamente seguro?</p>
              <button onClick={() => dispatch({ type: 'RESET' })} className="btn-danger text-sm">Sí, reiniciar</button>
              <button onClick={() => setConfirmReset(false)} className="btn-ghost text-sm">Cancelar</button>
            </div>
          )}
        </div>
      </Section>

      <div className="text-center py-2">
        <p className="text-xs text-text-muted">Creator Pulse · Todos los datos se almacenan localmente · Sin servidor</p>
      </div>
    </div>
  );
}
