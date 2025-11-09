import { generateWithGemini, cleanJSONResponse } from './gemini-client';

interface ExtractedData {
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
  
  invoiceType?: 'IGST' | 'LUT';
  productDescription?: string;
  
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

export async function extractDataFromText(inputText: string): Promise<ExtractedData | null> {
  if (!inputText || inputText.trim().length === 0) {
    throw new Error('Input text is empty');
  }

const prompt = `You are an expert invoice data extraction AI. Extract ALL invoice/order data from the following text input intelligently.

  🔍 EXTRACTION RULES:
  1. Identify invoice/order numbers, dates, and customer details
  2. Extract consignee (ship-to) and buyer (bill-to) information ONLY if explicitly present
  3. Extract shipping details (ports, countries, terms of delivery)
  4. Extract ALL items with descriptions, HSN codes, quantities, pieces, and rates
  5. Extract financial information (currency, exchange rate, totals, shipping costs)
  6. DO NOT extract any exporter-related fields
  7. DO NOT include placeholder text - only extract actual data from input

  📋 TEXT INPUT:
  ${inputText}

  🎯 Return FLAT JSON in this EXACT format (NO EXPORTER FIELDS):
  {
    "invoiceNumber": extracted invoice number or omit if not found,
    "invoiceDate": "2025-11-08" (YYYY-MM-DD format, use today if missing),
    "buyerOrderNo": extracted order number or omit if not found,
    "buyerOrderDate": "2025-11-08" (YYYY-MM-DD format, same as invoice date if missing),
    "invoiceType": "LUT" or "IGST" (default to "IGST" if not specified),
    "consigneeName": ONLY if explicitly found, otherwise OMIT entirely,
    "consigneeAddress": ONLY if explicitly found, otherwise OMIT entirely,
    "consigneePhone": ONLY if explicitly found, otherwise OMIT entirely,
    "buyerName": ONLY if explicitly found, otherwise OMIT entirely,
    "buyerAddress": ONLY if explicitly found, otherwise OMIT entirely,
    "buyerPhone": ONLY if explicitly found, otherwise OMIT entirely,
    "countryOrigin": "INDIA" (default) or extracted,
    "countryDestination": extracted from consignee/buyer address ONLY if available, otherwise OMIT,
    "portOfLoading": "NEW DELHI" or "MUMBAI" (default to "NEW DELHI" if not specified),
    "portOfDischarge": extracted if mentioned OR guessed from destination country ONLY if destination is known, otherwise OMIT,
    "termsOfDelivery": "CNF" or "FOB" or "CIF" (default to "CNF" if not specified),
    "currency": "USD" (default) or extracted,
    "exchangeRate": 84.50 (default) or extracted number,
    "totalBoxes": ONLY if explicitly mentioned in text (e.g. "Total Boxes: 5", "No. of Boxes: 3"), otherwise OMIT this field entirely,
    "shippingCost": 0 (extracted or default to 0),
    "productDescription": extracted product category ONLY if mentioned, otherwise OMIT,
    "items": [
      {
        "description": "LAVENDER ESSENTIAL OIL",
        "hsnCode": "33012990" (use this default if not specified),
        "qtyKgs": 5.0 (weight in kilograms - parse from "5 kg", "5kg", "200 ml" as 0.2, "500ml" as 0.5, "Size: 5kg"),
        "pcs": 1 (number of pieces),
        "rateUSD": 240.00 (price per unit in specified currency),
        "boxNumber": extracted ONLY if mentioned, otherwise OMIT,
        "batchNumber": extracted ONLY if mentioned, otherwise OMIT,
        "mfgDate": extracted ONLY if mentioned (YYYY-MM-DD format), otherwise OMIT,
        "expDate": extracted ONLY if mentioned (YYYY-MM-DD format), otherwise OMIT,
        "botanicalName": extracted ONLY if mentioned, otherwise OMIT
      }
    ]
  }

  ⚠️ QUANTITY PARSING RULES (parse from QTY/Size/Quantity columns):
  - Look for quantity in columns labeled: "QTY", "Qty", "Size", "Quantity", "Weight", "Volume"
  - "5 kg" or "5kg" or "5 KG" or "5 KGS" → qtyKgs: 5.0
  - "200 ml" or "200ml" or "200 ML" → qtyKgs: 0.2 (convert ml to kg: divide by 1000)
  - "500 ml" → qtyKgs: 0.5
  - "1000 ml" or "1 L" or "1L" → qtyKgs: 1.0
  - "2.5 kg" → qtyKgs: 2.5
  - "Size: 5kg" or "QTY: 5 kg" or "Quantity: 5kg" → qtyKgs: 5.0
  - If just a number like "5" or "10" without unit, treat as kilograms

  📦 TOTAL BOXES RULE:
  - Include "totalBoxes" field ONLY if the input text explicitly mentions it
  - Examples of explicit mentions: "Total Boxes: 5", "No. of Boxes: 3", "Boxes: 2"
  - If totalBoxes is NOT explicitly mentioned in the text, DO NOT include this field in the output JSON
  - DO NOT calculate or infer totalBoxes from the number of items

  🚨 ABSOLUTE RULES:
  1. DO NOT extract or include ANY of these fields: exporterName, exporterAddress, exporterPhone, exporterFax, exporterGSTIN, exporterIEC, exporterBank, exporterAccount, adCode
  2. These exporter fields must NOT appear in the output JSON at all
  3. Extract EVERY item mentioned in the text
  4. Parse quantities from "QTY", "Size", "Quantity" columns - handle both KG and ML units
  5. Convert ml to kg by dividing by 1000 (200ml = 0.2kg, 500ml = 0.5kg, 1000ml = 1kg)
  6. Parse rates correctly - "$240" or "240 USD" → rateUSD: 240.0
  7. Use default HSN code "33012990" if not specified for essential oils/aroma chemicals
  8. Dates should be in YYYY-MM-DD format
  9. Phone numbers should include country code if found
  10. Return ONLY valid JSON - no markdown, no explanations, no code blocks
  11. NEVER include placeholder values like "Customer Company Name", "Full shipping address", etc.
  12. If a field is not found in the text and has no default value specified, OMIT it from the JSON entirely
  13. For consigneeName, consigneeAddress, consigneePhone, buyerName, buyerAddress, buyerPhone: include them ONLY when actual data is explicitly found in the input text
  14. If consignee details are not present, do NOT include any consignee* fields in the output
  15. If buyer details are not present, do NOT include any buyer* fields in the output
  16. For totalBoxes: include ONLY if explicitly written in the input text - DO NOT calculate or infer from item count

  Extract now:`;

  try {
    console.log('📝 Extracting data from text input...');
    console.log('📏 Input text length:', inputText.length);
    
    const response = await generateWithGemini(prompt);
    
    // Check if response is empty
    if (!response || response.trim().length === 0) {
      throw new Error('Gemini API returned an empty response. Please check your API key and try again.');
    }
    
    console.log('🔍 Raw Gemini response length:', response.length);
    console.log('🔍 Raw Gemini response (first 500 chars):', response.substring(0, 500));
    
    let cleanedResponse = cleanJSONResponse(response);
    
    // Check if cleaned response is empty
    if (!cleanedResponse || cleanedResponse.trim().length === 0) {
      console.error('❌ Cleaned response is empty. Raw response:', response);
      throw new Error('Failed to extract JSON from AI response. The response may be blocked or invalid.');
    }
    
    console.log('🔍 Cleaned response length:', cleanedResponse.length);
    console.log('🔍 Cleaned response (first 500 chars):', cleanedResponse.substring(0, 500));

    let extractedData: ExtractedData;
    
    try {
      // Check if JSON appears to be truncated and attempt to repair it
      let responseToParse = cleanedResponse;
      const openBraces = (cleanedResponse.match(/\{/g) || []).length;
      const closeBraces = (cleanedResponse.match(/\}/g) || []).length;
      
      if (openBraces > closeBraces) {
        console.warn('⚠️ JSON appears to be truncated (unmatched braces). Attempting to repair...');
        
        // Check if we're in the middle of a string (unclosed quote)
        let inString = false;
        let escapeNext = false;
        let lastQuoteIndex = -1;
        
        for (let i = 0; i < cleanedResponse.length; i++) {
          const char = cleanedResponse[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            if (inString) {
              lastQuoteIndex = i;
            }
          }
        }
        
        // If we're in the middle of a string, remove the incomplete field
        if (inString && lastQuoteIndex >= 0) {
          // Find the start of this incomplete field (look for the key name)
          let fieldStart = lastQuoteIndex;
          // Go backwards to find the key (": " or ,"key": " or {"key": ")
          for (let i = lastQuoteIndex - 1; i >= 0; i--) {
            if (cleanedResponse[i] === ':' && i + 1 < cleanedResponse.length && cleanedResponse[i + 1] === ' ') {
              // Found the colon, now find the key start
              for (let j = i - 1; j >= 0; j--) {
                if (cleanedResponse[j] === '"') {
                  // Check if this is the start of a key (has " before it or is at start/after comma/brace)
                  const beforeKey = j > 0 ? cleanedResponse[j - 1] : ' ';
                  if (beforeKey === ' ' || beforeKey === ',' || beforeKey === '{' || beforeKey === '\n') {
                    fieldStart = j;
                    // Remove this incomplete field
                    if (j > 0 && cleanedResponse[j - 1] === ',') {
                      responseToParse = cleanedResponse.substring(0, j - 1);
                    } else {
                      responseToParse = cleanedResponse.substring(0, j);
                    }
                    break;
                  }
                }
              }
              break;
            }
          }
        } else {
          // Not in a string, just remove trailing comma if present
          const trimmed = cleanedResponse.trim();
          if (trimmed.endsWith(',')) {
            responseToParse = trimmed.slice(0, -1);
          }
        }
        
        // Recalculate braces after removing incomplete content
        const finalOpenBraces = (responseToParse.match(/\{/g) || []).length;
        const finalCloseBraces = (responseToParse.match(/\}/g) || []).length;
        const finalOpenBrackets = (responseToParse.match(/\[/g) || []).length;
        const finalCloseBrackets = (responseToParse.match(/\]/g) || []).length;
        
        // Close arrays first, then objects
        const missingBrackets = finalOpenBrackets - finalCloseBrackets;
        if (missingBrackets > 0) {
          responseToParse += '\n' + ']'.repeat(missingBrackets);
        }
        
        const missingBraces = finalOpenBraces - finalCloseBraces;
        if (missingBraces > 0) {
          responseToParse += '\n' + '}'.repeat(missingBraces);
        }
        
        console.log('🔧 Repaired JSON length:', responseToParse.length);
        cleanedResponse = responseToParse;
      }
      
      const parsedResponse = JSON.parse(cleanedResponse);
      
      // Handle nested structures if present
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
      
      // Validate and set defaults
      if (!extractedData.items || extractedData.items.length === 0) {
        console.warn('⚠️ No items found in extraction');
      }
      
      // Ensure dates are in correct format
      if (extractedData.invoiceDate && !extractedData.invoiceDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try to parse and reformat
        const date = new Date(extractedData.invoiceDate);
        if (!isNaN(date.getTime())) {
          extractedData.invoiceDate = date.toISOString().split('T')[0];
        } else {
          extractedData.invoiceDate = new Date().toISOString().split('T')[0];
        }
      }
      
      if (!extractedData.invoiceDate) {
        extractedData.invoiceDate = new Date().toISOString().split('T')[0];
      }
      
      if (!extractedData.buyerOrderDate) {
        extractedData.buyerOrderDate = extractedData.invoiceDate;
      }
      
      // Set defaults for missing fields
      if (!extractedData.countryOrigin) extractedData.countryOrigin = 'INDIA';
      if (!extractedData.portOfLoading) extractedData.portOfLoading = 'NEW DELHI';
      if (!extractedData.termsOfDelivery) extractedData.termsOfDelivery = 'CNF';
      if (!extractedData.currency) extractedData.currency = 'USD';
      if (!extractedData.exchangeRate) extractedData.exchangeRate = 84.50;
      if (!extractedData.invoiceType) extractedData.invoiceType = 'IGST';
      if (!extractedData.totalBoxes) extractedData.totalBoxes = 1;
      if (!extractedData.shippingCost) extractedData.shippingCost = 0;
      
      // Default HSN codes for items if missing
      if (extractedData.items) {
        extractedData.items = extractedData.items.map(item => ({
          ...item,
          hsnCode: item.hsnCode || '33012990',
          qtyKgs: item.qtyKgs || 0,
          pcs: item.pcs || 1,
          rateUSD: item.rateUSD || 0,
        }));
      }
      
      console.log('✅ Extracted fields:', {
        invoiceNumber: extractedData.invoiceNumber,
        exporterName: extractedData.exporterName,
        consigneeName: extractedData.consigneeName,
        itemsCount: extractedData.items?.length || 0,
      });
      
      return extractedData;
      
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw response:', cleanedResponse);
      throw new Error('Failed to parse AI response. Please check the input text format.');
    }
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ Text extraction error:', err);
    throw err;
  }
}

