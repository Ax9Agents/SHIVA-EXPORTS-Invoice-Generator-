'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FileSpreadsheet, FileText, Search, Trash2, AlertTriangle, FileArchive } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import type { User } from '@supabase/supabase-js';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  consignee_name: string;
  buyer_name: string;
  total_pcs: number;
  total_kgs: number;
  total_amount: number;
  shipping_cost?: number;
  currency: string;
  invoice_type: 'IGST' | 'LUT';
  excel_link?: string;
  pdf_link?: string;
  documents_zip_link?: string; // ✅ ADD THIS
  created_at: string;
}

export default function LogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, searchQuery]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session.user);
    }
  };

  const fetchInvoices = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/logs?userId=${user.id}&page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`
      );
      const result = await response.json();

      if (result.success) {
        setInvoices(result.data);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const openDeleteModal = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/logs/${invoiceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user!.id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Invoice deleted successfully');
        setDeleteModalOpen(false);
        setInvoiceToDelete(null);
        fetchInvoices();
      } else {
        throw new Error(result.error || 'Failed to delete');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
            <p className="text-gray-600 mt-2">View and manage all your generated invoices</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by invoice number or consignee name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Invoices List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No invoices found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchQuery ? 'Try a different search query' : 'Create your first invoice to see it here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {invoice.invoice_number}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          invoice.invoice_type === 'LUT' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {invoice.invoice_type}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {invoice.currency}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                          <p className="text-gray-500">Consignee</p>
                          <p className="font-medium text-gray-900">{invoice.consignee_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">{invoice.invoice_date}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Quantity</p>
                          <p className="font-medium text-gray-900">
                            {invoice.total_pcs} Pcs / {invoice.total_kgs.toFixed(2)} Kgs
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Amount</p>
                          <p className="font-bold text-green-600 text-lg">
                            {invoice.currency} {invoice.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ✅ DOWNLOAD BUTTONS - INCLUDING ZIP */}
                    <div className="flex items-center gap-2 ml-6">
                      {invoice.excel_link && (
                        <a
                          href={invoice.excel_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                          title="Download Excel"
                        >
                          <FileSpreadsheet className="w-5 h-5" />
                        </a>
                      )}
                      {invoice.pdf_link && (
                        <a
                          href={invoice.pdf_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                          title="Download PDF"
                        >
                          <FileText className="w-5 h-5" />
                        </a>
                      )}
                      {/* ✅ ZIP BUTTON */}
                      {invoice.documents_zip_link && (
                        <a
                          href={invoice.documents_zip_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all"
                          title="Download ZIP (All Documents)"
                        >
                          <FileArchive className="w-5 h-5" />
                        </a>
                      )}
                      <button
                        onClick={() => openDeleteModal(invoice)}
                        className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && invoiceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 rounded-t-xl flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-900">Delete Invoice</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete invoice <strong>{invoiceToDelete.invoice_number}</strong>?
              </p>
              <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <strong>Warning:</strong> This action cannot be undone. The invoice record and all associated data will be permanently deleted.
              </p>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-xl bg-gray-50">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setInvoiceToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
