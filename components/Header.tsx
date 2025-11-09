'use client';

export default function Header() {
  return (
    <header className="lg:ml-72 bg-white shadow-sm sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-600">Manage your invoices efficiently</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              ✓ Connected
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
