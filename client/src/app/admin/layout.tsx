import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminShell } from '@/components/AdminShell';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) redirect('/login');
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) redirect('/pos');
  return <AdminShell>{children}</AdminShell>;
}
