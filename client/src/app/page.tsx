import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, RefreshCw, CreditCard } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex items-center bg-muted justify-center lg:justify-start pt-20">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=2000"
            alt="Premium Eyewear Collection"
            fill
            className="object-cover object-center opacity-90 scale-105 animate-[float_10s_ease-in-out_infinite]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent lg:w-2/3" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 lg:px-12 pt-12 animate-slide-up">
          <div className="max-w-2xl glass p-10 md:p-14 rounded-3xl shadow-2xl border-white/60">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-sm font-bold tracking-wider uppercase mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              New Collection 2026
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary mb-6 leading-[1.1]">
              See Better. <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Look Better.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
              Eyewear engineered for perfect vision and effortless style. Experience the pinnacle of optical craftsmanship.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Link 
                href="/eyeglasses" 
                className="group flex items-center justify-between px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all"
              >
                Explore Collection
                <ArrowRight className="w-5 h-5 ml-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/try-on" 
                className="flex items-center justify-center px-8 py-4 rounded-2xl glass-dark text-white font-semibold hover:-translate-y-1 transition-all"
              >
                Virtual Try-On
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-32 container mx-auto px-4 lg:px-12 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-extrabold text-primary tracking-tight mb-4">Curated Selections</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover frames tailored for every facet of your life.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: "Eyeglasses", href: "/eyeglasses", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600" },
            { title: "Sunglasses", href: "/sunglasses", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600" },
            { title: "Contact Lenses", href: "/contact-lenses", image: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&q=80&w=600" },
            { title: "Computer Glasses", href: "/kids", image: "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?auto=format&fit=crop&q=80&w=600" },
          ].map((cat, idx) => (
            <Link 
              key={cat.title} 
              href={cat.href} 
              className="group relative block aspect-[4/5] rounded-3xl overflow-hidden card-hover shadow-xl"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <Image src={cat.image} alt={cat.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-white mb-2">{cat.title}</h3>
                <span className="text-white/80 font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Eye Examination */}
      <section className="py-24 my-10 bg-primary text-primary-foreground relative overflow-hidden rounded-3xl mx-4 lg:mx-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="w-[800px] h-[800px] bg-secondary rounded-full blur-[100px] absolute -right-40 -top-40" />
        </div>
        
        <div className="container relative z-10 mx-auto px-8 lg:px-16 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
            <Image 
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1000" 
              alt="Eye Examination" 
              fill 
              className="object-cover"
            />
          </div>
          <div className="max-w-lg">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">Expert Vision Care</h2>
            <p className="text-primary-foreground/80 mb-10 text-xl leading-relaxed">
              Experience a comprehensive 12-step eye examination with our certified optometrists using state-of-the-art precision equipment.
            </p>
            <Link 
              href="/book-exam" 
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-accent text-accent-foreground font-bold hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Markers */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: "Precision Crafted", desc: "Every lens is custom-cut with microscopic accuracy for your unique prescription.", icon: ShieldCheck },
              { title: "14-Day Guarantee", desc: "Not perfectly satisfied? Return or exchange them within 14 days, no questions asked.", icon: RefreshCw },
              { title: "Secure Checkout", desc: "Your data is encrypted using military-grade standards. Shop with total peace of mind.", icon: CreditCard },
            ].map((feature) => (
              <div key={feature.title} className="glass p-10 rounded-3xl text-center card-hover">
                <div className="w-16 h-16 mx-auto bg-primary/5 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-2xl mb-4 text-primary">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
