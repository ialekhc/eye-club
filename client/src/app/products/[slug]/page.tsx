import { fetchProductBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import { ProductDetails } from '@/features/commerce/ProductDetails';
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();
  return <ProductDetails product={product} />;
}
