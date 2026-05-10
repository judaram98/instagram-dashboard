import { useState } from 'react';
import { useApp } from '../../store/appStore';
import { fmtRelative, fmtNumber } from '../../utils/format';

const PLATFORM_META = {
  instagram: { label: 'Instagram', color: 'from-purple-400 to-pink-500' },
  tiktok: { label: 'TikTok', color: 'from-slate-700 to-slate-900' },
  youtube: { label: 'YouTube', color: 'from-red-400 to-red-600' },
};

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 6) + '••••••••••••' + key.slice(-4);
}

function Section({ title, children }) {
  return (
    <div className="card p-6">
      <h2 className="font-display font-semibold text-base text-ink mb-5 pb-3 border-b border-ink-faint/30">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsSection() {
  const { state, dispatch } = useApp();
  const { credentials, posts, lastFetched } = state;

  const [editPlatform, setEditPlatform] = useState(null);
  const [editHandle, setEditHandle] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  function handleEditSave(platform) {
    dispatch({
      type: 'UPDATE_CREDENTIALS',
      payload: {
        platforms: {
          ...credentials.platforms,
          [platform]: { ...credentials.platforms[platform], handle: editHandle.trim() },
        },
      },
    });
    setEditPlatform(null);
    setEditHandle('');
  }

  function handleDisconnect(platform) {
    dispatch({
      type: 'UPDATE_CREDENTIALS',
      payload: {
        platforms: {
          ...credentials.platforms,
          [platform]: { enabled: false, handle: '' },
        },
      },
    });
  }

  function handleConnect(platform) {
    dispatch({
      type: 'UPDATE_CREDENTIALS',
      payload: {
        platforms: {
          ...credentials.platforms,
          [platform]: { enabled: true, handle: '' },
        },
      },
    });
    setEditPlatform(platform);
    setEditHandle('');
  }

  function handleClearPosts() {
    dispatch({ type: 'SET_POSTS', payload: [] });
  }

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify({ posts, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
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
        <h1 style="color:#0F5257;margin-bottom:8px">Creator Pulse — Data Export</h1>
        <p style="color:#6B7280;font-size:13px;margin-bottom:24px">Generated ${new Date().toLocaleString()} · ${posts.length} posts</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#EBF5F6;text-align:left">
            <th style="padding:8px;border:1px solid #D1D5DB">Platform</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Type</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Caption</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Engagement</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Views</th>
            <th style="padding:8px;border:1px solid #D1D5DB">Date</th>
          </tr></thead>
          <tbody>${posts.map((p, i) => `
            <tr style="background:${i%2===0?'#fff':'#F9FAFB'}">
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${p.platform}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${p.type}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB;max-width:200px;overflow:hidden">${(p.caption||'').slice(0,80)}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${p.engagement.toLocaleString()}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${(p.views||0).toLocaleString()}</td>
              <td style="padding:7px 8px;border:1px solid #D1D5DB">${new Date(p.timestamp).toLocaleDateString()}</td>
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
      console.error('PDF export failed:', err);
    }
  }

  function handleReset() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-ink-muted mt-1">Manage your connections, keys, and data</p>
      </div>

      <Section title="Connected Platforms">
        <div className="space-y-3">
          {Object.entries(PLATFORM_META).map(([platform, meta]) => {
            const config = credentials.platforms[platform];
            const isEditing = editPlatform === platform;

            return (
              <div key={platform} className={`rounded-xl border-2 overflow-hidden ${config.enabled ? 'border-primary/20 bg-primary-50/30' : 'border-ink-faint/40'}`}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.color} text-white flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
                    {platform.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm">{meta.label}</p>
                    {config.enabled ? (
                      <p className="text-ink-muted text-xs truncate">@{config.handle || 'no handle set'}</p>
                    ) : (
                      <p className="text-ink-faint text-xs">Not connected</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {config.enabled ? (
                      <>
                        <button
                          onClick={() => { setEditPlatform(isEditing ? null : platform); setEditHandle(config.handle); }}
                          className="btn-ghost text-xs py-1.5 px-3"
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                        <button onClick={() => handleDisconnect(platform)} className="btn-danger text-xs py-1.5 px-3">
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleConnect(platform)} className="btn-secondary text-xs py-1.5 px-3">
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="px-4 pb-4 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">@</span>
                      <input
                        type="text"
                        className="input-field pl-8"
                        placeholder="username"
                        value={editHandle}
                        onChange={e => setEditHandle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEditSave(platform)}
                        autoFocus
                      />
                    </div>
                    <button onClick={() => handleEditSave(platform)} className="btn-primary px-4">Save</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="API Keys">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface">
            <div>
              <p className="font-medium text-ink text-sm">Apify API Token</p>
              <p className="text-ink-muted text-xs font-mono mt-0.5">{maskKey(credentials.apifyToken)}</p>
            </div>
            <button
              onClick={() => {
                dispatch({ type: 'UPDATE_CREDENTIALS', payload: { apifyToken: '' } });
                dispatch({ type: 'RESET' });
              }}
              className="btn-danger text-xs py-1.5 px-3"
            >
              Clear & Reset
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface">
            <div>
              <p className="font-medium text-ink text-sm">OpenAI API Key</p>
              <p className="text-ink-muted text-xs font-mono mt-0.5">{maskKey(credentials.openaiKey)}</p>
            </div>
            <button
              onClick={() => {
                dispatch({ type: 'UPDATE_CREDENTIALS', payload: { openaiKey: '' } });
                dispatch({ type: 'RESET' });
              }}
              className="btn-danger text-xs py-1.5 px-3"
            >
              Clear & Reset
            </button>
          </div>
        </div>
      </Section>

      <Section title="Data Management">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface">
            <div>
              <p className="font-medium text-ink text-sm">Cached Posts</p>
              <p className="text-ink-muted text-xs mt-0.5">
                {posts.length} posts stored
                {lastFetched ? ` · last synced ${fmtRelative(lastFetched)}` : ''}
              </p>
            </div>
            <button onClick={handleClearPosts} disabled={posts.length === 0} className="btn-ghost text-xs py-1.5 px-3">
              Clear cache
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface">
            <div>
              <p className="font-medium text-ink text-sm">Export Data</p>
              <p className="text-ink-muted text-xs mt-0.5">Download your posts as JSON or PDF</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportJSON} disabled={posts.length === 0} className="btn-secondary text-xs py-1.5 px-3">
                {exportDone ? '✓ Exported!' : 'JSON'}
              </button>
              <button onClick={handleExportPDF} disabled={posts.length === 0} className="btn-secondary text-xs py-1.5 px-3">
                PDF
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Danger Zone">
        <div className="p-4 rounded-xl border-2 border-red-100 bg-red-50">
          <p className="font-semibold text-red-800 text-sm mb-1">Reset Everything</p>
          <p className="text-red-600 text-xs mb-4">This will delete all saved credentials, posts, and settings. You cannot undo this action.</p>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="btn-danger text-sm">
              Reset Dashboard
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-red-700 text-sm font-medium">Are you absolutely sure?</p>
              <button onClick={handleReset} className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Yes, reset
              </button>
              <button onClick={() => setConfirmReset(false)} className="btn-ghost text-sm">
                Cancel
              </button>
            </div>
          )}
        </div>
      </Section>

      <div className="text-center py-2">
        <p className="text-xs text-ink-muted">Creator Pulse · All data stored locally · No server involved</p>
      </div>
    </div>
  );
}
