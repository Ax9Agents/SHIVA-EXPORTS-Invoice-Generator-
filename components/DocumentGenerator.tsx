'use client';

import { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Download, Sparkles, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Item {
  description: string;
  hsnCode: string;
  qtyKgs: number;
  pcs: number;
  rateUSD: number;
  batchNumber?: string;
  mfgDate?: string;
  expDate?: string;
  botanicalName?: string;
  boxNumber?: number;
}

export default function DocumentGenerator() {
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<Item>({
    description: '',
    hsnCode: '',
    qtyKgs: 0,
    pcs: 0,
    rateUSD: 0,
    batchNumber: '',
    mfgDate: '',
    expDate: '',
    botanicalName: '',
    boxNumber: undefined,
  });

  const [docSettings, setDocSettings] = useState({
    coa: false,
    msds: false,
    sds: false,
    ifra: false,
  });

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('/api/extract-excel', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract data');
      }

      if (result.success && result.data) {
        const extracted = result.data;
        
        if (extracted.items && extracted.items.length > 0) {
          setItems(extracted.items.map((item: any) => ({
            description: item.description || '',
            hsnCode: item.hsnCode || '',
            qtyKgs: item.qtyKgs || 0,
            pcs: item.pcs || 0,
            rateUSD: item.rateUSD || 0,
            batchNumber: item.batchNumber || '',
            mfgDate: item.mfgDate || '',
            expDate: item.expDate || '',
            botanicalName: item.botanicalName || '',
            boxNumber: item.boxNumber,
          })));
          
          toast.success(`✅ Extracted ${extracted.items.length} items successfully!`);
        } else {
          toast.error('No items found in Excel file');
        }
      }
    } catch (error) {
      const err = error as Error;
      console.error('❌ Extraction error:', err);
      toast.error(err.message || 'Failed to extract data from Excel');
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  };

  const handleTextExtraction = async () => {
    if (!textInput || textInput.trim().length === 0) {
      toast.error('Please enter some text to extract');
      return;
    }

    setExtractingText(true);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract data from text');
      }

      if (result.success && result.data) {
        const extracted = result.data;
        
        if (extracted.items && extracted.items.length > 0) {
          setItems(extracted.items.map((item: any) => ({
            description: item.description || '',
            hsnCode: item.hsnCode || '',
            qtyKgs: item.qtyKgs || 0,
            pcs: item.pcs || 0,
            rateUSD: item.rateUSD || 0,
            batchNumber: item.batchNumber || '',
            mfgDate: item.mfgDate || '',
            expDate: item.expDate || '',
            botanicalName: item.botanicalName || '',
            boxNumber: item.boxNumber,
          })));
          
          toast.success(`✅ Extracted ${extracted.items.length} items from text successfully!`);
          setTextInput('');
        } else {
          toast.error('No items found in text');
        }
      }
    } catch (error) {
      const err = error as Error;
      console.error('❌ Text extraction error:', err);
      toast.error(err.message || 'Failed to extract data from text');
    } finally {
      setExtractingText(false);
    }
  };

  const openAddItemModal = () => {
    setNewItem({
      description: '',
      hsnCode: '',
      qtyKgs: 0,
      pcs: 0,
      rateUSD: 0,
      batchNumber: '',
      mfgDate: '',
      expDate: '',
      botanicalName: '',
      boxNumber: undefined,
    });
    setEditingItemIndex(null);
    setShowAddItemModal(true);
  };

  const openEditItemModal = (index: number) => {
    setNewItem({ ...items[index] });
    setEditingItemIndex(index);
    setShowAddItemModal(true);
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.hsnCode) {
      toast.error('Please fill description and HSN code');
      return;
    }
    
    if (editingItemIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = newItem;
      setItems(updatedItems);
      toast.success('Item updated successfully');
    } else {
      setItems([...items, newItem]);
      toast.success('Item added successfully');
    }
    
    setShowAddItemModal(false);
    setEditingItemIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Item removed');
  };

  const handleGenerate = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const selectedDocs = [];
    if (docSettings.coa) selectedDocs.push('COA');
    if (docSettings.msds) selectedDocs.push('MSDS');
    if (docSettings.sds) selectedDocs.push('SDS');
    if (docSettings.ifra) selectedDocs.push('IFRA');

    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document type');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          docSettings: docSettings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate documents');
      }

      // Get the ZIP file as blob (single ZIP containing all documents)
      const blob = await response.blob();
      
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Documents_${new Date().toISOString().split('T')[0]}.zip`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create download link for single ZIP file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`✅ Generated and downloaded single ZIP file containing ${selectedDocs.join(', ')} documents!`);
    } catch (error) {
      const err = error as Error;
      console.error('Generate error:', error);
      toast.error(err.message || 'Failed to generate documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Generator</h1>
            <p className="text-gray-600 mt-2">Generate COA, IFRA, MSDS, and SDS documents from items</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Text Extraction Button */}
            <button
              onClick={() => setShowTextModal(true)}
              disabled={extracting || extractingText || loading}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all border-2 ${
                extracting || extractingText || loading
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                  : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 cursor-pointer'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Extract from Text</span>
            </button>

            {/* Upload Excel Button */}
            <label className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all border-2 ${
              extracting || extractingText || loading
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer'
            }`}>
              {extracting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="font-medium">Extracting...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload Excel</span>
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
                disabled={extracting || extractingText || loading}
              />
            </label>
          </div>
        </div>

        {/* Text Extraction Modal */}
        {showTextModal && (
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTextModal(false);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">Extract Items from Text</h3>
                    <p className="text-purple-100 text-sm">Paste invoice/order text and AI will extract items</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTextModal(false);
                    setTextInput('');
                  }}
                  className="p-2 hover:bg-purple-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Invoice/Order Text
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={`Paste your invoice text here...

Example:
Items:
1. Lavender Oil - 5 kg - 1 pcs - $240
2. Rose Oil - 10 kg - 1 pcs - $320`}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none font-mono text-sm"
                      disabled={extractingText}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tip: Paste any invoice text, order details, or structured data. AI will intelligently extract all items.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowTextModal(false);
                    setTextInput('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                  disabled={extractingText}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleTextExtraction();
                    setShowTextModal(false);
                  }}
                  disabled={extractingText || !textInput.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {extractingText ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Extract Items
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Type Selection */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            📄 Select Documents to Generate
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* COA */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.coa}
                onChange={(e) => setDocSettings({...docSettings, coa: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">🧪 Certificate of Analysis (COA)</p>
                <p className="text-xs text-gray-600">Lab test & quality report (per item)</p>
              </div>
            </label>

            {/* MSDS_SINGLE */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.msds}
                onChange={(e) => setDocSettings({...docSettings, msds: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">⚠️ MSDS (Single Product)</p>
                <p className="text-xs text-gray-600">Material Safety Data Sheet (per item)</p>
              </div>
            </label>

            {/* SDS */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.sds}
                onChange={(e) => setDocSettings({...docSettings, sds: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">🔬 SDS (Full Safety Data Sheet)</p>
                <p className="text-xs text-gray-600">With constituents & classification (per item)</p>
              </div>
            </label>

            {/* IFRA */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-green-100 hover:border-green-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.ifra}
                onChange={(e) => setDocSettings({...docSettings, ifra: e.target.checked})}
                className="w-5 h-5 text-green-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">🌿 IFRA Compliance Document</p>
                <p className="text-xs text-gray-600">Restricted components & IFRA standards</p>
              </div>
            </label>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Items</h2>
            <button
              type="button"
              onClick={openAddItemModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No items added yet. Click "Add Item" or extract from Excel/Text.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="font-bold text-gray-700 text-lg min-w-[40px]">#{index + 1}</span>
                      <div className="flex-1 grid grid-cols-5 gap-3 items-center">
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Description</p>
                          <p className="font-medium text-gray-900 truncate">{item.description}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">HSN Code</p>
                          <p className="font-medium text-gray-900">{item.hsnCode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Qty (Kgs)</p>
                          <p className="font-medium text-gray-900">{item.qtyKgs}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pcs</p>
                          <p className="font-medium text-gray-900">{item.pcs}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditItemModal(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit item"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generate Button */}
          {items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading || items.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Generate & Download Documents
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
                <h3 className="text-xl font-bold">
                  {editingItemIndex !== null ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setEditingItemIndex(null);
                  }}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4 bg-white">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Lavender Essential Oil"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HSN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newItem.hsnCode}
                      onChange={(e) => setNewItem({ ...newItem, hsnCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="33012990"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qty (Kgs) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={newItem.qtyKgs}
                      onChange={(e) => setNewItem({ ...newItem, qtyKgs: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pieces <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newItem.pcs}
                      onChange={(e) => setNewItem({ ...newItem, pcs: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.rateUSD}
                      onChange={(e) => setNewItem({ ...newItem, rateUSD: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setEditingItemIndex(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

