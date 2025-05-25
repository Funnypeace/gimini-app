// components/AuthForm.tsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthForm: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isLogin) {
      // Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onLogin();
    } else {
      // Registrierung
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else onLogin();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xs mx-auto p-6 bg-slate-800 rounded-xl shadow">
      <h2 className="text-lg font-bold mb-4">{isLogin ? 'Login' : 'Registrieren'}</h2>
      <input
        className="mb-2 w-full px-3 py-2 rounded bg-slate-900 text-white border border-slate-600"
        placeholder="E-Mail"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        className="mb-4 w-full px-3 py-2 rounded bg-slate-900 text-white border border-slate-600"
        placeholder="Passwort"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-red-400 mb-2">{error}</div>}
      <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold">
        {isLogin ? 'Login' : 'Registrieren'}
      </button>
      <button
        type="button"
        className="mt-2 w-full py-1 text-sky-400 underline"
        onClick={() => setIsLogin(prev => !prev)}
      >
        {isLogin ? 'Noch keinen Account? Jetzt registrieren!' : 'Schon einen Account? Zum Login'}
      </button>
    </form>
  );
};

export default AuthForm;
