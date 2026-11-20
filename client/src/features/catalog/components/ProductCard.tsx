import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

import type { ProductDetail } from '@/features/commerce/ProductDetails';
type ProductCardProps = { product: ProductDetail };

export function ProductCard({ product }: ProductCardProps) {
  const defaultVariant = product.variants[0];
  const primaryImage = defaultVariant?.images?.find(i => i.isPrimary)?.url || defaultVariant?.images?.[0]?.url;
  const secondaryImage = defaultVariant?.images?.find(i => !i.isPrimary)?.url;
  
  // Format price
  const price = defaultVariant?.price ? defaultVariant.price : parseFloat(product.basePrice);
  const formattedPrice = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(Number(price));

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl bg-white border p-3 hover:shadow-md transition-shadow">
      {/* Wishlist Button */}
      <Link href={`/products/${product.slug}`} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-muted-foreground hover:text-red-500 shadow-sm transition-colors">
        <Heart className="h-4 w-4" />
        <span className="sr-only">Add to wishlist</span>
      </Link>

      {/* Image Gallery */}
      <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {primaryImage ? (
          <>
            <Image 
              src={primaryImage} 
              alt={product.name} 
              fill 
              className={`object-cover transition-opacity duration-300 ${secondaryImage ? "group-hover:opacity-0" : ""}`} 
            />
            {secondaryImage && (
              <Image 
                src={secondaryImage} 
                alt={`${product.name} alternate`} 
                fill 
                className="object-cover absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No Image</div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col gap-1 px-1 pb-1">
        {product.brand && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {product.brand.name}
          </span>
        )}
        <Link href={`/products/${product.slug}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </Link>
        <div className="text-xs text-muted-foreground">
          {product.frameShape} • {product.frameType}
        </div>
        
        {/* Colors / Rating placeholder */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-sm text-foreground">{formattedPrice}</span>
          {product.variants.length > 1 && (
            <span className="text-xs text-muted-foreground">{product.variants.length} colors</span>
          )}
        </div>
      </div>
    </div>
  );
}
