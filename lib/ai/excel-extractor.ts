import { GoogleGenerativeAI } from '@google/generative-ai';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ExtractedData {
  invoiceNumber?: string;
  invoiceDate?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  
  exporterName?: string;
  exporterAddress?: string;
  exporterPhone?: string;
  adCode?: string; // ADD THIS LINE
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
  
  invoiceType?: 'IGST' | 'LUT';
  
  items?: Array<{
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
  }>;
}

async function generateWithGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

function cleanJSONResponse(text: string): string {
  
 text = text.replace(/```javascript\n?/gi, '');
text = text.replace(/```\n?/g, '');
  
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  text = text.replace(/\/\/.*/g, '');
  
  return text.trim();
}

export async function extractDataFromExcel(buffer: ArrayBuffer | ArrayBufferView | Uint8Array | unknown): Promise<ExtractedData | null> {
  try {
    console.log('Reading Excel file...');
    let uint8: Uint8Array;
    if (buffer instanceof Uint8Array) {
      uint8 = buffer;
    } else if (ArrayBuffer.isView(buffer as ArrayBufferView)) {
      const view = buffer as ArrayBufferView;
      uint8 = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    } else {
      uint8 = new Uint8Array(buffer as ArrayBuffer);
    }

    let excelText = '';
    let rowCount = 0;
    
    // Try XLSX library first (handles both .xls and .xlsx)
    try {
      console.log('Trying XLSX library for file reading...');
      const workbook = XLSX.read(uint8, { type: 'array' });
      const sheetName = workbook.SheetNames[0]; // Get first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
      
      data.forEach((row, rowNumber) => {
        const cleanRow = row
          .filter(cell => cell !== null && cell !== undefined && cell !== '')
          .map(cell => String(cell))
          .join(' | ');
        
        if (cleanRow.trim()) {
          excelText += `Row ${rowNumber + 1}: ${cleanRow}\n`;
          rowCount++;
        }
      });
      
      console.log('✅ Successfully read with XLSX library');
      
    } catch (xlsxError) {
      console.log('XLSX failed, trying ExcelJS...');
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(uint8 as any);
        
        const worksheet = workbook.worksheets[0]; // Get first worksheet
        if (!worksheet) {
          throw new Error('No worksheet found in Excel file');
        }

        worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
          const rowText = row.values as unknown[];
          const cleanRow = rowText
            .filter(cell => cell !== null && cell !== undefined && cell !== '')
            .map(cell => {
              if (typeof cell === 'object' && cell !== null && 'text' in cell) {
                return String((cell as { text: string }).text);
              }
              return String(cell);
            })
            .join(' | ');
          
          if (cleanRow.trim()) {
            excelText += `Row ${rowNumber}: ${cleanRow}\n`;
            rowCount++;
          }
        });
        
        console.log('✅ Successfully read with ExcelJS');
      } catch (exceljsError) {
        console.error('Both XLSX and ExcelJS failed:', xlsxError, exceljsError);
        throw new Error('Unable to read Excel file. Please ensure it is a valid .xls or .xlsx file.');
      }
    }

    if (!excelText.trim() || rowCount < 3) {
      throw new Error('Excel file appears to be empty or has insufficient data');
    }

    console.log('Extracted text length:', excelText.length, 'rows:', rowCount);

    // Update the prompt section (around line 130):
    const prompt = `You are an expert invoice/order data extraction AI. Extract ALL data from this Excel file intelligently.

    🔍 DETECTION RULES:
    1. Identify the document type: Invoice, Order Sheet, Purchase Order, or Delivery Note
    2. Detect if there are MULTIPLE customers/orders in one sheet
    3. Find ALL item tables - extract EVERY row from each table
    4. Auto-detect column names (they may vary): "Description"/"Product Name", "QTY"/"Size"/"Quantity", "Pcs"/"Units", "Rate"/"Price"
    5. Look for AD Code in exporter information (may be labeled as "AD Code", "ADCode", "Authorised Dealer Code")

    📋 EXCEL STRUCTURE ANALYSIS:
    Look for these patterns:
    - Header info: Invoice/Order number, Date, Customer details
    - Exporter info: Name, Address, Phone, Fax, GSTIN, IEC, Bank details, AD Code
    - Item tables: Usually have headers like "No"/"S.No", "Description"/"Product", "QTY"/"Size", "Pcs"/"Units", "Rate"/"Price", "Box"/"Container"
    - Total row: May say "12 PCS - Total: 10.550 KGS - 1 BOX" - extract the BOX count
    - Multiple sections: May have multiple "Order summary" or customer blocks

    ⚠️ CRITICAL EXTRACTION RULES:

    FOR ITEMS:
    - Extract EVERY SINGLE item row from ALL tables
    - "Pcs"/"Units" = piece count (usually 1-10) - SMALL numbers
    - "Rate"/"Price" = price per piece (usually 25-500+) - LARGER numbers  
    - "Size"/"QTY"/"Quantity" = weight - can be in KG or ML
      * Parse "5 kg", "5kg", "5 KG" → extract as qtyKgs: 5
      * Parse "200 ml", "200ml", "200 ML", "0.2 L" → convert to kg: 200ml = 0.2kg
      * Parse "500 ml" → 0.5kg, "1000 ml" → 1kg
    - "Box"/"Container" = box number assignment (e.g., 1, 2, 3) - extract if present
    - Parse prices like "$240.00" or "240" → extract as rateUSD: 240
    - If you see 20 items across multiple tables, extract ALL 20 items


    FOR TOTALS:
    - Look for a total row that says: "X PCS - Total: Y.YYY KGS - Z BOX"
    - "totalBoxes" = number of BOXES/CARTONS (e.g., "1 BOX" = 1, "2 BOXES" = 2)
    - This is NOT the count of items - it's the shipping box count
    - If no box count is mentioned, calculate: totalBoxes = ceil(sum of all pcs / 10)

    FOR CUSTOMER INFO:
    - Consignee = The receiving party (ship-to address)
    - Buyer = The ordering party (bill-to address - may be same as consignee)
    - Extract full addresses including country
    - Extract phone numbers with country code

    📊 Excel Content:
    ${excelText}

    🎯 Return FLAT JSON in this EXACT format (extract ALL items):
    {
      "invoiceNumber": "400" or "ORDER-2024-001",
      "invoiceDate": "2025-11-08" (today's date if missing),
      "buyerOrderNo": "ORDER # 2029" or generate from customer name,
      "buyerOrderDate": "2025-11-08" (same as invoice date if missing),
      "invoiceType": "LUT" or "IGST",
      "consigneeName": "Tammy Evans",
      "consigneeAddress": "19505 56th Avenue, Unit 110, Surrey, British Columbia V3S 6K3, Canada",
      "consigneePhone": "+16045308979",
      "buyerName": "Tammy Evans" (same as consignee if not specified separately),
      "buyerAddress": "19505 56th Avenue, Unit 110, Surrey, British Columbia V3S 6K3, Canada",
      "buyerPhone": "+16045308979",
      "countryOrigin": "INDIA",
      "countryDestination": "CANADA" (extract from address),
      "portOfLoading": "NHAVA SHEVA",
      "portOfDischarge": "VANCOUVER" (guess from destination country),
      "termsOfDelivery": "CNF" or "FOB",
      "currency": "USD",
      "exchangeRate": 84.50,
      "totalBoxes": 1 (from "1 BOX" or "2 BOXES" in total row),
      "items": [
        {"description": "NUTMEG OIL", "hsnCode": "33012990", "qtyKgs": 5, "pcs": 1, "rateUSD": 240, "boxNumber": 1},
        {"description": "MANDARIN OIL", "hsnCode": "33012990", "qtyKgs": 0.2, "pcs": 1, "rateUSD": 320, "boxNumber": 1},
        {"description": "CARROT SEED OIL", "hsnCode": "33012990", "qtyKgs": 5, "pcs": 1, "rateUSD": 355, "boxNumber": 2}
      ]
    }

    🚨 CRITICAL REMINDERS:
    1. Extract EVERY item row from EVERY table - don't stop early
    2. Parse "5 kg" as qtyKgs: 5, "200 ml" as qtyKgs: 0.2, "$240.00" as rateUSD: 240
    3. "totalBoxes" = number of SHIPPING BOXES (look for "1 BOX" or "2 BOXES"), NOT count of items
    4. Extract "boxNumber" for each item if a box/container column exists (1, 2, 3...)
    5. Extract "adCode" from exporter section if present
    6. If multiple customers, combine ALL items into one items array
    7. Return ONLY valid JSON - no markdown, no explanations

    Extract now:`;

    console.log('Sending to Gemini AI...');
    const response = await generateWithGemini(prompt);
    const cleanedResponse = cleanJSONResponse(response);

    let extractedData: ExtractedData;
    
    try {
      const parsedResponse = JSON.parse(cleanedResponse);
      
      if (parsedResponse.invoiceDetails || parsedResponse.exporterDetails) {
        console.log('⚠️ Detected nested structure, flattening...');
        
        extractedData = {
          ...(parsedResponse.invoiceDetails || {}),
          ...(parsedResponse.exporterDetails || {}),
          ...(parsedResponse.consigneeDetails || {}),
          ...(parsedResponse.buyerDetails || {}),
          ...(parsedResponse.shippingDetails || parsedResponse.shipping || {}),
          ...(parsedResponse.financialDetails || parsedResponse.financial || {}),
          items: parsedResponse.items || [],
          ...parsedResponse
        };
      } else {
        extractedData = parsedResponse;
      }
      
      console.log('📋 Extracted fields:', {
        invoiceNumber: extractedData.invoiceNumber,
        exporterName: extractedData.exporterName,
        exporterGSTIN: extractedData.exporterGSTIN,
        adCode: extractedData.adCode, // ADDED
        consigneeName: extractedData.consigneeName,
        itemsCount: extractedData.items?.length || 0,
        totalBoxes: extractedData.totalBoxes, // ADDED
        itemsWithBoxNumbers: extractedData.items?.filter(item => item.boxNumber).length || 0, // ADDED
      });
      
    } catch (parseError) {
      console.error('JSON parse error. Attempting recovery...');
      
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          extractedData = {
            ...(parsedResponse.invoiceDetails || {}),
            ...(parsedResponse.exporterDetails || {}),
            ...(parsedResponse.consigneeDetails || {}),
            ...(parsedResponse.buyerDetails || {}),
            ...(parsedResponse.shippingDetails || parsedResponse.shipping || {}),
            ...(parsedResponse.financialDetails || parsedResponse.financial || {}),
            items: parsedResponse.items || [],
            ...parsedResponse
          };
        } catch {
          throw new Error('Could not parse AI response.');
        }
      } else {
        throw new Error('AI did not return valid JSON.');
      }
    }

    if (!extractedData.invoiceNumber && !extractedData.exporterName && !extractedData.items?.length) {
      console.warn('No meaningful data extracted');
      return null;
    }

    if (!extractedData.invoiceType) {
      extractedData.invoiceType = 'IGST';
    }

    // Update the item processing section (around line 275):
    if (extractedData.items && extractedData.items.length > 0) {
      extractedData.items = extractedData.items.map((item, index) => {
        const qtyKgs = Number(item.qtyKgs) || 0;
        const pcs = Number(item.pcs) || 0;
        const rateUSD = Number(item.rateUSD) || 0;
        const boxNumber = item.boxNumber ? Number(item.boxNumber) : undefined; // ADDED: Handle box number
        
        let finalPcs = pcs;
        let finalRate = rateUSD;
        
        if (pcs > rateUSD && rateUSD > 0 && rateUSD < 10) {
          console.warn(`Item ${index + 1}: Swapping pcs:${pcs} with rate:${rateUSD}`);
          finalPcs = rateUSD;
          finalRate = pcs;
        }
        
        // ADDED: Validate box number
        let validBoxNumber = boxNumber;
        if (boxNumber && extractedData.totalBoxes) {
          if (boxNumber < 1 || boxNumber > extractedData.totalBoxes) {
            console.warn(`Item ${index + 1}: Invalid box number ${boxNumber}, setting to undefined`);
            validBoxNumber = undefined;
          }
        }
        
        return {
          description: item.description || `Item ${index + 1}`,
          hsnCode: item.hsnCode || '33012990',
          qtyKgs: qtyKgs,
          pcs: Math.round(finalPcs),
          rateUSD: finalRate,
          batchNumber: item.batchNumber, // Preserve if present
          mfgDate: item.mfgDate, // Preserve if present
          expDate: item.expDate, // Preserve if present
          botanicalName: item.botanicalName, // Preserve if present
          boxNumber: validBoxNumber, // ADDED: Include validated box number
        };
      });
    }


    if (extractedData.exporterPhone) {
      extractedData.exporterPhone = extractedData.exporterPhone.replace(/\s+/g, ' ').trim();
    }
    if (extractedData.consigneePhone) {
      extractedData.consigneePhone = extractedData.consigneePhone.replace(/\s+/g, ' ').trim();
    }
    if (extractedData.buyerPhone) {
      extractedData.buyerPhone = extractedData.buyerPhone.replace(/\s+/g, ' ').trim();
    }

    if (extractedData.exchangeRate) {
      extractedData.exchangeRate = Number(extractedData.exchangeRate);
    }

    if (extractedData.totalBoxes && extractedData.totalBoxes > 1 && extractedData.items) {
      const itemsWithoutBoxes = extractedData.items.filter(item => !item.boxNumber);
      
      if (itemsWithoutBoxes.length > 0) {
        console.log(`🔧 Auto-assigning box numbers for ${itemsWithoutBoxes.length} items across ${extractedData.totalBoxes} boxes`);
        
        // Simple distribution: divide items evenly across boxes
        itemsWithoutBoxes.forEach((item, index) => {
          const boxNumber = (index % extractedData.totalBoxes!) + 1;
          item.boxNumber = boxNumber;
          console.log(`📦 Item "${item.description}" assigned to Box ${boxNumber}`);
        });
        
        console.log('✅ Box assignment complete');
      }
    }

    console.log('✅ Extraction complete');
    console.log('Invoice type:', extractedData.invoiceType);
    console.log('Items count:', extractedData.items?.length || 0);
    
    return extractedData;

  } catch (error) {
    const err = error as Error;
    console.error('Excel extraction error:', err.message);
    throw new Error(`Failed to extract data: ${err.message}`);
  }
}


  