export interface InvoiceItem {
  sno: string;
  description: string;
  hsnCode: string;
  qtyKgs: number;
  pcs: number;
  rateUSD: number;
  shippingCost?: number; 
  igstRate: number;
  batchNumber?: string;
  mfgDate?: string;
  expDate?: string;
  botanicalName?: string;
  boxNumber?: number;  // ✅ ADD THIS LINE (was missing)
}

export interface ExporterDetails {
  name: string;
  address: string;
  phone: string;
  fax?: string;
  adCode?: string;  // ✅ ADD THIS LINE (was missing)
  arnNo?: string;
  gstin: string;
  iec: string;
  bankName: string;
  accountNo: string;
}

export interface ConsigneeDetails {
  name: string;
  address: string;
  phone: string;
}

export interface BuyerDetails {
  name: string;
  address: string;
  phone: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  buyerOrderNo: string;
  buyerOrderDate: string;
  exporter: ExporterDetails;
  consignee: ConsigneeDetails;
  buyer: BuyerDetails;
  countryOfOrigin: string;
  countryOfDestination: string;
  preCarriageBy: string;
  placeOfReceipt: string;
  termsOfDelivery: string;
  vesselFlightNo: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  productDescription: string;
  currency: string;
  exchangeRate: number;
  items: InvoiceItem[];
  totalPcs: number;
  totalKgs: number;
  totalBoxes: number;
  totalAmount: number;
  shippingCost?: number;
  fobValue?: number;
  totalInvoiceValue?: number;
  invoiceType: 'IGST' | 'LUT';
  multiplyRateBy: 'kgs' | 'pcs';
  showExtraFields: boolean;
}

export interface ItemEnrichment {
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  botanicalName: string;
}

export interface DocumentData {
  coa: string;
  msds: string;
}

export interface ExtractedData {
  invoiceNumber?: string;
  invoiceDate?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  exporterName?: string;
  exporterAddress?: string;
  exporterPhone?: string;
  adCode?: string;
  exporterFax?: string;
  exporterGSTIN?: string;
  exporterIEC?: string;
  exporterBank?: string;
  exporterAccount?: string;
  exporterArnNo?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerPhone?: string;
  countryOrigin?: string;
  countryDestination?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  termsOfDelivery?: string;
  currency?: string;
  exchangeRate?: number;
  totalBoxes?: number;
  shippingCost?: number;
  items?: Array<{
    description: string;
    hsnCode: string;
    qtyKgs: number;
    pcs: number;
    rateUSD: number;
  }>;
  totalPcs?: number;
  totalKgs?: number;
}

export interface DocGenerationSettings {
  annexure: boolean;
  coa: boolean;
  msds: boolean;           // Single product MSDS
  msds2Column: boolean;    // ✅ NEW: 2-column MSDS
  non_hazardous: boolean;
  toxic: boolean;
}


export interface GeneratedDocuments {
  [key: string]: string;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
