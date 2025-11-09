export interface InvoiceItem {
  id: string;
  name: string;
  botanical_name?: string;
  batch_number?: string;
  coa_link?: string;
  msds_link?: string;
  quantity: number;
  weight: number;
  unit_price: number;
  total_amount: number;
  currency: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  consignee_name: string;
  total_pcs: number;
  total_kgs: number;
  excel_link?: string;
  pdf_link?: string;
  created_at: string;
  currency: string;
  items: InvoiceItem[];
}

export interface AutofillSuggestion {
  name: string;
  botanical_name: string;
  batch_number: string;
  coa_link?: string;
  msds_link?: string;
}