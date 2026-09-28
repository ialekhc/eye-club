import { Eye, Plus, ShieldCheck, Download } from 'lucide-react';

const MOCK_PRESCRIPTIONS = [
  {
    id: 'RX-101',
    label: 'My Primary Glasses',
    date: 'Oct 10, 2026',
    doctor: 'Dr. Sarah Vision',
    od: { sph: '-2.00', cyl: '-0.50', axis: '180' },
    os: { sph: '-2.25', cyl: '-0.75', axis: '175' },
    pd: '62',
    status: 'VERIFIED'
  }
];

export default function AccountPrescriptionsPage() {
  return (
    <div className="bg-white rounded-2xl border p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">My Prescriptions</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>
      
      {MOCK_PRESCRIPTIONS.length > 0 ? (
        <div className="grid gap-6">
          {MOCK_PRESCRIPTIONS.map(rx => (
            <div key={rx.id} className="border rounded-xl p-6 relative overflow-hidden">
              {rx.status === 'VERIFIED' && (
                <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 border-b border-l border-green-200">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg text-primary">{rx.label}</h3>
                  <p className="text-sm text-muted-foreground">Added on {rx.date} • {rx.doctor}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors" title="Download PDF">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="py-2 px-4 text-xs font-medium text-muted-foreground">EYE</th>
                      <th className="py-2 px-4 text-xs font-medium text-muted-foreground text-center">SPH</th>
                      <th className="py-2 px-4 text-xs font-medium text-muted-foreground text-center">CYL</th>
                      <th className="py-2 px-4 text-xs font-medium text-muted-foreground text-center">AXIS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-sm font-bold text-primary">OD (Right)</td>
                      <td className="py-3 px-4 text-sm text-center">{rx.od.sph}</td>
                      <td className="py-3 px-4 text-sm text-center">{rx.od.cyl}</td>
                      <td className="py-3 px-4 text-sm text-center">{rx.od.axis}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-bold text-primary">OS (Left)</td>
                      <td className="py-3 px-4 text-sm text-center">{rx.os.sph}</td>
                      <td className="py-3 px-4 text-sm text-center">{rx.os.cyl}</td>
                      <td className="py-3 px-4 text-sm text-center">{rx.os.axis}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">Pupillary Distance (PD):</span>
                <span className="font-bold">{rx.pd} mm</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No prescriptions found</h3>
          <p className="text-muted-foreground mb-6">Save your prescription here for faster checkout next time.</p>
        </div>
      )}
    </div>
  );
}
