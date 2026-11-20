import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) redirect('/login');
  
  return <AccountShell>{children}</AccountShell>;
}
