import { createContext, useContext, useReducer } from 'react';

const STORAGE_KEY = 'creator_pulse_v1';

const initialState = {
  isSetupComplete: false,
  credentials: {
    apifyToken: '',
    openaiKey: '',
    platforms: {
      instagram: { enabled: false, handle: '' },
      tiktok: { enabled: false, handle: '' },
      youtube: { enabled: false, handle: '' },
    },
  },
  posts: [],
  isLoading: false,
  loadingMessage: '',
  loadingProgress: 0,
  error: null,
  activeSection: 'home',
  lastFetched: null,
};

function persist(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isSetupComplete: state.isSetupComplete,
      credentials: state.credentials,
      posts: state.posts,
      lastFetched: state.lastFetched,
    }));
  } catch (_) {}
}

function loadFromStorage() {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw);
    return {
      ...initialState,
      isSetupComplete: Boolean(saved.isSetupComplete),
      credentials: {
        ...initialState.credentials,
        ...saved.credentials,
        platforms: {
          ...initialState.credentials.platforms,
          ...(saved.credentials?.platforms || {}),
        },
      },
      posts: Array.isArray(saved.posts) ? saved.posts : [],
      lastFetched: saved.lastFetched || null,
    };
  } catch (_) {
    return initialState;
  }
}

function reducer(state, action) {
  let next;
  switch (action.type) {
    case 'SETUP_COMPLETE':
      next = { ...state, isSetupComplete: true, credentials: action.payload };
      persist(next);
      return next;

    case 'SET_POSTS':
      next = { ...state, posts: action.payload, lastFetched: new Date().toISOString(), isLoading: false, loadingProgress: 0, loadingMessage: '' };
      persist(next);
      return next;

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading, loadingMessage: action.message || '', loadingProgress: action.progress || 0, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, loadingProgress: 0, loadingMessage: '' };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };

    case 'UPDATE_CREDENTIALS':
      next = { ...state, credentials: { ...state.credentials, ...action.payload } };
      persist(next);
      return next;

    case 'RESET':
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      return { ...initialState };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadFromStorage);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
