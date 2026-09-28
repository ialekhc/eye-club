'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function BookExamPage() {
  const [step, setStep] = useState(1);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const times = ['10:00 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

  if (step === 3) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Appointment Confirmed!</h1>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          Your comprehensive eye exam is scheduled for {selectedDate} at {selectedTime} at Eye-Club Flagship Store.
        </p>
        <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-16 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Book an Eye Exam</h1>
        <p className="text-muted-foreground">Comprehensive checkup by certified optometrists.</p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-10">
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-10">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>1</div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>2</div>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Select a Store
            </h2>
            
            <div className="grid gap-4 mb-8">
              {[
                { id: 1, name: 'Eye-Club Flagship Store', address: 'Durbar Marg, Kathmandu' },
                { id: 2, name: 'Eye-Club Lalitpur', address: 'Jhamsikhel, Lalitpur' }
              ].map(store => (
                <div 
                  key={store.id} 
                  onClick={() => setSelectedStore(store.id)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedStore === store.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                >
                  <h3 className="font-bold text-lg">{store.name}</h3>
                  <p className="text-sm text-muted-foreground">{store.address}</p>
                </div>
              ))}
            </div>

            <button 
              disabled={!selectedStore}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Date & Time
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Select Date
                </h2>
                <input 
                  type="date" 
                  className="w-full border rounded-xl p-4 font-medium" 
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Select Time
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {times.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 border rounded-xl text-sm font-medium transition-colors ${selectedTime === time ? 'bg-primary text-white border-primary' : 'bg-white hover:border-primary/50'}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4 mt-8">Your Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <input type="text" placeholder="First Name" className="col-span-2 sm:col-span-1 border rounded-xl p-3" />
              <input type="text" placeholder="Last Name" className="col-span-2 sm:col-span-1 border rounded-xl p-3" />
              <input type="email" placeholder="Email Address" className="col-span-2 sm:col-span-1 border rounded-xl p-3" />
              <input type="tel" placeholder="Phone Number" className="col-span-2 sm:col-span-1 border rounded-xl p-3" />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="px-6 py-4 border border-input bg-background font-medium rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Back
              </button>
              <button 
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Appointment
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
