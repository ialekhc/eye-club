import Link from 'next/link';
import { ArrowRight, Camera, Eye, Glasses, MapPin, ShoppingBag, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Clean, Simple Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 lg:px-8 py-14 lg:py-20 max-w-5xl text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-semibold text-teal-800">
            <Sparkles className="w-3.5 h-3.5" /> Simple Virtual Try-On &amp; Optical Store
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Find glasses that{' '}
            <span className="text-teal-700">fit your face.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Browse our frames, try them on live using your camera or a photo, and order online or pick them up at your nearest optical centre.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/try-on"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 px-8 py-4 text-base font-bold text-white shadow-sm transition-colors"
            >
              <Camera className="w-5 h-5" />
              Try Frames on Camera
            </Link>

            <Link
              href="/eyeglasses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 px-8 py-4 text-base font-bold text-slate-900 transition-colors"
            >
              Browse Eyeglasses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            Optical store staff?{' '}
            <Link href="/login" className="font-semibold text-teal-700 underline">
              Sign in here
            </Link>{' '}
            to open{' '}
            <Link href="/workstation" className="font-semibold text-slate-700 underline">
              Workstation
            </Link>{' '}
            or{' '}
            <Link href="/pos" className="font-semibold text-slate-700 underline">
              POS
            </Link>
            .
          </p>
        </div>
      </section>

      {/* How It Works — 3 Easy Steps */}
      <section className="container mx-auto px-4 lg:px-8 py-14 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How it works</h2>
          <p className="text-sm text-slate-600 mt-1">Three simple steps to get your next pair.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Pick a frame',
              desc: 'Choose from eyeglasses or sunglasses by shape, color, and price.',
              icon: Glasses,
              href: '/eyeglasses',
              action: 'See frames',
            },
            {
              step: '2',
              title: 'Try it on',
              desc: 'Turn on your camera or upload a selfie to see how the frame sits on your face.',
              icon: Camera,
              href: '/try-on',
              action: 'Open try-on',
            },
            {
              step: '3',
              title: 'Order or visit store',
              desc: 'Add your prescription lenses and check out online or visit a nearby store.',
              icon: ShoppingBag,
              href: '/stores',
              action: 'Find a store',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.step}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">STEP {item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-teal-700 group-hover:gap-2 transition-all">
                  {item.action} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Shortcuts */}
      <section className="container mx-auto px-4 lg:px-8 pb-16 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Eyeglasses', sub: 'Daily & prescription', href: '/eyeglasses', icon: Glasses },
            { title: 'Sunglasses', sub: 'UV400 & polarized', href: '/sunglasses', icon: Sparkles },
            { title: 'Book Eye Exam', sub: '12-step vision check', href: '/book-exam', icon: Eye },
            { title: 'Store Locator', sub: 'Visit us in person', href: '/stores', icon: MapPin },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <Icon className="w-5 h-5 text-teal-700 mb-3" />
                <h3 className="font-bold text-slate-900 text-sm">{card.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
