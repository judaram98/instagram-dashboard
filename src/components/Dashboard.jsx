import { AppProvider, useApp } from '../store/appStore';
import SetupScreen from './SetupScreen';
import Sidebar from './Sidebar';
import HomeSection from './sections/HomeSection';
import PostsSection from './sections/PostsSection';
import ConsistencySection from './sections/ConsistencySection';
import AIIdeasSection from './sections/AIIdeasSection';
import AudienceSection from './sections/AudienceSection';
import SettingsSection from './sections/SettingsSection';

const SECTIONS = {
  home:        HomeSection,
  posts:       PostsSection,
  consistency: ConsistencySection,
  ideas:       AIIdeasSection,
  audience:    AudienceSection,
  settings:    SettingsSection,
};

function LoadingOverlay({ message, progress }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
         style={{ background: 'rgba(10,46,37,0.72)', backdropFilter: 'blur(8px)' }}>
      <div className="card p-8 w-full max-w-sm mx-4 text-center animate-slide-up">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-primary animate-spin-slow" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="20 40" />
          </svg>
        </div>
        <h3 className="font-display font-bold text-lg text-ink mb-1">Syncing Your Data</h3>
        <p className="text-ink-muted text-sm mb-5">{message || 'Please wait…'}</p>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, progress)}%` }}
          />
        </div>
        <p className="text-ink-muted text-xs mt-2 tabular-nums">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

function ErrorToast({ message, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 card p-4 max-w-sm animate-slide-up bg-red-50 border-red-100 flex items-start gap-3 shadow-lg">
      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-red-800 text-sm">Something went wrong</p>
        <p className="text-red-600 text-sm mt-0.5 break-words">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

function DashboardApp() {
  const { state, dispatch } = useApp();

  if (!state.isSetupComplete) return <SetupScreen />;

  const ActiveSection = SECTIONS[state.activeSection] || HomeSection;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: '#0A2E25' }}
    >
      <Sidebar />

      <main className="flex-1 overflow-hidden p-4 pl-3">
        <div className="glass-panel h-full overflow-y-auto">
          <div
            className="p-8 max-w-7xl mx-auto animate-fade-in"
            key={state.activeSection}
          >
            <ActiveSection />
          </div>
        </div>
      </main>

      {state.isLoading && (
        <LoadingOverlay message={state.loadingMessage} progress={state.loadingProgress} />
      )}

      {state.error && (
        <ErrorToast message={state.error} onDismiss={() => dispatch({ type: 'CLEAR_ERROR' })} />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <AppProvider>
      <DashboardApp />
    </AppProvider>
  );
}
