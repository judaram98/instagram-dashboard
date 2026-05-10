import { useApp } from '../store/appStore';
import { scrapeAllPlatforms } from '../services/apifyService';
import { fmtRelative } from '../utils/format';

const NAV = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'posts',
    label: 'Posts',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'consistency',
    label: 'Consistency',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="15.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'ideas',
    label: 'AI Ideas',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 5.197 11.823A5 5 0 0 1 14 17H10a5 5 0 0 1-3.197-3.177A7 7 0 0 1 12 2z" />
        <line x1="9" y1="21" x2="15" y2="21" />
        <line x1="10.5" y1="17" x2="10.5" y2="21" />
        <line x1="13.5" y1="17" x2="13.5" y2="21" />
      </svg>
    ),
  },
  {
    id: 'audience',
    label: 'Audience',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const PLATFORM_DOT_COLORS = {
  instagram: 'bg-gradient-to-br from-purple-400 to-pink-500',
  tiktok:    'bg-slate-400',
  youtube:   'bg-red-400',
};

function SyncIcon({ spinning }) {
  return (
    <svg
      className={`w-3.5 h-3.5 flex-shrink-0 ${spinning ? 'animate-spin-slow' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {spinning ? (
        <circle cx="12" cy="12" r="10" strokeDasharray="20 40" />
      ) : (
        <>
          <polyline points="1 4 1 10 7 10" />
          <polyline points="23 20 23 14 17 14" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
        </>
      )}
    </svg>
  );
}

export default function Sidebar() {
  const { state, dispatch } = useApp();

  async function handleSync() {
    if (state.isLoading) return;
    try {
      dispatch({ type: 'SET_LOADING', loading: true, message: 'Starting scrapers…', progress: 5 });
      const posts = await scrapeAllPlatforms(state.credentials, (platform, msg, overall) => {
        dispatch({
          type: 'SET_LOADING',
          loading: true,
          message: `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${msg}`,
          progress: overall,
        });
      });
      dispatch({ type: 'SET_POSTS', payload: posts });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }

  const enabledPlatforms = Object.entries(state.credentials.platforms).filter(([, p]) => p.enabled);

  return (
    <aside className="sidebar-wrap">
      <div className="sidebar-logo-area">
        <div className="sidebar-logo-mark">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#A7F3D0' }}>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div>
          <p className="sidebar-brand">Pulse</p>
          <p className="sidebar-sub">Creator Studio</p>
        </div>
      </div>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menu</span>

        {NAV.map(item => {
          const isActive = state.activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_SECTION', payload: item.id })}
              className={`nav-item w-full text-left ${isActive ? 'nav-item-active' : ''}`}
            >
              {item.icon}
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && <span className="nav-active-pip" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {enabledPlatforms.length > 0 && (
          <div className="sidebar-platforms-row">
            {enabledPlatforms.map(([key]) => (
              <div
                key={key}
                className={`sidebar-platform-dot ${PLATFORM_DOT_COLORS[key]}`}
                title={`@${state.credentials.platforms[key].handle}`}
              />
            ))}
            <span
              className="text-[11px] ml-1.5 truncate"
              style={{ color: 'rgba(255,255,255,0.38)' }}
            >
              {enabledPlatforms.map(([, p]) => `@${p.handle}`).join(', ')}
            </span>
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={state.isLoading}
          className="btn-glass-green"
        >
          <SyncIcon spinning={state.isLoading} />
          {state.isLoading ? 'Syncing…' : 'Sync Data'}
        </button>

        {state.lastFetched ? (
          <p className="sidebar-footer-text">
            Updated {fmtRelative(state.lastFetched)}
          </p>
        ) : state.posts.length > 0 ? (
          <p className="sidebar-footer-text">
            {state.posts.length} posts cached
          </p>
        ) : null}
      </div>
    </aside>
  );
}
