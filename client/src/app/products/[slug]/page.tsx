import { fetchProductBySlug } from "@/lib/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ChevronRight, ShieldCheck, Undo2, Truck } from "lucide-react";

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Simplified view: Assuming default variant is selected initially
  const defaultVariant = product.variants[0];
  const images = defaultVariant?.images || [];
  
  const price = defaultVariant?.price ? defaultVariant.price : parseFloat(product.basePrice);
  const formattedPrice = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(price);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <div className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        {product.category && (
          <>
            <Link href={`/${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Gallery */}
        <div className="w-full lg:w-3/5 flex flex-col gap-4">
          <div className="relative aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden bg-muted border">
            {images[0] ? (
              <Image src={images[0].url} alt={images[0].altText || product.name} fill className="object-cover object-center" priority />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No image available</div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {images.slice(1, 5).map((img: any, i: number) => (
              <button key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted border hover:border-primary transition-colors">
                <Image src={img.url} alt={img.altText || ""} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full lg:w-2/5 flex flex-col">
          {product.brand && (
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              {product.brand.name}
            </div>
          )}
          <h1 className="text-3xl font-bold text-primary mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1 text-accent">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current opacity-50" />
            </div>
            <span className="text-sm text-muted-foreground underline cursor-pointer">82 Reviews</span>
          </div>

          <div className="text-2xl font-bold text-foreground mb-8">
            {formattedPrice}
          </div>

          {/* Variants / Colors */}
          {product.variants.length > 0 && (
            <div className="mb-8">
              <div className="text-sm font-medium mb-3 flex justify-between">
                <span>Color: <span className="font-bold text-foreground">{defaultVariant.color}</span></span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v: any) => (
                  <button 
                    key={v.id} 
                    className={`w-12 h-12 rounded-full border-2 p-1 transition-colors ${v.id === defaultVariant.id ? 'border-primary' : 'border-transparent hover:border-border'}`}
                    title={v.color}
                  >
                    <div className="w-full h-full rounded-full bg-muted overflow-hidden relative border border-border/50">
                      {v.images[0] && <Image src={v.images[0].url} alt={v.color} fill className="object-cover" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Frame Size */}
          <div className="mb-8 border-t pt-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">Size</span>
              <button className="text-xs text-primary underline">Size Guide</button>
            </div>
            <div className="flex gap-3">
              {['Small', 'Medium', 'Large'].map((size) => (
                <button 
                  key={size}
                  className={`flex-1 py-3 border rounded-xl text-sm font-medium transition-colors ${size === defaultVariant.size ? 'bg-primary border-primary text-primary-foreground' : 'bg-background hover:border-primary text-foreground'}`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {product.frameWidth}mm (Frame width) • {product.lensWidth}mm (Lens width)
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mb-8">
            {product.prescriptionCompatible ? (
              <Link 
                href={`/products/${product.slug}/lenses`} 
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium text-center hover:bg-primary/90 transition-colors"
              >
                SELECT LENSES
              </Link>
            ) : (
              <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
                Add to Cart
              </button>
            )}
            
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-background border border-border text-foreground rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-muted transition-colors">
                <Heart className="w-4 h-4" /> Wishlist
              </button>
              <Link href={`/try-on?frame=${product.id}`} className="flex-1 py-3 bg-background border border-border text-foreground rounded-xl font-medium flex justify-center items-center hover:bg-muted transition-colors">
                Try On
              </Link>
            </div>
          </div>

          {/* Perks */}
          <div className="flex flex-col gap-4 p-5 bg-muted/50 rounded-xl mb-8">
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>1 Year warranty on frames & lenses</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Undo2 className="w-5 h-5 text-primary" />
              <span>14-day hassle free returns</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-5 h-5 text-primary" />
              <span>Free delivery across Nepal</span>
            </div>
          </div>

          {/* Description */}
          <div className="border-t pt-8">
            <h3 className="font-bold text-lg mb-4">Product Details</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {product.description || "Premium eyewear designed for maximum comfort and style. Crafted with precision for a perfect fit."}
            </p>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Frame Shape</span>
                <span className="font-medium">{product.frameShape}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Frame Type</span>
                <span className="font-medium">{product.frameType}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Material</span>
                <span className="font-medium">{product.material || "Premium Acetate"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium">{product.gender}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
