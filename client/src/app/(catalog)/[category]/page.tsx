import { fetchProducts, fetchBrands } from "@/lib/api";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { ProductFilters } from "@/features/catalog/components/ProductFilters";
import { notFound } from "next/navigation";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function CategoryPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { category } = await params;
  const currentSearchParams = await searchParams;
  
  // Validate category (only allowing known categories for now)
  const validCategories = ["eyeglasses", "sunglasses", "contact-lenses", "kids"];
  if (!validCategories.includes(category)) {
    notFound();
  }

  // Fetch products and brands
  const [products, brands] = await Promise.all([
    fetchProducts({ ...currentSearchParams, category }),
    fetchBrands()
  ]);

  // Extract unique frame shapes for filters from products
  const frameShapes = Array.from(new Set(products.map((p: any) => p.frameShape).filter(Boolean))) as string[];

  const formatCategoryName = (cat: string) => {
    return cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
        <a href="/" className="hover:text-primary">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">{formatCategoryName(category)}</span>
      </div>

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">{formatCategoryName(category)}</h1>
          <p className="text-muted-foreground text-sm">Showing {products.length} products</p>
        </div>
        
        {/* Sort Dropdown placeholder */}
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort by:</span>
          <select className="border-none bg-transparent font-medium text-foreground focus:ring-0 cursor-pointer">
            <option>Popular</option>
            <option>Newest</option>
            <option>Price Low to High</option>
            <option>Price High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <ProductFilters brands={brands} frameShapes={frameShapes} />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-2xl border border-dashed">
              <h3 className="text-lg font-medium text-primary mb-2">No products found</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                We couldn't find any products matching your current filters. Try removing some filters or check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
