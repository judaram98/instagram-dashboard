import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const initialState = {
  user:        null,
  authLoading: true,
  credentials: {
    platforms: {
      instagram: { enabled: false, handle: '' },
      tiktok:    { enabled: false, handle: '' },
      youtube:   { enabled: false, handle: '' },
    },
  },
  posts:          [],
  scheduledPosts: [],
  isLoading:      false,
  loadingMessage: '',
  loadingProgress: 0,
  error:          null,
  activeSection:  'home',
  lastFetched:    null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH':
      return { ...state, user: action.payload, authLoading: false };

    case 'CLEAR_AUTH':
      return {
        ...initialState,
        authLoading: false,
        user: null,
      };

    case 'AUTH_LOADED':
      return { ...state, authLoading: false };

    case 'LOAD_USER_DATA':
      return {
        ...state,
        credentials: {
          platforms: {
            ...initialState.credentials.platforms,
            ...(action.payload.platforms || {}),
          },
        },
        posts:          action.payload.posts          || [],
        scheduledPosts: action.payload.scheduledPosts || [],
        lastFetched:    action.payload.lastFetched    || null,
      };

    case 'SET_POSTS':
      return {
        ...state,
        posts:           action.payload,
        lastFetched:     new Date().toISOString(),
        isLoading:       false,
        loadingProgress: 0,
        loadingMessage:  '',
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading, loadingMessage: action.message || '', loadingProgress: action.progress || 0, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, loadingProgress: 0, loadingMessage: '' };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };

    case 'UPDATE_CREDENTIALS': {
      const updated = { ...state.credentials, ...action.payload };
      return { ...state, credentials: updated };
    }

    case 'ADD_SCHEDULED_POST': {
      const filtered = state.scheduledPosts.filter(p => p.id !== action.payload.id);
      return { ...state, scheduledPosts: [...filtered, action.payload] };
    }

    case 'REMOVE_SCHEDULED_POST':
      return { ...state, scheduledPosts: state.scheduledPosts.filter(p => p.id !== action.payload) };

    case 'RESET':
      return { ...initialState, authLoading: false };

    default:
      return state;
  }
}

async function loadUserData(userId, dispatch) {
  try {
    const [{ data: ud }, { data: cp }] = await Promise.all([
      supabase.from('user_data').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('cached_posts').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    dispatch({
      type:    'LOAD_USER_DATA',
      payload: {
        platforms:      ud?.platforms       || {},
        scheduledPosts: ud?.scheduled_posts || [],
        posts:          cp?.posts           || [],
        lastFetched:    cp?.last_fetched    || null,
      },
    });
  } catch {
    dispatch({ type: 'LOAD_USER_DATA', payload: {} });
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef          = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    let subscription;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch({ type: 'SET_AUTH', payload: session.user });
        loadUserData(session.user.id, dispatch);
      } else {
        dispatch({ type: 'AUTH_LOADED' });
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        dispatch({ type: 'SET_AUTH', payload: session.user });
        loadUserData(session.user.id, dispatch);
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'CLEAR_AUTH' });
      }
    });
    subscription = data.subscription;

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = state.user?.id;
    if (!userId) return;
    supabase.from('user_data').upsert(
      { user_id: userId, platforms: state.credentials.platforms, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ).then();
  }, [state.credentials.platforms, state.user?.id]);

  useEffect(() => {
    const userId = state.user?.id;
    if (!userId) return;
    supabase.from('user_data').upsert(
      { user_id: userId, scheduled_posts: state.scheduledPosts, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ).then();
  }, [state.scheduledPosts, state.user?.id]);

  useEffect(() => {
    const userId = state.user?.id;
    if (!userId || !state.lastFetched) return;
    supabase.from('cached_posts').upsert(
      { user_id: userId, posts: state.posts, last_fetched: state.lastFetched, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ).then();
  }, [state.posts, state.user?.id]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
