import Link from 'next/link';
import { ArrowRight, Camera, Eye, Glasses, MapPin, ShoppingBag, Sparkles } from 'lucide-react';
import { Badge, Card, CardContent } from '@eyewear/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Clean Untitled UI Hero */}
      <section className="border-b border-[#EAECF0] bg-white">
        <div className="container mx-auto max-w-5xl px-4 py-16 text-center lg:px-8 lg:py-24 space-y-6">
          <Badge variant="default" className="px-3 py-1">
            <Sparkles className="w-3.5 h-3.5" /> Simple Virtual Try-On &amp; Optical Store
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-[#101828] sm:text-5xl lg:text-6xl leading-[1.12]">
            Find glasses that{' '}
            <span className="text-teal-700">fit your face.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-[#475467] sm:text-lg leading-relaxed">
            Browse our frames, try them on live using your camera or a photo, and order online or pick them up at your nearest optical centre.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/try-on"
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-7 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Try Frames on Camera
            </Link>

            <Link
              href="/eyeglasses"
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-7 text-sm font-semibold text-[#344054] shadow-xs hover:bg-[#F9FAFB] transition-colors"
            >
              Browse Eyeglasses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-[#667085] pt-2">
            Optical store staff?{' '}
            <Link href="/login" className="font-semibold text-teal-700 hover:underline">
              Sign in here
            </Link>{' '}
            to open{' '}
            <Link href="/workstation" className="font-semibold text-[#344054] hover:underline">
              Workstation
            </Link>{' '}
            or{' '}
            <Link href="/pos" className="font-semibold text-[#344054] hover:underline">
              POS
            </Link>
            .
          </p>
        </div>
      </section>

      {/* How It Works — 3 Easy Steps */}
      <section className="container mx-auto max-w-5xl px-4 py-14 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl">How it works</h2>
          <p className="mt-1.5 text-sm text-[#475467]">Three simple steps to get your next pair.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              step: 'Step 1',
              title: 'Pick a frame',
              desc: 'Choose from eyeglasses or sunglasses by shape, color, and price.',
              icon: Glasses,
              href: '/eyeglasses',
              action: 'See frames',
            },
            {
              step: 'Step 2',
              title: 'Try it on',
              desc: 'Turn on your camera or upload a selfie to see how the frame sits on your face.',
              icon: Camera,
              href: '/try-on',
              action: 'Open try-on',
            },
            {
              step: 'Step 3',
              title: 'Order or visit store',
              desc: 'Add your prescription lenses and check out online or visit a nearby store.',
              icon: ShoppingBag,
              href: '/stores',
              action: 'Find a store',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.step} href={item.href} className="group block">
                <Card className="h-full transition-all group-hover:border-teal-300 group-hover:shadow-sm">
                  <CardContent className="p-6 flex h-full flex-col justify-between">
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#EAECF0] bg-[#F9FAFB] text-teal-700">
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary">{item.step}</Badge>
                      </div>
                      <h3 className="text-base font-semibold text-[#101828] mb-1.5">{item.title}</h3>
                      <p className="text-sm text-[#475467] leading-relaxed">{item.desc}</p>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 group-hover:gap-2 transition-all">
                      {item.action} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Shortcuts */}
      <section className="container mx-auto max-w-5xl px-4 pb-16 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { title: 'Eyeglasses', sub: 'Daily & prescription', href: '/eyeglasses', icon: Glasses },
            { title: 'Sunglasses', sub: 'UV400 & polarized', href: '/sunglasses', icon: Sparkles },
            { title: 'Book Eye Exam', sub: '12-step vision check', href: '/book-exam', icon: Eye },
            { title: 'Store Locator', sub: 'Visit us in person', href: '/stores', icon: MapPin },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} className="block group">
                <Card className="transition-colors group-hover:border-[#D0D5DD] group-hover:bg-[#F9FAFB]">
                  <CardContent className="p-5">
                    <Icon className="w-5 h-5 text-teal-700 mb-3" />
                    <h3 className="font-semibold text-[#101828] text-sm">{card.title}</h3>
                    <p className="text-xs text-[#667085] mt-0.5">{card.sub}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
