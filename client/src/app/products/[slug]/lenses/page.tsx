import { fetchProductBySlug, fetchLensTypes } from "@/lib/api";
import { notFound } from "next/navigation";
import { LensWizard } from "@/features/lenses/components/LensWizard";

export default async function LensesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const [product, lensTypes] = await Promise.all([
    fetchProductBySlug(slug),
    fetchLensTypes()
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-8">Configure Your Lenses</h1>
      <LensWizard product={product} lensTypes={lensTypes} />
    </div>
  );
}
