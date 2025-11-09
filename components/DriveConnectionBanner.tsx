'use client';

import { Database } from 'lucide-react';

export default function DriveConnectionBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Database className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">
            Cloud Storage Connected
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            All invoices are automatically saved to secure cloud storage
          </p>
        </div>
      </div>
    </div>
  );
}
