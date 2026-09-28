export default function AccountProfilePage() {
  return (
    <div className="bg-white rounded-2xl border p-6 md:p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
      
      <form className="max-w-xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input type="text" className="w-full border rounded-lg p-3" defaultValue="John" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input type="text" className="w-full border rounded-lg p-3" defaultValue="Doe" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input type="email" className="w-full border rounded-lg p-3 bg-muted text-muted-foreground" defaultValue="john@example.com" disabled />
          <p className="text-xs text-muted-foreground mt-1">To change your email, please contact support.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input type="tel" className="w-full border rounded-lg p-3" defaultValue="+977-9800000000" />
        </div>
        
        <div className="pt-4">
          <button type="button" className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
