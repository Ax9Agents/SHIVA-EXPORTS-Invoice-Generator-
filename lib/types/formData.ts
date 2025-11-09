export interface FormData {
  invoiceNumber: string;
  invoiceDate: string;
  buyerOrderNo: string;
  buyerOrderDate: string;
  exporterName: string;
  exporterAddress: string;
  exporterPhone: string;
  exporterFax: string;
  exporterGSTIN: string;
  exporterIEC: string;
  exporterBank: string;
  exporterAccount: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneePhone: string;
  buyerName: string;
  buyerAddress: string;
  buyerPhone: string;
  countryOrigin: string;
  countryDestination: string;
  portOfLoading: string;
  portOfDischarge: string;
  termsOfDelivery: string;
  productDescription: string;
  currency: string;
  exchangeRate: number;
  totalBoxes: number;
  invoiceType: 'IGST' | 'LUT';
  multiplyRateBy: 'kgs' | 'pcs';
  showExtraFields: boolean;
}

export interface RelatedData {
  name?: string;
  address?: string;
  phone?: string;
  fax?: string;
  gstin?: string;
  iec?: string;
  bank?: string;
  account?: string;
  portDischarge?: string;
  portLoading?: string;
  date?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
}

export interface ExtractedExcelData {
  invoiceNumber?: string;
  invoiceDate?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  exporterName?: string;
  exporterAddress?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  buyerName?: string;
  buyerAddress?: string;
  countryDestination?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  currency?: string;
  exchangeRate?: number;
  totalBoxes?: number;
  termsOfDelivery?: string;
  items?: ExcelItem[];
}

export interface ExcelItem {
  description?: string;
  hsnCode?: string;
  qtyKgs?: number;
  pcs?: number;
  rateUSD?: number;
}
