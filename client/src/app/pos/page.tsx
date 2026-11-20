import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { OpticalPosTerminal } from '@/features/pos/components/OpticalPosTerminal';

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string; storeId?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) redirect('/login');
  return (
    <OpticalPosTerminal
      initialVendorId={params.vendorId}
      initialStoreId={params.storeId}
    />
  );
}

