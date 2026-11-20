import type { ProductDetail } from '@/features/commerce/ProductDetails';
const API_BASE_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchProducts(params: Record<string, string> = {}): Promise<ProductDetail[]> {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/api/v1/catalog/products${query ? `?${query}` : ''}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  } catch {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") throw new Error("Catalogue service unavailable. Please try again shortly.");
    console.warn("Demo mode: sample product data.");
    return [
      {
        id: "atelier-01",
        name: "Ray-Ban Aviator Classic",
        slug: "ray-ban-aviator-classic",
        category: { name: "Sunglasses", slug: "sunglasses" },
        brand: { name: "Ray-Ban" },
        basePrice: "15500",
        frameShape: "Aviator",
        variants: [
          {
            id: "var-1", color: "Gold / Green", size: "Large",
            images: [
              { url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800", altText: "Front view" }
            ]
          }
        ]
      },
      {
        id: "atelier-02",
        name: "Eye-Club Air 02",
        slug: "eye-club-air-02",
        category: { name: "Eyeglasses", slug: "eyeglasses" },
        brand: { name: "Eye-Club Air" },
        basePrice: "2799",
        frameShape: "Rectangle",
        prescriptionCompatible: true,
        variants: [
          {
            id: "var-2", color: "Matte Black", size: "Medium",
            images: [
              { url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800", altText: "Front view" },
              { url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800", altText: "Side view" }
            ]
          }
        ]
      },
      {
        id: "prod-3",
        name: "Vintage Round",
        slug: "vintage-round",
        category: { name: "Eyeglasses", slug: "eyeglasses" },
        brand: { name: "RetroSpecs" },
        basePrice: "4200",
        frameShape: "Round",
        prescriptionCompatible: true,
        variants: [
          {
            id: "var-3", color: "Tortoise", size: "Small",
            images: [
              { url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800", altText: "Front view" }
            ]
          }
        ]
      }
    ];
  }
}

export async function fetchProductBySlug(slug: string) {
  const url = `${API_BASE_URL}/api/v1/catalog/products/${slug}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch product');
    }
    return res.json();
  } catch (error) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") throw error;
    const allProducts = await fetchProducts();
    return allProducts.find(p => p.slug === slug) || null;
  }
}

export async function fetchCategories() {
  const url = `${API_BASE_URL}/api/v1/catalog/categories`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  } catch (error) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") throw error;
    return [
      { id: "cat-1", name: "Eyeglasses", slug: "eyeglasses" },
      { id: "cat-2", name: "Sunglasses", slug: "sunglasses" },
      { id: "cat-3", name: "Contact Lenses", slug: "contact-lenses" },
      { id: "cat-4", name: "Kids", slug: "kids" }
    ];
  }
}

export async function fetchBrands() {
  const url = `${API_BASE_URL}/api/v1/catalog/brands`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch brands');
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function fetchLensTypes() {
  const url = `${API_BASE_URL}/api/v1/lenses/types`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch lens types');
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}
