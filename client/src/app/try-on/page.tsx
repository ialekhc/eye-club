import { TryOnStudio } from '@/features/try-on/components/try-on-studio';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
export default async function TryOnPage({ searchParams }: { searchParams: Promise<Record<string,string | undefined>> }) {
  const query = await searchParams;
  if (query.manageProduct) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken || !['SUPER_ADMIN','ADMIN'].includes(session.user.role)) redirect('/login');
  }
  if (query.widget) {
    const origin = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    let config;
    try {
      const referrer = (await headers()).get('referer');
      if (referrer && new URL(referrer).origin !== query.parentOrigin) throw new Error('Origin mismatch');
      const response = await fetch(`${origin}/api/v1/widget/config/${encodeURIComponent(query.widget)}?origin=${encodeURIComponent(query.parentOrigin ?? '')}`,{cache:'no-store'});
      if(!response.ok) throw new Error('Widget unavailable');
      config = await response.json();
    } catch { return <main className="p-8"><h1>Widget unavailable</h1><p>This merchant origin is not enabled for virtual try-on.</p></main>; }
    if (query.organization !== config.organizationSlug) {
      const params = new URLSearchParams(Object.entries(query).filter((entry):entry is [string,string] => typeof entry[1] === 'string'));
      params.set('organization',config.organizationSlug);
      redirect(`/try-on?${params}`);
    }
  }
  return <TryOnStudio />;
}
