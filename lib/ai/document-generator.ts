import { generateWithGemini } from './gemini-client';
import { DocumentData, InvoiceItem } from '../types';

export async function generateCOA(item: InvoiceItem, exporterName: string): Promise<string> {
  const prompt = `Generate a professional Certificate of Analysis (COA) for an export invoice.

PRODUCT DETAILS:
- Product Name: ${item.description}
- Botanical Name: ${item.botanicalName || 'N/A'}
- Batch Number: ${item.batchNumber}
- Manufacturing Date: ${item.mfgDate}
- Expiry Date: ${item.expDate}
- Quantity: ${item.qtyKgs} kg (${item.pcs} pieces)

COMPANY: ${exporterName}

Generate a detailed COA with the following sections:
1. Product Identification
2. Physical & Chemical Properties (appearance, color, odor, specific gravity, refractive index)
3. Purity Analysis (min 95% for essential oils)
4. Contaminant Testing (heavy metals, pesticides)
5. Microbiological Testing
6. Conclusion (Conforms to standards)

Format as professional certificate text (300-400 words).
Include realistic technical values.
End with: "This certifies that the above product meets the quality standards for export."

Return ONLY the certificate text, no markdown formatting.`;

  try {
    const response = await generateWithGemini(prompt);
    return response.trim();
  } catch (error) {
    console.error('COA generation error:', error);
    return `CERTIFICATE OF ANALYSIS\n\nProduct: ${item.description}\nBatch: ${item.batchNumber}\nMfg Date: ${item.mfgDate}\nExp Date: ${item.expDate}\n\nThis product has been tested and meets quality standards for export.\n\nCertified by ${exporterName}`;
  }
}

export async function generateMSDS(item: InvoiceItem, exporterName: string): Promise<string> {
  const prompt = `Generate a Material Safety Data Sheet (MSDS) summary for an export invoice.

PRODUCT DETAILS:
- Product Name: ${item.description}
- Botanical Name: ${item.botanicalName || 'N/A'}
- Chemical Type: Essential Oil / Natural Extract

Generate an MSDS summary with these sections:
1. IDENTIFICATION
   - Product Name
   - Botanical Name
   - Recommended Use

2. HAZARD IDENTIFICATION
   - Classification (e.g., Skin Sensitizer Category 1B)
   - Signal Word: Warning
   - Hazard Statements

3. COMPOSITION
   - Main Chemical Components

4. FIRST AID MEASURES
   - Eye Contact
   - Skin Contact
   - Ingestion
   - Inhalation

5. HANDLING & STORAGE
   - Precautions for safe handling
   - Storage conditions

6. PHYSICAL & CHEMICAL PROPERTIES
   - Appearance
   - Odor
   - Flash Point
   - Specific Gravity

Format as professional MSDS summary (400-500 words).
Use realistic safety information for essential oils.
Include all GHS safety statements.

Return ONLY the MSDS text, no markdown formatting.`;

  try {
    const response = await generateWithGemini(prompt);
    return response.trim();
  } catch (error) {
    console.error('MSDS generation error:', error);
    return `MATERIAL SAFETY DATA SHEET\n\nProduct: ${item.description}\nBotanical: ${item.botanicalName}\n\n1. IDENTIFICATION\nProduct: ${item.description}\nUse: Essential Oil for external use\n\n2. HAZARDS\nWarning: May cause skin sensitization. Keep out of reach of children.\n\n3. FIRST AID\nEye Contact: Rinse with water for 15 minutes.\nSkin Contact: Wash with soap and water.\nIngestion: Do not induce vomiting. Seek medical attention.\n\n4. HANDLING & STORAGE\nStore in cool, dry place away from heat and sunlight.\n\nSupplier: ${exporterName}`;
  }
}

export async function generateAllDocuments(items: InvoiceItem[], exporterName: string): Promise<Record<string, DocumentData>> {
  const documents: Record<string, DocumentData> = {};
  
  // Generate documents for each item in parallel
  const promises = items.map(async (item) => {
    const [coa, msds] = await Promise.all([
      generateCOA(item, exporterName),
      generateMSDS(item, exporterName)
    ]);
    
    documents[item.description] = { coa, msds };
  });
  
  await Promise.all(promises);
  
  return documents;
}
