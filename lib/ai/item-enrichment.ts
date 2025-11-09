import { generateWithGemini, cleanJSONResponse } from './gemini-client';
import { ItemEnrichment } from '../types';

export async function enrichItemWithAI(itemName: string, itemType: string = 'essential oil'): Promise<ItemEnrichment> {
  const prompt = `You are an expert in essential oils and botanical products. Generate product manufacturing details for an export invoice.

Product Name: ${itemName}
Product Type: ${itemType}

Generate REALISTIC and ACCURATE manufacturing details in JSON format:
{
  "batchNumber": "Generate a realistic batch number in format: YYYY-MM-XXXXX where XXXXX is a 5-digit number",
  "mfgDate": "Manufacturing date in DD-MM-YYYY format, should be within last 1-3 months from today (Oct 2025)",
  "expDate": "Expiry date in DD-MM-YYYY format, should be 2-3 years from manufacturing date for essential oils",
  "botanicalName": "The correct botanical/scientific name (genus species) for this essential oil or product"
}

IMPORTANT RULES:
1. Batch number format: 2025-10-XXXXX or 2025-09-XXXXX
2. Manufacturing date should be recent (within last 3 months)
3. Expiry should be realistic for the product type (essential oils: 2-3 years, dried products: 1-2 years)
4. Botanical name must be scientifically accurate (e.g., Mentha piperita for Peppermint)

Return ONLY valid JSON, no markdown formatting, no explanation.`;

  try {
    const response = await generateWithGemini(prompt);
    const cleanedResponse = cleanJSONResponse(response);
    const enrichment: ItemEnrichment = JSON.parse(cleanedResponse);
    
    // Validate the response
    if (!enrichment.batchNumber || !enrichment.mfgDate || !enrichment.expDate || !enrichment.botanicalName) {
      throw new Error('Incomplete enrichment data from AI');
    }
    
    return enrichment;
  } catch (error) {
    console.error('Item enrichment error:', error);
    
    // Fallback to default values
    const today = new Date();
    const mfgDate = new Date(today);
    mfgDate.setMonth(mfgDate.getMonth() - 2); // 2 months ago
    
    const expDate = new Date(mfgDate);
    expDate.setFullYear(expDate.getFullYear() + 2); // 2 years shelf life
    
    return {
      batchNumber: `2025-${String(today.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 90000) + 10000}`,
      mfgDate: formatDate(mfgDate),
      expDate: formatDate(expDate),
      botanicalName: itemName
    };
  }
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
