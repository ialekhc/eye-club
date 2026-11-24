'use client';

import Link from 'next/link';
import { ArrowRight, Eye } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, CardContent, Input, Label, Separator } from '@eyewear/ui';

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
    <div className="min-h-[80vh] flex items-center justify-center bg-[#F9FAFB] py-12 px-4 relative">
      <Link href="/" className="skip-link absolute top-6 right-6">
        Skip <ArrowRight className="w-4 h-4 stroke-[2.5]" />
      </Link>

      <Card className="max-w-md w-full shadow-sm">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#101828]">Log in to your account</h1>
            <p className="text-sm text-[#475467]">Welcome back! Please enter your details.</p>
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
              One-Click Demo Sign In
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Super Admin', email: 'admin@eye-club.local', badge: 'Admin' },
                { label: 'POS Cashier', email: 'cashier@eye-club.local', badge: 'POS' },
                { label: 'Optometrist', email: 'optometrist@eye-club.local', badge: 'Rx + POS' },
                { label: 'Customer', email: 'customer@eye-club.local', badge: 'Store' },
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
                  className="text-left p-2.5 rounded-xl border border-[#EAECF0] bg-white hover:border-teal-600 hover:bg-teal-50/40 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-[#101828]">{demo.label}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {demo.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-[#667085] truncate mt-0.5">{demo.email}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#667085] text-center">
              Password for all accounts: <code className="font-mono text-[#344054]">password123456</code>
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-[#475467] pt-1">
            <Link href="/reset-password" className="font-medium hover:text-[#101828] underline">
              Forgot password?
            </Link>
            <span>
              No account?{' '}
              <Link href="/register" className="font-semibold text-teal-700 hover:underline">
                Sign up
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
