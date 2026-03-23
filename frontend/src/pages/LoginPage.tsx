import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, UserPlus, GraduationCap, Sparkles } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [mode,    setMode]    = useState<Mode>('login');
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [show,    setShow]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/attendance'); }
    catch (err: any) { setError(err.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      await login(form.email, form.password);
      navigate('/attendance');
    } catch (err: any) { setError(err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const switchMode = (m: Mode) => {
    setMode(m); setError('');
    setForm({ name: '', email: '', password: '', confirm: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--background)' }}>

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}/>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}/>
      </div>

      <div className="relative w-full max-w-md fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 pulse-glow"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <GraduationCap size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-black gradient-text tracking-tight">ReportGen</h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--foreground-2)' }}>
            Attendance Intelligence Platform · PCCOE
          </p>
        </div>

        {/* Card */}
        <div className="glass-bright rounded-2xl p-8 shadow-deep">
          {/* Mode tabs */}
          <div className="flex rounded-xl p-1 mb-6 gap-1"
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            {(['login','register'] as Mode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 capitalize"
                style={{
                  background: mode === m ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--foreground-2)',
                  boxShadow: mode === m ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
                }}>
                {m === 'login' ? '🔑 Sign In' : '✨ Register'}
              </button>
            ))}
          </div>

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {['email','password'].map(field => (
                <div key={field}>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                    style={{ color: 'var(--foreground-2)' }}>
                    {field === 'email' ? 'Email Address' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={field === 'password' ? (show ? 'text' : 'password') : 'email'}
                      required value={(form as any)[field]}
                      onChange={update(field)}
                      placeholder={field === 'email' ? 'you@example.com' : '••••••••'}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--border-bright)',
                        color: 'var(--foreground)',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.boxShadow='0 0 0 3px var(--primary-glow)'; }}
                      onBlur={e  => { e.currentTarget.style.borderColor='var(--border-bright)'; e.currentTarget.style.boxShadow='none'; }}
                    />
                    {field === 'password' && (
                      <button type="button" onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'var(--foreground-3)' }}>
                        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background: 'rgba(244,63,94,0.12)', border:'1px solid rgba(244,63,94,0.3)', color:'#fb7185' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: loading ? 'var(--surface-2)' : 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: loading ? 'none' : '0 8px 25px rgba(99,102,241,0.4)' }}>
                <LogIn size={16}/>{loading ? 'Signing in…' : 'Sign In'}
              </button>

            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {[
                { key:'name',    label:'Full Name',       type:'text',     ph:'Your full name' },
                { key:'email',   label:'Email Address',   type:'email',    ph:'you@example.com' },
                { key:'password',label:'Password',        type:'password', ph:'Min. 6 characters' },
                { key:'confirm', label:'Confirm Password',type:'password', ph:'Re-enter password' },
              ].map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                    style={{ color: 'var(--foreground-2)' }}>{label}</label>
                  <div className="relative">
                    <input type={type === 'password' ? (show ? 'text' : 'password') : type}
                      required value={(form as any)[key]} onChange={update(key)} placeholder={ph}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none"
                      style={{ background:'rgba(0,0,0,0.35)', border:'1px solid var(--border-bright)', color:'var(--foreground)' }}
                      onFocus={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.boxShadow='0 0 0 3px var(--primary-glow)'; }}
                      onBlur={e  => { e.currentTarget.style.borderColor='var(--border-bright)'; e.currentTarget.style.boxShadow='none'; }}
                    />
                    {type === 'password' && (
                      <button type="button" onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'var(--foreground-3)' }}>
                        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background:'rgba(244,63,94,0.12)', border:'1px solid rgba(244,63,94,0.3)', color:'#fb7185' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: loading ? 'var(--surface-2)' : 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: loading ? 'none' : '0 8px 25px rgba(6,182,212,0.4)' }}>
                <UserPlus size={16}/><Sparkles size={14}/>{loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="text-center text-xs mt-5" style={{ color: 'var(--foreground-3)' }}>
            {mode === 'login'
              ? <>New here?{' '}<button onClick={() => switchMode('register')} className="font-semibold transition-colors hover:text-white" style={{ color:'var(--primary)' }}>Create an account</button></>
              : <>Already have an account?{' '}<button onClick={() => switchMode('login')} className="font-semibold transition-colors hover:text-white" style={{ color:'var(--primary)' }}>Sign in</button></>}
          </p>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--foreground-3)' }}>
          Computer Engineering · Academic Year 2025–26
        </p>
      </div>
    </div>
  );
}
