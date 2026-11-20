'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@eye-club.local');
  const [password, setPassword] = useState('password123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email: loginEmail,
      password: loginPassword,
    });

    if (res?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      const role = await fetch('/api/auth/session')
        .then((response) => response.json())
        .then((session) => session.user?.role);
      router.push(
        ['SUPER_ADMIN', 'ADMIN'].includes(role)
          ? '/admin'
          : ['CUSTOMER'].includes(role)
            ? '/account'
            : '/pos',
      );
      router.refresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-gradient-to-b from-[#0b8a7a] to-[#086357] py-12 px-4 relative">
      {/* Top-right Skip pill button matching design */}
      <Link
        href="/"
        className="skip-link absolute top-6 right-6"
      >
        Skip <ArrowRight className="w-4 h-4 stroke-[2.5]" />
      </Link>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1 text-slate-900">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your Eye-Club account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-3 outline-none focus:border-primary" 
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-3 outline-none focus:border-primary" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
            One-Click Demo Sign In
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Super Admin', email: 'admin@eye-club.local', badge: 'Admin + POS' },
              { label: 'POS Cashier', email: 'cashier@eye-club.local', badge: 'POS Terminal' },
              { label: 'Optometrist', email: 'optometrist@eye-club.local', badge: 'Rx + POS' },
              { label: 'Customer', email: 'customer@eye-club.local', badge: 'Storefront' },
            ].map((demo) => (
              <button
                key={demo.email}
                type="button"
                disabled={loading}
                onClick={() => {
                  setEmail(demo.email);
                  setPassword('password123456');
                  void performLogin(demo.email, 'password123456');
                }}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{demo.label}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {demo.badge}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{demo.email}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Password for all accounts: <code className="font-mono text-slate-600">password123456</code>
          </p>
        </div>
        
        <Link href="/reset-password" className="mt-4 block text-center text-sm underline">Forgot password?</Link>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account? <Link href="/register" className="text-primary font-medium hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
