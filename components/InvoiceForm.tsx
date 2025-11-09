'use client';

import { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Download, RotateCcw, Sparkles, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AutofillInput from './AutofillInput';

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
  boxNumber?: number; //
}


interface GeneratedInvoice {
  invoiceNumber: string;
  excelLink: string;
  pdfLink: string;
  zipLink?: string;  // ✅ ADD THIS
  invoiceId: string;
}


interface RelatedData {
  [key: string]: string | undefined;
}


export default function InvoiceForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  // Store the loaded user settings for reset/new invoice
  const [defaultSettings, setDefaultSettings] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<GeneratedInvoice | null>(null);
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);
  const [buyerSameAsConsignee, setBuyerSameAsConsignee] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
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


  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    buyerOrderNo: '',
    buyerOrderDate: '',
    exporterName: 'SHIVA EXPORTS INDIA',
    exporterAddress: '35 - FARSH ROAD, KANNAUJ - 209725, UP (INDIA)',
    exporterPhone: '+91 9838 332079',
    adCode: '63914712100009',
  exporterArnNo: 'AD090424005074G',
    exporterFax: '+91 5694 235218',
    exporterGSTIN: '09AEOPT2938Q1ZC',
    exporterIEC: '0609004549',
    exporterBank: 'HDFC BANK LTD',
    exporterAccount: '50200025599210',
    consigneeName: '',
    consigneeAddress: '',
    consigneePhone: '',
    buyerName: '',
    buyerAddress: '',
    buyerPhone: '',
    countryOrigin: 'INDIA',
    countryDestination: '',
    portOfLoading: 'NEW DELHI',
    portOfDischarge: '',
    termsOfDelivery: 'CNF',
    productDescription: '',
    currency: 'USD',
    exchangeRate: 84.50,
    totalBoxes: 1,
    shippingCost: 0,
    invoiceType: 'IGST' as 'IGST' | 'LUT',
    multiplyRateBy: 'kgs' as 'kgs' | 'pcs',
    showExtraFields: true,
  });

  const [items, setItems] = useState<Item[]>([]);
  const [previewData, setPreviewData] = useState<RelatedData | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  {/* ========== STATE INITIALIZATION ========== */}
  const [docSettings, setDocSettings] = useState({
    annexure: false,
    coa: false,
    msds: false,
    sds: false,
    msds2Column: false,
    non_hazardous: false,
    non_hazardous_1: false,
    toxic: false,
    sliFedex: false,
    sliDHL: false,
    ifra: false,
    packingList: false
  });

  
  // Auto-sync buyer with consignee
  useEffect(() => {
    if (buyerSameAsConsignee) {
      setFormData(prev => ({
        ...prev,
        buyerName: prev.consigneeName,
        buyerAddress: prev.consigneeAddress,
        buyerPhone: prev.consigneePhone,
      }));
    }
  }, [buyerSameAsConsignee, formData.consigneeName, formData.consigneeAddress, formData.consigneePhone]);

  // ✅ ADD THIS - Load default settings from database
  useEffect(() => {
    if (userId) {
      fetchDefaultSettings();
    }
  }, [userId]);

  const fetchDefaultSettings = async () => {
    try {
      const response = await fetch(`/api/settings?userId=${userId}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Save the loaded settings for later resets
        setDefaultSettings({
          exporterName: result.data.exporter_name || 'SHIVA EXPORTS INDIA',
          exporterAddress: result.data.exporter_address || '35 - FARSH ROAD, KANNAUJ - 209725, UP (INDIA)',
          exporterPhone: result.data.exporter_phone || '+91 9838 332079',
          exporterFax: result.data.exporter_fax || '5694 235218',
          exporterGSTIN: result.data.exporter_gstin || '09AEOPT2938Q1ZC',
          exporterIEC: result.data.exporter_iec || '0609004549',
          exporterBank: result.data.exporter_bank || 'HDFC BANK LTD',
          exporterAccount: result.data.exporter_account || '50200025599210',
          adCode: result.data.ad_code || '63914712100009',
          exporterArnNo: result.data.exporter_arn_no || 'AD090424005074G',
          countryOrigin: result.data.country_origin || 'INDIA',
          portOfLoading: result.data.port_of_loading || 'NEW DELHI',
          termsOfDelivery: result.data.terms_of_delivery || 'CNF',
          currency: result.data.currency || 'USD',
          exchangeRate: result.data.exchange_rate || 84.50,
        });
        setFormData(prev => ({
          ...prev,
          exporterName: result.data.exporter_name || prev.exporterName,
          exporterAddress: result.data.exporter_address || prev.exporterAddress,
          exporterPhone: result.data.exporter_phone || prev.exporterPhone,
          exporterFax: result.data.exporter_fax || prev.exporterFax,
          exporterGSTIN: result.data.exporter_gstin || prev.exporterGSTIN,
          exporterIEC: result.data.exporter_iec || prev.exporterIEC,
          exporterBank: result.data.exporter_bank || prev.exporterBank,
          exporterAccount: result.data.exporter_account || prev.exporterAccount,
          adCode: result.data.ad_code || prev.adCode,
          exporterArnNo: result.data.exporter_arn_no || prev.exporterArnNo,
          countryOrigin: result.data.country_origin || prev.countryOrigin,
          portOfLoading: result.data.port_of_loading || prev.portOfLoading,
          termsOfDelivery: result.data.terms_of_delivery || prev.termsOfDelivery,
          currency: result.data.currency || prev.currency,
          exchangeRate: result.data.exchange_rate || prev.exchangeRate,
        }));
      }
    } catch (error) {
      console.error('Failed to load default settings:', error);
    }
  };


  // Calculate totals
  const totalPcs = items.reduce((sum, item) => sum + item.pcs, 0);
  const totalKgs = items.reduce((sum, item) => sum + item.qtyKgs, 0);
  const totalAmount = items.reduce((sum, item) => {
    const multiplier = formData.multiplyRateBy === 'kgs' ? item.qtyKgs : item.pcs;
    return sum + (item.rateUSD * multiplier);
  }, 0);

   const fobValue = totalAmount - formData.shippingCost;

    // Check if invoice number is unique
  const checkInvoiceNumberUnique = async (invoiceNumber: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/check-invoice?userId=${userId}&invoiceNumber=${encodeURIComponent(invoiceNumber)}`);
      const result = await response.json();
      return result.isUnique;
    } catch (error) {
      console.error('Error checking invoice number:', error);
      return true;
    }
  };
  

  const handleFormChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

    const handleRelatedDataSelect = (data: RelatedData) => {
    console.log('📥 Received related data:', data);
    
    setFormData(prev => {
      const updated = { ...prev };
      
      // Direct field updates
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null && value !== '') {
          // Check if key exists in formData
          if (key in updated) {
            (updated as any)[key] = value;
          }
        }
      });
      
      console.log('✅ Updated form data:', updated);
      return updated;
    });
    
    toast.success('Data filled from history');
  };


  const handleHoverPreview = (data: RelatedData | null) => {
    if (!data) {
      setPreviewData(null);
      return;
    }
    setPreviewData(data);
  };

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
        
        console.log('📦 Extracted data:', extracted);
        
        setFormData(prev => ({
          ...prev,
          invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber,
          invoiceDate: extracted.invoiceDate || prev.invoiceDate,
          buyerOrderNo: extracted.buyerOrderNo || prev.buyerOrderNo,
          buyerOrderDate: extracted.buyerOrderDate || prev.buyerOrderDate,
          exporterName: extracted.exporterName || prev.exporterName,
          exporterAddress: extracted.exporterAddress || prev.exporterAddress,
          exporterPhone: extracted.exporterPhone || prev.exporterPhone,
          exporterFax: extracted.exporterFax || prev.exporterFax,
          exporterGSTIN: extracted.exporterGSTIN || prev.exporterGSTIN,
          exporterIEC: extracted.exporterIEC || prev.exporterIEC,
          exporterBank: extracted.exporterBank || prev.exporterBank,
          exporterAccount: extracted.exporterAccount || prev.exporterAccount,
          exporterArnNo: extracted.exporterArnNo || prev.exporterArnNo,
          consigneeName: extracted.consigneeName || prev.consigneeName,
          consigneeAddress: extracted.consigneeAddress || prev.consigneeAddress,
          consigneePhone: extracted.consigneePhone || prev.consigneePhone,
          buyerName: extracted.buyerName || prev.buyerName,
          buyerAddress: extracted.buyerAddress || prev.buyerAddress,
          buyerPhone: extracted.buyerPhone || prev.buyerPhone,
          countryOrigin: extracted.countryOrigin || prev.countryOrigin,
          countryDestination: extracted.countryDestination || prev.countryDestination,
          portOfLoading: extracted.portOfLoading || prev.portOfLoading,
          portOfDischarge: extracted.portOfDischarge || prev.portOfDischarge,
          termsOfDelivery: extracted.termsOfDelivery || prev.termsOfDelivery,
          currency: extracted.currency || prev.currency,
          exchangeRate: extracted.exchangeRate || prev.exchangeRate,
          totalBoxes: extracted.totalBoxes || prev.totalBoxes,
          invoiceType: extracted.invoiceType || prev.invoiceType,
        }));

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
          })));
        }


        toast.success(`✅ Extracted ${extracted.items?.length || 0} items successfully!`);
        console.log('✅ Complete - Exporter:', extracted.exporterName, 'Items:', extracted.items?.length);
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
        
        console.log('📝 Extracted data from text:', extracted);
        
        setFormData(prev => ({
          ...prev,
          invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber,
          invoiceDate: extracted.invoiceDate || prev.invoiceDate,
          buyerOrderNo: extracted.buyerOrderNo || prev.buyerOrderNo,
          buyerOrderDate: extracted.buyerOrderDate || prev.buyerOrderDate,
          exporterName: extracted.exporterName || prev.exporterName,
          exporterAddress: extracted.exporterAddress || prev.exporterAddress,
          exporterPhone: extracted.exporterPhone || prev.exporterPhone,
          adCode: extracted.adCode || prev.adCode,
          exporterFax: extracted.exporterFax || prev.exporterFax,
          exporterGSTIN: extracted.exporterGSTIN || prev.exporterGSTIN,
          exporterIEC: extracted.exporterIEC || prev.exporterIEC,
          exporterBank: extracted.exporterBank || prev.exporterBank,
          exporterAccount: extracted.exporterAccount || prev.exporterAccount,
          exporterArnNo: extracted.exporterArnNo || prev.exporterArnNo,
          consigneeName: extracted.consigneeName || prev.consigneeName,
          consigneeAddress: extracted.consigneeAddress || prev.consigneeAddress,
          consigneePhone: extracted.consigneePhone || prev.consigneePhone,
          buyerName: extracted.buyerName || prev.buyerName,
          buyerAddress: extracted.buyerAddress || prev.buyerAddress,
          buyerPhone: extracted.buyerPhone || prev.buyerPhone,
          countryOrigin: extracted.countryOrigin || prev.countryOrigin,
          countryDestination: extracted.countryDestination || prev.countryDestination,
          portOfLoading: extracted.portOfLoading || prev.portOfLoading,
          portOfDischarge: extracted.portOfDischarge || prev.portOfDischarge,
          termsOfDelivery: extracted.termsOfDelivery || prev.termsOfDelivery,
          productDescription: extracted.productDescription || prev.productDescription,
          currency: extracted.currency || prev.currency,
          exchangeRate: extracted.exchangeRate || prev.exchangeRate,
          totalBoxes: extracted.totalBoxes || prev.totalBoxes,
          shippingCost: extracted.shippingCost || prev.shippingCost,
          invoiceType: extracted.invoiceType || prev.invoiceType,
        }));

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
        }

        toast.success(`✅ Extracted ${extracted.items?.length || 0} items from text successfully!`);
        setTextInput(''); // Clear the input after successful extraction
        console.log('✅ Complete - Exporter:', extracted.exporterName, 'Items:', extracted.items?.length);
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
      boxNumber: formData.totalBoxes > 1 ? 1 : undefined,
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
    if (formData.totalBoxes > 1 && (!newItem.boxNumber || newItem.boxNumber < 1 || newItem.boxNumber > formData.totalBoxes)) {
      toast.error('Please select a valid box number');
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
  const calculateItemShipping = (itemKgs: number): number => {
    if (totalKgs === 0 || formData.shippingCost === 0) return 0;
    return (itemKgs / totalKgs) * formData.shippingCost;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.invoiceNumber || !formData.invoiceDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      // ✅ CHECK IF INVOICE NUMBER IS UNIQUE
      const isUnique = await checkInvoiceNumberUnique(formData.invoiceNumber);
      if (!isUnique) {
        toast.error('❌ Invoice number already exists! Please use a different number.');
        setLoading(false);
        return;
      }

      // ✅ MAP YOUR FIELD NAMES TO InvoiceData
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        buyerOrderNo: formData.buyerOrderNo,
        buyerOrderDate: formData.buyerOrderDate,
        exporter: {
          name: formData.exporterName,
          address: formData.exporterAddress,
          phone: formData.exporterPhone,
          fax: formData.exporterFax,
          adCode: formData.adCode,
          arnNo: formData.exporterArnNo,
          gstin: formData.exporterGSTIN,
          iec: formData.exporterIEC,
          bankName: formData.exporterBank,
          accountNo: formData.exporterAccount,
        },
        consignee: {
          name: formData.consigneeName,
          address: formData.consigneeAddress,
          phone: formData.consigneePhone,
        },
        buyer: {
          name: formData.buyerName,
          address: formData.buyerAddress,
          phone: formData.buyerPhone,
        },
        countryOfOrigin: formData.countryOrigin,
        countryOfDestination: formData.countryDestination,
        preCarriageBy: '',
        placeOfReceipt: '',
        termsOfDelivery: formData.termsOfDelivery,
        vesselFlightNo: '',
        portOfLoading: formData.portOfLoading,
        portOfDischarge: formData.portOfDischarge,
        finalDestination: '',
        productDescription: formData.productDescription,
        currency: formData.currency,
        exchangeRate: formData.exchangeRate,
        items: items,
        totalPcs: totalPcs,
        totalKgs: totalKgs,
        totalBoxes: formData.totalBoxes,
        totalAmount: totalAmount,
        shippingCost: formData.shippingCost,
        fobValue: fobValue,
        totalInvoiceValue: totalAmount,
        invoiceType: formData.invoiceType,
        multiplyRateBy: formData.multiplyRateBy,
        showExtraFields: formData.showExtraFields,
      };

      // ✅ CALL API WITH DOC SETTINGS
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          invoiceData,
          docGenerationSettings: docSettings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate invoice');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const selectedDocs = [];
        if (docSettings.annexure) selectedDocs.push('Annexure');
        if (docSettings.coa) selectedDocs.push('COA');
        if (docSettings.msds) selectedDocs.push('MSDS');
        if (docSettings.sds) selectedDocs.push('SDS');
        if (docSettings.msds2Column) selectedDocs.push('MSDS 2-Col');
        if (docSettings.non_hazardous) selectedDocs.push('Non-Haz');
        if (docSettings.toxic) selectedDocs.push('Toxic');
        if (docSettings.sliFedex) selectedDocs.push('SLI-FedEx');
        if (docSettings.sliDHL) selectedDocs.push('SLI-DHL');

        const docsText = selectedDocs.length > 0 
          ? ` + ${selectedDocs.join(', ')}`
          : '';

        toast.success(`✅ Invoice generated!${docsText}`);

        setGeneratedInvoice(result.data);
        setShowPreview(true);
        setShowPDFPreview(true); 
      } else {
        toast.error(result.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };




  const handleReset = () => {
    if (confirm('Are you sure you want to reset the form? All unsaved data will be lost.')) {
      const defaultFormData = {
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        buyerOrderNo: '',
        buyerOrderDate: '',
        exporterName: defaultSettings?.exporterName || 'SHIVA EXPORTS INDIA',
        exporterAddress: defaultSettings?.exporterAddress || '35 - FARSH ROAD, KANNAUJ - 209725, UP (INDIA)',
        exporterPhone: defaultSettings?.exporterPhone || '+91 9838 332079',
        adCode: defaultSettings?.adCode || '63914712100009',
        exporterArnNo: defaultSettings?.exporterArnNo || 'AD090424005074G',
        exporterFax: defaultSettings?.exporterFax || '5694 235218',
        exporterGSTIN: defaultSettings?.exporterGSTIN || '09AEOPT2938Q1ZC',
        exporterIEC: defaultSettings?.exporterIEC || '0609004549',
        exporterBank: defaultSettings?.exporterBank || 'HDFC BANK LTD',
        exporterAccount: defaultSettings?.exporterAccount || '50200025599210',
        consigneeName: '',
        consigneeAddress: '',
        consigneePhone: '',
        buyerName: '',
        buyerAddress: '',
        buyerPhone: '',
        countryOrigin: defaultSettings?.countryOrigin || 'INDIA',
        countryDestination: '',
        portOfLoading: defaultSettings?.portOfLoading || 'NEW DELHI',
        portOfDischarge: '',
        termsOfDelivery: defaultSettings?.termsOfDelivery || 'CNF',
        productDescription: '',
        currency: defaultSettings?.currency || 'USD',
        exchangeRate: defaultSettings?.exchangeRate || 84.50,
        totalBoxes: 1,
        shippingCost: 0,
        invoiceType: 'IGST' as 'IGST' | 'LUT',
        multiplyRateBy: 'kgs' as 'kgs' | 'pcs',
        showExtraFields: true,
      };
      setFormData(defaultFormData);
      setItems([]);
      setBuyerSameAsConsignee(false);
      toast.success('Form reset successfully');
    }
  };

  const handleNewInvoice = () => {
    const defaultFormData = {
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      buyerOrderNo: '',
      buyerOrderDate: '',
      exporterName: defaultSettings?.exporterName || 'SHIVA EXPORTS INDIA',
      exporterAddress: defaultSettings?.exporterAddress || '35 - FARSH ROAD, KANNAUJ - 209725, UP (INDIA)',
      exporterPhone: defaultSettings?.exporterPhone || '+91 9838 332079',
      adCode: defaultSettings?.adCode || '63914712100009',
      exporterArnNo: defaultSettings?.exporterArnNo || 'AD090424005074G',
      exporterFax: defaultSettings?.exporterFax || '5694 235218',
      exporterGSTIN: defaultSettings?.exporterGSTIN || '09AEOPT2938Q1ZC',
      exporterIEC: defaultSettings?.exporterIEC || '0609004549',
      exporterBank: defaultSettings?.exporterBank || 'HDFC BANK LTD',
      exporterAccount: defaultSettings?.exporterAccount || '50200025599210',
      consigneeName: '',
      consigneeAddress: '',
      consigneePhone: '',
      buyerName: '',
      buyerAddress: '',
      buyerPhone: '',
      countryOrigin: defaultSettings?.countryOrigin || 'INDIA',
      countryDestination: '',
      portOfLoading: defaultSettings?.portOfLoading || 'NEW DELHI',
      portOfDischarge: '',
      termsOfDelivery: defaultSettings?.termsOfDelivery || 'CNF',
      productDescription: '',
      currency: defaultSettings?.currency || 'USD',
      exchangeRate: defaultSettings?.exchangeRate || 84.50,
      totalBoxes: 1,
      shippingCost: 0,
      invoiceType: 'IGST' as 'IGST' | 'LUT',
      multiplyRateBy: 'kgs' as 'kgs' | 'pcs',
      showExtraFields: true,
    };
    setFormData(defaultFormData);
    setItems([]);
    setShowPreview(false);
    setShowPDFPreview(false);
    setGeneratedInvoice(null);
    setOriginalFormData(null);
    setBuyerSameAsConsignee(false);
    toast.success('Ready for new invoice');
  };
    return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generate Invoice</h1>
            <p className="text-gray-600 mt-2">AI-Powered Invoice Generation with Excel & PDF Export</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Text Extraction Button */}
            <div className="relative group">
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
            </div>

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
                    <h3 className="text-xl font-bold">Extract Invoice Data from Text</h3>
                    <p className="text-purple-100 text-sm">Paste invoice/order text and AI will extract all fields</p>
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
                      Invoice Number: INV-2024-001
                      Date: 2024-12-08
                      Exporter: SHIVA EXPORTS INDIA
                      Address: 35 - FARSH ROAD, KANNAUJ - 209725, UP (INDIA)
                      Consignee: ABC Company, 123 Main St, New York, USA
                      Items:
                      1. Lavender Oil - 5 kg - 1 pcs - $240
                      2. Rose Oil - 10 kg - 1 pcs - $320`}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none font-mono text-sm"
                      disabled={extractingText}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tip: Paste any invoice text, order details, or structured data. AI will intelligently extract all fields.
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
                      Extract Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          className={`space-y-8 ${extracting || extractingText || loading ? 'pointer-events-none opacity-50' : ''}`}
        >
          {/* Invoice Type & Settings Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="IGST"
                      checked={formData.invoiceType === 'IGST'}
                      onChange={(e) => handleFormChange('invoiceType', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">IGST</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="LUT"
                      checked={formData.invoiceType === 'LUT'}
                      onChange={(e) => handleFormChange('invoiceType', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">LUT</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleFormChange('currency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="GBP">GBP - Great British Pound</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.multiplyRateBy === 'pcs'}
                    onChange={(e) => handleFormChange('multiplyRateBy', e.target.checked ? 'pcs' : 'kgs')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Multiply rate by Pcs (default: Kgs)</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showExtraFields}
                    onChange={(e) => handleFormChange('showExtraFields', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Show HSN, Batch, Mfg, Exp in PDF/Excel</span>
                </label>
              </div>
            </div>
          </div>
                    {/* Invoice Details */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Invoice Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AutofillInput
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(val) => handleFormChange('invoiceNumber', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="invoice_number"
                required
                placeholder="INV-2024-001"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => handleFormChange('invoiceDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <AutofillInput
                label="Buyer Order No"
                value={formData.buyerOrderNo}
                onChange={(val) => handleFormChange('buyerOrderNo', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="buyer_order_no"
                placeholder="PO-2024-001"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Order Date
                </label>
                <input
                  type="date"
                  value={formData.buyerOrderDate}
                  onChange={(e) => handleFormChange('buyerOrderDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exchange Rate <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.exchangeRate}
                  onChange={(e) => handleFormChange('exchangeRate', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Boxes <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalBoxes}
                  onChange={(e) => handleFormChange('totalBoxes', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Cost ({formData.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.shippingCost}
                  onChange={(e) => handleFormChange('shippingCost', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Distributed by weight for customs compliance</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description
                </label>
                <input
                  type="text"
                  value={formData.productDescription}
                  onChange={(e) => handleFormChange('productDescription', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="AROMA CHEMICALS"
                />
              </div>
            </div>
          </div>

          {/* Exporter Information */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Exporter Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AutofillInput
                label="Exporter Name"
                value={formData.exporterName}
                onChange={(val) => handleFormChange('exporterName', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="exporter_name"
                required
                placeholder="Company Name"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.exporterPhone}
                  onChange={(e) => handleFormChange('exporterPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            {/* ADDED: AD Code field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AD Code
                </label>
                <input
                  type="text"
                  value={formData.adCode}
                  onChange={(e) => handleFormChange('adCode', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter AD Code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ARN No
                </label>
                <input
                  type="text"
                  value={formData.exporterArnNo}
                  onChange={(e) => handleFormChange('exporterArnNo', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter LUT ARN"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.exporterAddress}
                onChange={(e) => handleFormChange('exporterAddress', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                required
                placeholder="Full address with city, state, country, pincode"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fax
                </label>
                <input
                  type="text"
                  value={formData.exporterFax}
                  onChange={(e) => handleFormChange('exporterFax', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GSTIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.exporterGSTIN}
                  onChange={(e) => handleFormChange('exporterGSTIN', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IEC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.exporterIEC}
                  onChange={(e) => handleFormChange('exporterIEC', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="AAAAA0000A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.exporterBank}
                  onChange={(e) => handleFormChange('exporterBank', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="HDFC Bank"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.exporterAccount}
                onChange={(e) => handleFormChange('exporterAccount', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="1234567890123"
              />
            </div>
          </div>
                    {/* Consignee Information */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Consignee Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AutofillInput
                label="Consignee Name"
                value={formData.consigneeName}
                onChange={(val) => handleFormChange('consigneeName', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="consignee_name"
                required
                placeholder="Company Name"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.consigneePhone}
                  onChange={(e) => handleFormChange('consigneePhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="+1 234567890"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.consigneeAddress}
                onChange={(e) => handleFormChange('consigneeAddress', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                required
                placeholder="Full address with city, state, country, zipcode"
              />
            </div>
          </div>

          {/* Buyer Information */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Buyer Information</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={buyerSameAsConsignee}
                  onChange={(e) => setBuyerSameAsConsignee(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Same as Consignee</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AutofillInput
                label="Buyer Name"
                value={formData.buyerName}
                onChange={(val) => handleFormChange('buyerName', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="buyer_name"
                required
                placeholder="Company Name"
                disabled={buyerSameAsConsignee}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.buyerPhone}
                  onChange={(e) => handleFormChange('buyerPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  placeholder="+1 234567890"
                  disabled={buyerSameAsConsignee}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.buyerAddress}
                onChange={(e) => handleFormChange('buyerAddress', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                placeholder="Full address with city, state, country, zipcode"
                disabled={buyerSameAsConsignee}
              />
            </div>
          </div>

          {/* Shipping Details */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AutofillInput
                label="Country of Origin"
                value={formData.countryOrigin}
                onChange={(val) => handleFormChange('countryOrigin', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="country_origin"
                placeholder="INDIA"
              />
              <AutofillInput
                label="Country of Destination"
                value={formData.countryDestination}
                onChange={(val) => handleFormChange('countryDestination', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="country_destination"
                required
                placeholder="UAE"
              />
              <AutofillInput
                label="Port of Loading"
                value={formData.portOfLoading}
                onChange={(val) => handleFormChange('portOfLoading', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="port_loading"
                required
                placeholder="Mumbai Port"
              />
              <AutofillInput
                label="Port of Discharge"
                value={formData.portOfDischarge}
                onChange={(val) => handleFormChange('portOfDischarge', val)}
                onRelatedDataSelect={handleRelatedDataSelect}
                onHoverPreview={handleHoverPreview}
                userId={userId}
                fieldName="port_discharge"
                required
                placeholder="Dubai Port"
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms of Delivery <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.termsOfDelivery}
                onChange={(e) => handleFormChange('termsOfDelivery', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="FOB, CIF, etc."
              />
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

            {/* Items Display with Box Information */}
            {items.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">No items added yet. Click "Add Item" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-bold text-gray-700 text-lg min-w-[40px]">#{index + 1}</span>
                        <div className="flex-1 grid grid-cols-6 gap-3 items-center">
                          <div className="col-span-1">
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
                          <div>
                            <p className="text-xs text-gray-500">Rate ({formData.currency})</p>
                            <p className="font-medium text-gray-900">{item.rateUSD.toFixed(3)}</p>
                          </div>
                          {/* ADDED: Box display when totalBoxes > 1 */}
                          {formData.totalBoxes > 1 && (
                            <div>
                              <p className="text-xs text-gray-500">Box</p>
                              <p className="font-medium text-gray-900">{item.boxNumber || 'N/A'}</p>
                            </div>
                          )}
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


            {/* Updated Summary with FOB Value */}
            {items.length > 0 && (
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Pieces</p>
                    <p className="text-2xl font-bold text-blue-600">{totalPcs}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Weight</p>
                    <p className="text-2xl font-bold text-blue-600">{totalKgs.toFixed(3)} Kgs</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">FOB Value</p>
                    <p className="text-2xl font-bold text-blue-600">{formData.currency} {Math.max(0, fobValue).toFixed(3)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Shipping Cost</p>
                    <p className="text-2xl font-bold text-orange-600">{formData.currency} {formData.shippingCost.toFixed(3)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-200">
                    <p className="text-sm text-gray-600">Total Invoice</p>
                    <p className="text-2xl font-bold text-green-600">{formData.currency} {(totalAmount).toFixed(3)}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
          {/* ========== DOCUMENT GENERATION SETTINGS ========== */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            📄 Additional Documents to Generate
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Annexure */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.annexure}
                onChange={(e) => setDocSettings({...docSettings, annexure: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">📋 Annexure</p>
                <p className="text-xs text-gray-600">Invoice attachment document</p>
              </div>
            </label>

            {/* Certificate of Analysis (COA) */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.coa}
                onChange={(e) => setDocSettings({...docSettings, coa: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">🧪 Certificate of Analysis (COA)</p>
                <p className="text-xs text-gray-600">Lab test & quality report</p>
              </div>
            </label>

            {/* MSDS (Single Product) */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.msds}
                onChange={(e) => setDocSettings({...docSettings, msds: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">⚠️ MSDS (Single Product)</p>
                <p className="text-xs text-gray-600">Material Safety Data Sheet</p>
              </div>
            </label>

            {/* SDS (Full Safety Data Sheet) */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.sds}
                onChange={(e) => setDocSettings({...docSettings, sds: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">🔬 SDS (Full Safety Data Sheet)</p>
                <p className="text-xs text-gray-600">With constituents & classification</p>
              </div>
            </label>

            {/* MSDS (2-Column) */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.msds2Column}
                onChange={(e) => setDocSettings({...docSettings, msds2Column: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">⚠️ MSDS (2-Column Format)</p>
                <p className="text-xs text-gray-600">Multiple items in 2 columns</p>
              </div>
            </label>

            {/* Non-Hazardous Certification (v1) */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.non_hazardous}
                onChange={(e) => setDocSettings({...docSettings, non_hazardous: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">✅ Non-Hazardous Cert (v1)</p>
                <p className="text-xs text-gray-600">Safety compliance certificate</p>
              </div>
            </label>

            {/* Non-Hazardous Certification (v2) */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.non_hazardous_1}
                onChange={(e) => setDocSettings({...docSettings, non_hazardous_1: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">✅ Non-Hazardous Cert (v2)</p>
                <p className="text-xs text-gray-600">Safety compliance certificate</p>
              </div>
            </label>

            {/* Toxic Control Certification */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.toxic}
                onChange={(e) => setDocSettings({...docSettings, toxic: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">☠️ Toxic Control Certification</p>
                <p className="text-xs text-gray-600">Toxicity compliance document</p>
              </div>
            </label>

            {/* SLI - FedEx */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.sliFedex}
                onChange={(e) => setDocSettings({...docSettings, sliFedex: e.target.checked})}
                className="w-5 h-5 text-orange-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">📦 SLI - FedEx</p>
                <p className="text-xs text-gray-600">Shipper's Letter of Instruction</p>
              </div>
            </label>

            {/* SLI - DHL */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-yellow-100 hover:border-yellow-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.sliDHL}
                onChange={(e) => setDocSettings({...docSettings, sliDHL: e.target.checked})}
                className="w-5 h-5 text-yellow-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">📦 SLI - DHL</p>
                <p className="text-xs text-gray-600">Shipper's Letter of Instruction</p>
              </div>
            </label>
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
            {/* Packing List */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={docSettings.packingList}
                onChange={(e) => setDocSettings({...docSettings, packingList: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">📦 Packing List</p>
                <p className="text-xs text-gray-600">Detailed packing & shipment list</p>
              </div>
            </label>

          </div>
          {/* Info Box */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-purple-600">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">💡 Tip:</span> All selected documents will be generated and included in the ZIP file.
            </p>
          </div>
        </div>

          {/* Submit and Reset Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Invoice
                </>
              )}
            </button>
          </div>
        </form>
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
                    Rate ({formData.currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.rateUSD}
                    onChange={(e) => setNewItem({ ...newItem, rateUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              {/* ADDED: Box Selection - Only show if totalBoxes > 1 */}
              {formData.totalBoxes > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Box Number <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newItem.boxNumber || ''}
                    onChange={(e) => setNewItem({ ...newItem, boxNumber: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    required={formData.totalBoxes > 1}
                  >
                    <option value="">Select Box</option>
                    {Array.from({ length: formData.totalBoxes }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Box {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
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


      {/* Preview Modal */}
      {/* PDF Preview Modal with Download Options */}
      {/* Preview Modal */}
      {showPDFPreview && generatedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <div>
                  <h3 className="text-2xl font-bold">Invoice Generated Successfully!</h3>
                  <p className="text-green-100 text-sm">Invoice #{generatedInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowPDFPreview(false)} className="p-2 hover:bg-green-600 rounded-lg transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* ✅ Download Buttons - Updated */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex gap-4">
              <a 
                href={generatedInvoice.excelLink} 
                download 
                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Excel
              </a>
              
              <a 
                href={generatedInvoice.pdfLink} 
                download 
                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </a>
              

              {/* ✅ NEW: ZIP Download Button - Only on click, no auto-download */}
              {generatedInvoice.zipLink && (
                <button
                  onClick={() => {
                    if (!generatedInvoice.zipLink) {
                      toast.error('ZIP link not available');
                      return;
                    } 
                    const a = document.createElement('a');
                    a.href = generatedInvoice.zipLink;
                    a.download = `INV_${generatedInvoice.invoiceNumber}_${formData.consigneeName?.split(' ')[0] || 'Invoice'}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    toast.success('ZIP downloaded successfully!');
                  }}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Download ZIP (All Docs)
                </button>
              )}
            </div>

            {/* PDF Preview */}
            <div className="flex-1 overflow-hidden">
              <iframe 
                src={`${generatedInvoice.pdfLink}#view=FitH`} 
                className="w-full h-full border-0" 
                title="Invoice PDF Preview" 
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p className="font-semibold">Total Amount: {formData.currency} {totalAmount.toFixed(2)}</p>
                <p>Items: {items.length} | Total Weight: {totalKgs.toFixed(3)} Kgs</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPDFPreview(false)} 
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={handleNewInvoice} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Create New Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
