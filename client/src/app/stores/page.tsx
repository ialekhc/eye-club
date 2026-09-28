import { MapPin, Phone, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function StoresPage() {
  const stores = [
    {
      id: 1,
      name: 'Eye-Club Flagship Store',
      address: 'Durbar Marg, Kathmandu, Nepal',
      phone: '+977-1-4200000',
      hours: 'Sun - Fri: 10:00 AM - 7:00 PM',
      services: ['Comprehensive Eye Exam', 'Contact Lens Fitting', 'Frame Adjustment'],
      status: 'Open Now'
    },
    {
      id: 2,
      name: 'Eye-Club Lalitpur',
      address: 'Jhamsikhel, Lalitpur, Nepal',
      phone: '+977-1-5500000',
      hours: 'Sun - Fri: 10:30 AM - 7:30 PM',
      services: ['Comprehensive Eye Exam', 'Pediatric Optometry'],
      status: 'Open Now'
    },
    {
      id: 3,
      name: 'Eye-Club Pokhara',
      address: 'Lakeside, Pokhara, Nepal',
      phone: '+977-61-460000',
      hours: 'Sun - Sat: 9:00 AM - 8:00 PM',
      services: ['Comprehensive Eye Exam', 'Sunglasses Specialist'],
      status: 'Closed'
    }
  ];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Find a Store Near You</h1>
        <p className="text-lg text-muted-foreground">
          Experience our premium collection in person. Get a comprehensive eye exam from our expert optometrists.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          {stores.map(store => (
            <div key={store.id} className="p-6 border rounded-2xl bg-white shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-primary">{store.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${store.status === 'Open Now' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {store.status}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{store.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{store.hours}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Services Available</div>
                <div className="flex flex-wrap gap-2">
                  {store.services.map((service, idx) => (
                    <span key={idx} className="bg-muted px-2 py-1 rounded-md text-xs">{service}</span>
                  ))}
                </div>
              </div>

              <Link href="/book-exam" className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors">
                <Calendar className="w-4 h-4" /> Book Eye Exam
              </Link>
            </div>
          ))}
        </div>
        
        <div className="w-full lg:w-2/3 min-h-[500px] bg-slate-100 rounded-2xl border flex flex-col items-center justify-center text-slate-400">
          <MapPin className="w-12 h-12 mb-4 opacity-50" />
          <p>Interactive Map Component</p>
          <p className="text-sm">(Integration with Google Maps or Mapbox)</p>
        </div>
      </div>
    </div>
  );
}
