import Link from "next/link";
import { Search, MapPin, Heart, User, ShoppingCart, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        {/* Mobile menu & Logo */}
        <div className="flex items-center gap-4 lg:gap-8">
          <button className="lg:hidden p-2 text-foreground">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </button>
          
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
            Eye-Club<span className="text-accent">.</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <Link href="/eyeglasses" className="hover:text-primary transition-colors text-muted-foreground">Eyeglasses</Link>
            <Link href="/sunglasses" className="hover:text-primary transition-colors text-muted-foreground">Sunglasses</Link>
            <Link href="/contact-lenses" className="hover:text-primary transition-colors text-muted-foreground">Contact Lenses</Link>
            <Link href="/kids" className="hover:text-primary transition-colors text-muted-foreground">Kids</Link>
            <Link href="/eye-care" className="hover:text-primary transition-colors text-muted-foreground">Eye Care</Link>
            <Link href="/offers" className="text-accent hover:text-accent/80 transition-colors">Offers</Link>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors hidden sm:block">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </button>
          <Link href="/stores" className="p-2 text-muted-foreground hover:text-primary transition-colors hidden lg:block">
            <MapPin className="h-5 w-5" />
            <span className="sr-only">Store Locator</span>
          </Link>
          <Link href="/wishlist" className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Wishlist</span>
          </Link>
          <Link href="/account" className="p-2 text-muted-foreground hover:text-primary transition-colors hidden lg:block">
            <User className="h-5 w-5" />
            <span className="sr-only">Account</span>
          </Link>
          <Link href="/cart" className="p-2 text-muted-foreground hover:text-primary transition-colors relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              0
            </span>
            <span className="sr-only">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
