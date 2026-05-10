import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [mode, setMode]       = useState('signin');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) throw err;
        setSuccess('Cuenta creada. Revisa tu email para confirmar.');
      }
    } catch (err) {
      const MSG = {
        'Invalid login credentials':                  'Email o contraseña incorrectos.',
        'Email not confirmed':                        'Confirma tu email antes de iniciar sesión.',
        'Password should be at least 6 characters':   'La contraseña debe tener al menos 6 caracteres.',
        'User already registered':                    'Ya existe una cuenta con ese email.',
      };
      setError(MSG[err.message] || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card animate-scale-in">
        <div className="login-brand-area">
          <div className="login-brand-mark">
            <svg className="w-4 h-4 text-accent-DEFAULT" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <p className="login-brand-name">Creator Pulse</p>
        </div>

        <h1 className="login-title">
          {mode === 'signin' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
        </h1>
        <p className="login-sub">
          {mode === 'signin' ? 'Inicia sesión para continuar' : 'Empieza a analizar tu contenido hoy'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 mt-6">
          <div>
            <label className="label block mb-1.5">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Contraseña</label>
            <input
              type="password"
              className="input-field"
              placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error   && <p className="text-red-600 text-sm py-2 px-3 rounded-xl login-error-banner">⚠️ {error}</p>}
          {success && <p className="text-accent-DEFAULT text-sm py-2 px-3 rounded-xl login-success-banner">✓ {success}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="20 40" />
                </svg>
                {mode === 'signin' ? 'Iniciando sesión…' : 'Creando cuenta…'}
              </>
            ) : (
              mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'
            )}
          </button>
        </form>

        <div className="login-divider">
          <span className="login-divider-text">
            {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          </span>
        </div>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
          className="btn-secondary w-full"
        >
          {mode === 'signin' ? 'Crear cuenta nueva' : 'Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}
