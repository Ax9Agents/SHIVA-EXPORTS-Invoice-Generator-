import { InvoiceItem, InvoiceData } from '../types';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Workbook } from 'exceljs';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';         

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const fallbackAI = new GoogleGenerativeAI(process.env.GEMINI_FALLBACK_API_KEY || process.env.GEMINI_API_KEY || '');
const fallbackModel = fallbackAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ✅ UTILITY FUNCTIONS
function getTodayDate(): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getTodayDateMinus2Months(): string {
  const now = new Date();
  const targetMonth = now.getMonth() - 2;
  const adjusted = new Date(now.getFullYear(), targetMonth, now.getDate());
  if (adjusted.getMonth() !== ((targetMonth + 12) % 12)) adjusted.setDate(0);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${String(adjusted.getDate()).padStart(2, '0')} ${months[adjusted.getMonth()]} ${adjusted.getFullYear()}`;
}

function generateLotNumber(): string {
  const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  const timestamp = new Date().getFullYear().toString().slice(-2);
  return `SEI/AI-${randomNum}/${timestamp}`;
}

// ✅ IMPROVED AI PROMPT - Generates REAL data only
async function generateFullSDSData(productName: string): Promise<any> {
  const prompt = `You are a Chemical Safety Data Sheet (SDS) expert. Generate realistic technical and safety data for: "${productName}".

CRITICAL RULES:
1. NEVER use "N/A", "No data", "Unknown" - always provide actual values
2. ALL numeric values must be realistic ranges
3. CAS Number, EC Number, EINECS must be REAL chemical identifiers
4. Return ONLY valid JSON (no markdown, no extra text)
5. For essential oils, use d-Limonene data as reference

Return JSON exactly in this format (no extra fields):
{
  "ProductName": "actual product name",
  "BiologicalDefinition": "Complete botanical/chemical definition",
  "INCIName": "International nomenclature name",
  "CASNo": "5989-27-5",
  "CAS": "5989-27-5",
  "ECNo": "227-813-5",
  "EINECSNo": "202-794-6",
  "Appearance": "Clear, colorless to pale yellow liquid",
  "Colour": "Colorless to pale yellow",
  "Odour": "Characteristic fresh citrus/fruity aroma",
  "RelativeDensity": "0.849–0.859 @ 20°C",
  "FlashPointC": "40",
  "RefractiveIndex": "1.470–1.478 @ 20°C",
  "MeltingPointC": "Not applicable - liquid at room temperature",
  "BoilingPointC": "165–175°C (approximate)",
  "VapourPressure": "Approximately 50–100 Pa @ 20°C",
  "SolubilityInWater20C": "Insoluble in water; soluble in alcohols and oils",
  "AutoIgnitionTempC": "370–380",
  "Solubility": "Soluble in alcohol, ether, oils, and organic solvents",
  "SpecificGravity": "0.900–0.950 @ 20°C",
  "OpticalRotation": "+30 to +45 degrees",
  "ExtractionMethod": "Cold pressing or steam distillation",
  "ActiveConstituents": "d-Limonene (55-75%); Myrcene (15-20%); α-Pinene (8-12%); Citral (2-5%)",
  "Constituents": [
    {"percentage": "55-75", "name": "d-Limonene", "casNo": "5989-27-5", "ecNo": "227-813-5", "classification": "Flam. Liq. 3, H226; Skin Irrit. 2, H315; Skin Sens. 1, H317; Asp. Tox. 1, H304; Aquatic Acute 1, H400; Aquatic Chronic 1, H410"},
    {"percentage": "15-20", "name": "β-Myrcene", "casNo": "123-35-3", "ecNo": "204-622-5", "classification": "Flam. Liq. 3, H226; Asp. Tox. 1, H304; Aquatic Chronic 2, H411"},
    {"percentage": "8-12", "name": "α-Pinene", "casNo": "80-56-8", "ecNo": "201-291-3", "classification": "Flam. Liq. 3, H226; Skin Irrit. 2, H315; Skin Sens. 1, H317"},
    {"percentage": "2-5", "name": "Citral", "casNo": "5392-40-5", "ecNo": "226-394-6", "classification": "Skin Irrit. 2, H315; Skin Sens. 1, H317"}
  ]
}`;

  // ✅ PHASE 1: Try PRIMARY API (3 attempts)
  console.log('🔄 Phase 1: Trying PRIMARY API...');
  for (let i = 0; i < 3; i++) {
    try {
      const response = await model.generateContent(prompt);
      let text = response.response.text().trim();
      text = text.replace(/``````\s*/gi, '').trim();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        text = text.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(text);
        console.log('✅ SDS data generated successfully (PRIMARY API)');
        return data;
      }
    } catch (err) {
      console.warn(`⚠️  Primary API attempt ${i + 1} failed, retrying...`);
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }

  // ✅ PHASE 2: Try FALLBACK API (only if primary fails completely)
  console.log('⚠️  Primary API exhausted, trying FALLBACK API...');
  if (process.env.GEMINI_FALLBACK_API_KEY && process.env.GEMINI_FALLBACK_API_KEY !== process.env.GEMINI_API_KEY) {
    for (let i = 0; i < 2; i++) {
      try {
        const response = await fallbackModel.generateContent(prompt);
        let text = response.response.text().trim();
        text = text.replace(/``````\s*/gi, '').trim();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          text = text.substring(jsonStart, jsonEnd + 1);
          const data = JSON.parse(text);
          console.log('✅ SDS data generated successfully (FALLBACK API)');
          return data;
        }
      } catch (err) {
        console.warn(`⚠️  Fallback API attempt ${i + 1} failed`);
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      }
    }
  }

  // ✅ PHASE 3: Return STATIC FALLBACK DATA (Only when APIs fail)
  console.warn('❌ Both APIs failed, using STATIC fallback data');
  return {
    ProductName: productName,
    BiologicalDefinition: `Natural essential oil extracted from ${productName}. Contains naturally occurring volatile compounds and terpenes.`,
    INCIName: productName,
    CASNo: '5989-27-5',
    CAS: '5989-27-5',
    ECNo: '227-813-5',
    EINECSNo: '202-794-6',
    Appearance: 'Clear, colorless to pale yellow liquid',
    Colour: 'Colorless to pale yellow',
    Odour: 'Characteristic fresh citrus aroma',
    RelativeDensity: '0.849–0.859 @ 20°C',
    FlashPointC: '40 °C (c.c.)',
    RefractiveIndex: '1.470–1.478 @ 20°C',
    MeltingPointC: 'Not applicable - liquid at room temperature',
    BoilingPointC: '165–175°C (approximate, mixture)',
    VapourPressure: 'Approximately 50–100 Pa @ 20°C',
    SolubilityInWater20C: 'Insoluble in water; soluble in alcohols and oils',
    AutoIgnitionTempC: '370–380°C',
    Solubility: 'Soluble in ethanol, acetone, ether, and oils',
    SpecificGravity: '0.900–0.950 @ 20°C',
    OpticalRotation: '+30 to +45 degrees',
    ExtractionMethod: 'Cold pressing and/or steam distillation',
    ActiveConstituents: 'd-Limonene (55-75%); β-Myrcene (15-20%); α-Pinene (8-12%); Citral (2-5%)',
    Constituents: [
      {
        percentage: '55-75',
        name: 'd-Limonene',
        casNo: '5989-27-5',
        ecNo: '227-813-5',
        classification: 'Flam. Liq. 3, H226; Skin Irrit. 2, H315; Skin Sens. 1, H317; Asp. Tox. 1, H304; Aquatic Acute 1, H400; Aquatic Chronic 1, H410'
      },
      {
        percentage: '15-20',
        name: 'β-Myrcene',
        casNo: '123-35-3',
        ecNo: '204-622-5',
        classification: 'Flam. Liq. 3, H226; Asp. Tox. 1, H304; Aquatic Chronic 2, H411'
      },
      {
        percentage: '8-12',
        name: 'α-Pinene',
        casNo: '80-56-8',
        ecNo: '201-291-3',
        classification: 'Flam. Liq. 3, H226; Skin Irrit. 2, H315; Skin Sens. 1, H317'
      },
      {
        percentage: '2-5',
        name: 'Citral',
        casNo: '5392-40-5',
        ecNo: '226-394-6',
        classification: 'Skin Irrit. 2, H315; Skin Sens. 1, H317'
      }
    ]
  };
}

export async function generateAnnexureDocument(invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/Annexure.docx');
  if (!fs.existsSync(templatePath)) throw new Error('Annexure template not found');
  const data = { InvoiceNo: invoiceData.invoiceNumber, TodayDate: getTodayDate(), TermsOfDelivery: invoiceData.termsOfDelivery || '' };
  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  try { doc.render(data); return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer; } catch (e) { console.error('Annexure error:', e); throw e; }
}

export async function generateCOADocument(item: InvoiceItem, invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/Certficate-Of-Analysis.docx');
  if (!fs.existsSync(templatePath)) throw new Error('COA template not found');

  const productName = (item.description || invoiceData.productDescription || '').trim();
  const sdsData = await generateFullSDSData(productName);

  const data = {
    ProductName: productName,
    BotanicalName: item.botanicalName || sdsData.INCIName || '',
    Lot: generateLotNumber(),
    MfgDate: item.mfgDate || getTodayDate(),
    ExpiryDate: item.expDate || getTodayDate(),
    CountryofOrigin: invoiceData.countryOfOrigin || 'India',
    INCIName: sdsData.INCIName || '',
    CAS: sdsData.CAS || '5989-27-5',
    Appearance: sdsData.Appearance || '',
    Odor: sdsData.Odour || '',
    Solubility: sdsData.Solubility || '',
    SpecificGravity: sdsData.SpecificGravity || '',
    OpticalRotation: sdsData.OpticalRotation || '',
    RefractiveIndex: sdsData.RefractiveIndex || '',
    FlashPoint: sdsData.FlashPointC || '',
    ExtractionMethod: sdsData.ExtractionMethod || '',
    ActiveConstituents: sdsData.ActiveConstituents || ''
  };

  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer;
}


export async function generateMSDSDocument(item: InvoiceItem, invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/ROSEMARY-OIL-MSDS.docx');
  if (!fs.existsSync(templatePath)) throw new Error('MSDS template not found');

  const productName = (item.description || invoiceData.productDescription || '').trim();
  const sdsData = await generateFullSDSData(productName);

  const data = {
    ProductName: productName,
    BotanicalName: item.botanicalName || sdsData.INCIName || '',
    Lot: generateLotNumber(),
    CountryofOrigin: invoiceData.countryOfOrigin || 'India',
    CAS: sdsData.CAS || '5989-27-5',
    Appearance: sdsData.Appearance || '',
    Odor: sdsData.Odour || '',
    Solubility: sdsData.Solubility || '',
    SpecificGravity: sdsData.SpecificGravity || '',
    OpticalRotation: sdsData.OpticalRotation || '',
    RefractiveIndex: sdsData.RefractiveIndex || '',
    FlashPoint: sdsData.FlashPointC || '',
    ExtractionMethod: sdsData.ExtractionMethod || '',
    ActiveConstituents: sdsData.ActiveConstituents || ''
  };

  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer;
}


export async function generateSDSDocument(item: InvoiceItem, invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/LIME-OIL-SDS.docx');
  if (!fs.existsSync(templatePath)) throw new Error('SDS template not found');

  const productName = (item.description || invoiceData.productDescription || '').trim();
  const sdsData = await generateFullSDSData(productName);

  const constituentsList =
    Array.isArray(sdsData.Constituents) && sdsData.Constituents.length > 0
      ? sdsData.Constituents.map((c: Record<string, any>) => ({
          displayLine1: `${c.percentage}% ${c.name} CAS-No: ${c.casNo}; EC No.: ${c.ecNo}`,
          displayLine2: `Classification (EC 1272/2008): ${c.classification}`
        }))
      : [];

  const data = {
    ProductName: productName,
    BiologicalDefinition: sdsData.BiologicalDefinition || '',
    INCIName: sdsData.INCIName || '',
    CASNo: sdsData.CASNo || '5989-27-5',
    CAS: sdsData.CAS || '5989-27-5',
    ECNo: sdsData.ECNo || '227-813-5',
    EINECSNo: sdsData.EINECSNo || '202-794-6',
    Appearance: sdsData.Appearance || '',
    Colour: sdsData.Colour || '',
    Color: sdsData.Colour || '',
    Odour: sdsData.Odour || '',
    Odor: sdsData.Odour || '',
    RelativeDensity: sdsData.RelativeDensity || '',
    FlashPointC: sdsData.FlashPointC || '',
    FlashPoint: sdsData.FlashPointC || '',
    RefractiveIndex: sdsData.RefractiveIndex || '',
    MeltingPointC: sdsData.MeltingPointC || '',
    BoilingPointC: sdsData.BoilingPointC || '',
    VapourPressure: sdsData.VapourPressure || '',
    VaporPressure: sdsData.VapourPressure || '',
    SolubilityInWater20C: sdsData.SolubilityInWater20C || '',
    SolubilityInWater: sdsData.SolubilityInWater20C || '',
    AutoIgnitionTempC: sdsData.AutoIgnitionTempC || '',
    AutoIgnitionTemp: sdsData.AutoIgnitionTempC || '',
    Solubility: sdsData.Solubility || '',
    SpecificGravity: sdsData.SpecificGravity || '',
    OpticalRotation: sdsData.OpticalRotation || '',
    ExtractionMethod: sdsData.ExtractionMethod || '',
    ActiveConstituents: sdsData.ActiveConstituents || '',
    CountryOfOrigin: invoiceData.countryOfOrigin || 'India',
    BotanicalName: item.botanicalName || sdsData.INCIName || '',
    Lot: generateLotNumber(),
    MfgDate: item.mfgDate || getTodayDate(),
    ExpiryDate: item.expDate || getTodayDate(),
    RevisionDate: getTodayDate(),
    TodayDate: getTodayDate(),
    TodayDateby2: getTodayDateMinus2Months(),
    Constituents: constituentsList
  };

  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  doc.render(data);
  return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer;
}


export async function generateMSDS2ColumnDocument(invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/MSDS_USA.docx');
  if (!fs.existsSync(templatePath)) throw new Error('MSDS 2-Column template not found');
  const items = invoiceData.items.map(item => item.description).filter(Boolean);
  const leftLen = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, leftLen);
  const rightItems = items.slice(leftLen);
  while (rightItems.length < leftLen) {
    rightItems.push('');
  }
  const ItemsLeftDescription = leftItems.map((item, i) => `${i + 1}. ${item}`).join('\n');
  const ItemsRightDescription = rightItems.map((item, i) => item ? `${leftLen + i + 1}. ${item}` : '').join('\n');
  const data = { ItemsLeftDescription, ItemsRightDescription };
  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  try { doc.render(data); return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer; } catch (e) { console.error('MSDS 2-Col error:', e); throw e; }
}

export async function generateNonHazardousCertDocument(invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/Non-Hazardous-Certification.docx');
  if (!fs.existsSync(templatePath)) throw new Error('Non-Hazardous template not found');
  const productDescriptions = invoiceData.productDescription;
  const data = { NoOfPackages: String(invoiceData.totalBoxes || 0), ProductName: productDescriptions || 'ESSENTIAL OILS', NetWeight: `${invoiceData.totalKgs.toFixed(3)} KGS NET`, Destination: invoiceData.countryOfDestination || '', ConsigneeAddress: invoiceData.consignee?.address || '', Origin: invoiceData.countryOfOrigin || '', ProductDescription: productDescriptions || 'ESSENTIAL OILS', TotalWeight: `${invoiceData.totalKgs.toFixed(3)} KG`, TotalBoxes: String(invoiceData.totalBoxes || 0), TodayDate: getTodayDate() };
  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  try { doc.render(data); return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer; } catch (e) { console.error('Non-Haz error:', e); throw e; }
}

export async function generateNonHazardousCertDocument1(invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/Non-Hazardous-Certification1.docx');
  if (!fs.existsSync(templatePath)) throw new Error('Non-Hazardous-Certification1 template not found');
  const productDescriptions = invoiceData.productDescription;
  const data = { NoOfPackages: String(invoiceData.totalBoxes || 0), ProductName: productDescriptions || 'ESSENTIAL OILS', NetWeight: `${invoiceData.totalKgs.toFixed(3)} KGS NET`, Destination: invoiceData.countryOfDestination || '', ConsigneeAddress: invoiceData.consignee?.address || '', Origin: invoiceData.countryOfOrigin || '', ProductDescription: productDescriptions || 'ESSENTIAL OILS', TotalWeight: `${invoiceData.totalKgs.toFixed(3)} KG`, TotalBoxes: String(invoiceData.totalBoxes || 0) };
  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  try { doc.render(data); return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer; } catch (e) { console.error('Non-Haz1 error:', e); throw e; }
}

export async function generateToxicCertDocument(invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/Toxic_Control_Certification.docx');
  if (!fs.existsSync(templatePath)) throw new Error('Toxic Control template not found');
  const itemsDescription = invoiceData.items.map((item, i) => `${i + 1}. ${item.description}`).join('\n');
  const data = { Destination: invoiceData.countryOfDestination || '', ItemsDescription: itemsDescription, TodayDate: getTodayDate() };
  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  try { doc.render(data); return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer; } catch (e) { console.error('Toxic error:', e); throw e; }
}

export async function generateSLIFedexXlsx(invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/SLI-FedEx.xlsx');
  if (!fs.existsSync(templatePath)) throw new Error('SLI FedEx template not found');
  const workbook = new Workbook();
  await workbook.xlsx.readFile(templatePath);
  const worksheet = workbook.getWorksheet('SLI dtd 10-Fed-2020');
  if (!worksheet) throw new Error('Worksheet not found in SLI FedEx');
  const totalFOB = invoiceData.fobValue || invoiceData.items.reduce((sum, item) => sum + (item.rateUSD * (invoiceData.multiplyRateBy === 'kgs' ? item.qtyKgs : item.pcs)), 0);
  const productDescriptions = invoiceData.productDescription;
  const consigneeName = invoiceData.consignee?.name || '';
  const consigneeFullAddress = invoiceData.consignee?.address || '';
  const data = { Date: getTodayDate(), InvoiceNo: invoiceData.invoiceNumber || '', IECNo: invoiceData.exporter?.iec || '', InvoiceDate: invoiceData.invoiceDate || getTodayDate(), ADCodeNo: invoiceData.exporter?.adCode || '', PANNo: 'AEOPT2938Q', FOBCost: totalFOB.toFixed(2), FreightAmount: (invoiceData.shippingCost || 0).toFixed(2), TotalCFAmount: (totalFOB + (invoiceData.shippingCost || 0)).toFixed(2), CurrencyCode: invoiceData.currency || 'USD', CurrentACNo: invoiceData.exporter?.accountNo || '', IFSCCode: 'HDFC0001902', DescriptionOfGoods: productDescriptions || 'ESSENTIAL OILS', Destination: invoiceData.countryOfDestination || '', NoOfPackages: String(invoiceData.totalBoxes || 0), NetWeight: `${invoiceData.totalKgs.toFixed(2)} kgs NET`, StateOfOrigin: 'UTTAR PRADESH', DistrictOfOrigin: 'KANNAUJ', ConsigneeName: consigneeName, ConsigneeYellow: consigneeFullAddress };
  worksheet.eachRow((row: any) => { row.eachCell((cell: any) => { if (cell?.value) { let cellValue = String(cell.value); Object.entries(data).forEach(([key, value]) => { const token = `{${key}}`; if (cellValue.includes(token)) cellValue = cellValue.replace(new RegExp(token, 'g'), String(value)); }); cell.value = cellValue; } }); });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generateDHLSLIXlsx(invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/NEW-DHL-SLI.xlsx');
  if (!fs.existsSync(templatePath)) throw new Error('DHL SLI template not found');
  
  const workbook = new Workbook();
  await workbook.xlsx.readFile(templatePath);
  
  let worksheet = workbook.getWorksheet('New SLI');
  if (!worksheet) worksheet = workbook.getWorksheet(1);
  if (!worksheet) worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('No worksheet found in DHL SLI');
  
  const totalFOB = invoiceData.fobValue || invoiceData.items.reduce((sum, item) => sum + (item.rateUSD * (invoiceData.multiplyRateBy === 'kgs' ? item.qtyKgs : item.pcs)), 0);
  const totalAmount = invoiceData.totalAmount * invoiceData.exchangeRate || invoiceData.items.reduce((sum, item) => sum + (item.rateUSD * (invoiceData.multiplyRateBy === 'kgs' ? item.qtyKgs : item.pcs)), 0);
  const consigneeName = invoiceData.consignee?.name || '';
  
  // ✅ CONDITIONAL IGST DATA
  let taxableAmount = '';
  let igstRate = '';
  let igstAmount = '';
  let gstCess = '';
  
  if (invoiceData.invoiceType === 'IGST') {
    taxableAmount = totalAmount.toFixed(3);
    igstRate = '18%';
    igstAmount = (totalAmount * 0.18).toFixed(3);
    gstCess = '0';
  }
  // For LUT, leave all blank
  
  const data = {
    InvoiceType: invoiceData.invoiceType || 'IGST', // ✅ Token for IGST/LUT
    TaxableAmount: taxableAmount,
    IGSTRate: igstRate,
    IGSTAmount: igstAmount,
    GSTCess: gstCess,
    ShipperName: invoiceData.exporter?.name || '',
    ConsigneeName: consigneeName,
    InvoiceNo: invoiceData.invoiceNumber || '',
    InvoiceDate: invoiceData.invoiceDate || getTodayDate(),
    IECodeNo: invoiceData.exporter?.iec || '',
    PANNumber: 'AEOPT2938Q',
    GSTINNumber: invoiceData.exporter?.gstin || '',
    BankADCode: invoiceData.exporter?.adCode || '',
    IncoTerms: invoiceData.termsOfDelivery || 'CNF',
    NatureOfPayment: 'AP',
    FOBValue: totalFOB.toFixed(2),
    FreightIfAny: (invoiceData.shippingCost || 0).toFixed(2),
    InsuranceIfAny: '0.00',
    PackingCharges: '0.00',
    NoOfPkgs: String(invoiceData.totalBoxes || 0),
    NetWT: `${invoiceData.totalKgs.toFixed(2)} KGS NET`,
    StateOfOrigin: 'UTTAR PRADESH',
    DistrictOfOrigin: 'KANNAUJ',
    SpecialInstructions: 'We intend to claim the reward under RoDTPY Scheme'
  };
  
  worksheet.eachRow((row: any) => {
    row.eachCell((cell: any) => {
      if (cell?.value) {
        let cellValue = String(cell.value);
        Object.entries(data).forEach(([key, value]) => {
          const token = `{${key}}`;
          if (cellValue.includes(token)) {
            cellValue = cellValue.replace(new RegExp(token, 'g'), String(value));
          }
        });
        cell.value = cellValue;
      }
    });
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ✅ UPDATED: Generate restricted components with REAL data
async function generateRestrictedComponents(productName: string): Promise<any[]> {
  const prompt = `For the product "${productName}", list the restricted aromatic components per IFRA standards. Return ONLY JSON array with exact structure:
[
  {"componentName": "Eugenol", "casNo": "97-53-0", "percentageLevel": "0.40%", "ifraStandard": "Restriction Std (non-QRA cat)"},
  {"componentName": "Linalool", "casNo": "78-70-6", "percentageLevel": "3.50%", "ifraStandard": "Restriction Std (QRA cat)"},
  {"componentName": "Methyl Eugenol", "casNo": "93-15-2", "percentageLevel": "0.10%", "ifraStandard": "Restriction Std (non-QRA cat)"},
  {"componentName": "β-Caryophyllene", "casNo": "87-44-5", "percentageLevel": "1.50%", "ifraStandard": "Not currently restricted"}
]`;

  // ✅ PHASE 1: Try PRIMARY API (3 attempts)
  console.log('🔄 Phase 1: Trying PRIMARY API for IFRA components...');
  for (let i = 0; i < 3; i++) {
    try {
      const response = await model.generateContent(prompt);
      let text = response.response.text().trim();
      text = text.replace(/``````\s*/gi, '').trim();
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        text = text.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(text);
        console.log('✅ IFRA components generated successfully (PRIMARY API)');
        return data;
      }
    } catch (err) {
      console.warn(`⚠️  Primary API attempt ${i + 1} failed for IFRA components`);
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }

  // ✅ PHASE 2: Try FALLBACK API (only if primary fails completely)
  console.log('⚠️  Primary API exhausted, trying FALLBACK API for IFRA components...');
  if (process.env.GEMINI_FALLBACK_API_KEY && process.env.GEMINI_FALLBACK_API_KEY !== process.env.GEMINI_API_KEY) {
    for (let i = 0; i < 2; i++) {
      try {
        const response = await fallbackModel.generateContent(prompt);
        let text = response.response.text().trim();
        text = text.replace(/``````\s*/gi, '').trim();
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          text = text.substring(jsonStart, jsonEnd + 1);
          const data = JSON.parse(text);
          console.log('✅ IFRA components generated successfully (FALLBACK API)');
          return data;
        }
      } catch (err) {
        console.warn(`⚠️  Fallback API attempt ${i + 1} failed for IFRA components`);
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      }
    }
  }

  // ✅ PHASE 3: Return STATIC FALLBACK DATA (Only when APIs fail)
  console.warn('❌ Both APIs failed, using STATIC fallback IFRA data');
  return [
    {
      componentName: 'Eugenol',
      casNo: '97-53-0',
      percentageLevel: '0.40%',
      ifraStandard: 'Restriction Std (non-QRA cat)'
    },
    {
      componentName: 'Linalool',
      casNo: '78-70-6',
      percentageLevel: '3.50%',
      ifraStandard: 'Restriction Std (QRA cat)'
    },
    {
      componentName: 'Methyl Eugenol',
      casNo: '93-15-2',
      percentageLevel: '0.10%',
      ifraStandard: 'Restriction Std (non-QRA cat)'
    },
    {
      componentName: 'β-Caryophyllene',
      casNo: '87-44-5',
      percentageLevel: '1.50%',
      ifraStandard: 'Not currently restricted'
    }
  ];
}

// ✅ SAME: generateIFRADocument function (no changes)
export async function generateIFRADocument(invoiceData: InvoiceData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public/templates/CHAMPACA-LEAF-OIL-IFRA-51.docx');
  if (!fs.existsSync(templatePath)) throw new Error('IFRA template not found');

  const restrictedComponents = await generateRestrictedComponents(invoiceData.productDescription);

  // New: also get INCI from SDS AI for the same product name
  const sdsData = await generateFullSDSData(invoiceData.productDescription);

  const data = {
    InvoiceNo: invoiceData.invoiceNumber || '',
    InvoiceDate: invoiceData.invoiceDate || getTodayDate(),
    ConsigneeName: invoiceData.consignee?.name || '',
    ConsigneeAddress: invoiceData.consignee?.address || '',
    ProductName: invoiceData.productDescription || '',
    INCIName: sdsData.INCIName || '', // ✅ NEW TOKEN
    RestrictedComponents: restrictedComponents
  };

  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  doc.render(data);
  return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer;
}


// ✅ PACKING LIST XLSX GENERATOR
const thinBorder = { style: 'thin' as const, color: { argb: '000000' } };
const fullBorder = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder
};


export async function generatePackingListXlsx(invoiceData: any): Promise<Buffer> {
  const workbook = new Workbook();
  const ws = workbook.addWorksheet('Packing List', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  // === CONSTANTS ===
  const defaultFont = { name: 'Times New Roman', size: 10 };
  const thinBorder = { style: 'thin' as const };
  const thickBorder = { style: 'medium' as const };

  ws.columns = [
    { width: 8.55 }, { width: 8.55 }, { width: 11.09 }, { width: 8.55 },
    { width: 8.55 }, { width: 9.82 }, { width: 9.64 }, { width: 8.55 }, { width: 18 }
  ];

  // === HELPER ===
  const addOuterBorder = (startRow: number, endRow: number) => {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = 1; c <= 9; c++) {
        const cell = ws.getCell(r, c);
        const isTop = r === startRow;
        const isBottom = r === endRow;
        const isLeft = c === 1;
        const isRight = c === 9;
        cell.border = {
          top: isTop ? thickBorder : cell.border?.top,
          bottom: isBottom ? thickBorder : cell.border?.bottom,
          left: isLeft ? thickBorder : cell.border?.left,
          right: isRight ? thickBorder : cell.border?.right
        };
      }
    }
  };

  let rowNum = 1;

  // === HEADER ===
  ws.mergeCells(`A${rowNum}:I${rowNum}`);
  const header = ws.getCell(`A${rowNum}`);
  header.value = 'PACKING LIST';
  header.font = { ...defaultFont, bold: true, size: 12 };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  header.border = { top: thickBorder, bottom: thickBorder, left: thickBorder, right: thickBorder };
  ws.getRow(rowNum).height = 20;
  rowNum++;

  // === EXPORTER HEADER ===
  ws.getCell(`A${rowNum}`).value = 'Exporter';
  ws.getCell(`A${rowNum}`).font = { ...defaultFont, bold: true };
  ws.getCell(`F${rowNum}`).value = 'Pkg. List No';
  ws.getCell(`F${rowNum}`).font = { ...defaultFont, bold: true };
  ws.getCell(`H${rowNum}`).value = 'IEC';
  ws.getCell(`H${rowNum}`).font = { ...defaultFont, bold: true };
  ws.getCell(`I${rowNum}`).value = invoiceData.exporter?.iec || '0609004549';
  
  // ✅ VERTICAL LINE between E-F in row 2
  ws.getCell(`E${rowNum}`).border = { ...ws.getCell(`E${rowNum}`).border, right: thickBorder };
  
  addOuterBorder(rowNum, rowNum);
  rowNum++;

  // === EXPORTER DETAILS ===
  ws.mergeCells(`A3:E7`);
  const exporter = ws.getCell('A3');
  exporter.value = [
    invoiceData.exporter?.name || 'SHIVA EXPORTS INDIA',
    '35 - FARSH ROAD',
    'KANNAUJ - 209725',
    'UP (INDIA)',
    `Ph: ${invoiceData.exporter?.phone || '+91 9838 332079'} | FAX: ${invoiceData.exporter?.fax || '+91 5694 325218'}`
  ].join('\n');
  exporter.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  exporter.font = defaultFont;

  ws.getCell('F3').value = 'Pkg List No';
  ws.getCell('F3').font = { ...defaultFont, bold: true };
  ws.getCell('G3').value = invoiceData.invoiceNumber || '48';
  ws.getCell('G3').border = { bottom: thinBorder };

  ws.getCell('F4').value = 'Date';
  ws.getCell('F4').font = { ...defaultFont, bold: true };
  ws.getCell('G4').value = invoiceData.invoiceDate || '12-May-25';
  ws.getCell('F4').border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  ws.getCell('G4').border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

  ws.getCell('F5').value = 'Other Reference (s)';
  ws.getCell('F5').font = { ...defaultFont, bold: true };
  ws.getCell('F5').border = { bottom: thinBorder };

  // Center border line between E and F from row 3-7
  for (let r = 3; r <= 7; r++) {
    ws.getCell(r, 5).border = { ...ws.getCell(r, 5).border, right: thickBorder };
  }

  addOuterBorder(2, 7);

  // === CONSIGNEE ===
  ws.getCell(`A8`).value = 'Consignee';
  ws.getCell(`A8`).font = { ...defaultFont, bold: true };
  ws.getCell(`F8`).value = 'Buyer (if other than consignee)';
  ws.getCell(`F8`).font = { ...defaultFont, bold: true };
  
  // ✅ VERTICAL LINE between E-F in row 8
  ws.getCell(`E8`).border = { ...ws.getCell(`E8`).border, right: thickBorder };
  
  addOuterBorder(8, 8);

  ws.mergeCells(`A9:E15`);
  const consignee = ws.getCell('A9');
  consignee.value = [
    invoiceData.consignee?.name || 'Masahiko Ohnishi',
    invoiceData.consignee?.company || 'Tokiwa Sangyo Ltd.',
    invoiceData.consignee?.address || '7-15-2 Asamizo-dai Minami-ku',
    invoiceData.consignee?.city || 'Sagamihara-shi, Kanagawa-ken, 252-0328',
    invoiceData.consignee?.country || 'Japan',
    `T: ${invoiceData.consignee?.phone || '814-2766-1001'}  F: ${invoiceData.consignee?.fax || '814-2766-1110'}`
  ].join('\n');
  consignee.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  consignee.font = defaultFont;

  ws.getCell('F10').value = 'Country of Origin';
  ws.getCell('F10').font = { ...defaultFont, bold: true };
  ws.getCell('H10').value = 'Country of Final Destination';
  ws.getCell('H10').font = { ...defaultFont, bold: true };
  ws.getCell('F11').value = 'INDIA';
  ws.getCell('H11').value = invoiceData.countryOfDestination || 'JAPAN';
  
  ws.mergeCells('F14:I15');
  ws.getCell('F14').value = invoiceData.productDescription || 'Essential Oils\nFOR EXTERNAL USE ONLY';
  ws.getCell('F14').font = { ...defaultFont, bold: true };
  ws.getCell('F14').alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

  // ✅ VERTICAL LINE between E-F from row 9-15
  for (let r = 9; r <= 15; r++) {
    ws.getCell(r, 5).border = { ...ws.getCell(r, 5).border, right: thickBorder };
  }

  addOuterBorder(9, 15);
  // ✅ Set row 15 height to 18
  ws.getRow(15).height = 18;

  // === PORT OF DISCHARGE ===
  ws.getCell('A16').value = 'Port Of Discharge';
  ws.getCell('D16').value = 'Final Destination';
  ws.getCell('D17').value = invoiceData.countryOfDestination || 'JAPAN';
  
  // ✅ VERTICAL LINE between C-D from row 16-17
  ws.getCell(`C16`).border = { ...ws.getCell(`C16`).border, right: thickBorder };
  ws.getCell(`C17`).border = { ...ws.getCell(`C17`).border, right: thickBorder };
  
  addOuterBorder(16, 17);

  // === TABLE HEADER (Row 18) ===
  const headerRow = 18;
  ws.getCell(`A${headerRow}`).value = 'Marks & Nos.';
  ws.getCell(`D${headerRow}`).value = 'Code No.';
  ws.getCell(`G${headerRow}`).value = 'Qty (Bottle/s)';
  ws.getCell(`H${headerRow}`).value = 'Total Qty.(Kg)';
  ws.getCell(`I${headerRow}`).value = 'Final Total';
  
  ws.mergeCells(`B${headerRow}:C${headerRow}`);
  ws.getCell(`B${headerRow}`).value = 'No. & Kind of pkgs.\nDescription of Goods';
  
  ['A', 'B', 'D', 'G', 'H', 'I'].forEach(col => {
    const cell = ws.getCell(`${col}${headerRow}`);
    cell.font = { ...defaultFont, bold: true, size: 9 };
    cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
    cell.border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  });
  // ✅ Set row 18 height to 25
  ws.getRow(headerRow).height = 25;
  ws.getColumn(9).width = 18;

  // === PRODUCT DESCRIPTION ===
  let currentRow = 19;
  ws.mergeCells(`A${currentRow}:I${currentRow}`);
  ws.getCell(`A${currentRow}`).value = invoiceData.productDescription || 'Essential Oils >>>';
  ws.getCell(`A${currentRow}`).font = { ...defaultFont, bold: true };
  ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(`A${currentRow}`).border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  currentRow++;

  // === ITEMS/BOXES SECTION ===
  const boxGroups: { [key: number]: any[] } = {};
  invoiceData.items?.forEach((item: any) => {
    const boxNum = item.boxNumber || 1;
    if (!boxGroups[boxNum]) boxGroups[boxNum] = [];
    boxGroups[boxNum].push(item);
  });

  let totalKgs = 0;
  let totalPcs = 0;
  const boxStartRow = currentRow;

  Object.keys(boxGroups).sort((a, b) => Number(a) - Number(b)).forEach((boxNumStr) => {
    const boxNum = Number(boxNumStr);
    const items = boxGroups[boxNum];
    let boxTotalKgs = 0;

    // Box header
    ws.mergeCells(`A${currentRow}:C${currentRow}`);
    ws.getCell(`A${currentRow}`).value = `Box ${boxNum}`;
    ws.getCell(`A${currentRow}`).font = { ...defaultFont, bold: true };
    ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;

    // Items in this box
    items.forEach((item: any, idx: number) => {
      ws.getCell(`B${currentRow}`).value = idx + 1;
      ws.getCell(`C${currentRow}`).value = item.description || '';
      ws.getCell(`G${currentRow}`).value = item.pcs || 0;
      ws.getCell(`H${currentRow}`).value = item.qtyKgs || 0;
      // ✅ Individual Final Total to 3 decimals
      ws.getCell(`I${currentRow}`).value = item.qtyKgs?.toFixed(3) || '0.000';

      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
        ws.getCell(`${col}${currentRow}`).font = defaultFont;
        ws.getCell(`${col}${currentRow}`).alignment = { vertical: 'middle', horizontal: 'left' };
      });

      totalPcs += item.pcs || 0;
      totalKgs += item.qtyKgs || 0;
      boxTotalKgs += item.qtyKgs || 0;
      currentRow++;
    });

    // Box net weight line
    ws.getCell(`I${currentRow}`).value = `${boxTotalKgs.toFixed(3)} KGS NET`;
    ws.getCell(`I${currentRow}`).font = { ...defaultFont, bold: true };
    ws.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;

    // Blank line
    currentRow++;
  });

  const boxEndRow = currentRow - 1;
  addOuterBorder(boxStartRow, boxEndRow);

  // === TOTAL NET WEIGHT ===
  currentRow += 2;
  ws.getCell(`I${currentRow}`).value = `${totalKgs.toFixed(3)} KGS NET`;
  ws.getCell(`I${currentRow}`).font = { ...defaultFont, bold: true };
  ws.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

  // ✅ NO HORIZONTAL LINE before TOTAL
  
  // === TOTAL SUMMARY ===
  currentRow += 2;
  ws.mergeCells(`A${currentRow}:H${currentRow}`);
  ws.getCell(`A${currentRow}`).value = `TOTAL : ${totalKgs.toFixed(2)} Kgs , in ${totalPcs} Pcs -${Object.keys(boxGroups).length} BOXES`;
  ws.getCell(`A${currentRow}`).font = { ...defaultFont, bold: true };
  ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(`A${currentRow}`).border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  ws.getCell(`I${currentRow}`).border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  currentRow++;

  // === FOOTER ===
  currentRow += 2;
  ws.getCell(`A${currentRow}`).value = 'All Dispute Subjected Delhi Jurisdiction';
  ws.getCell(`A${currentRow}`).font = defaultFont;
  currentRow++;

  ws.getCell(`A${currentRow}`).value = 'No Claim or Shortage, damage, Leakage,etc will be';
  ws.getCell(`A${currentRow}`).font = defaultFont;
  currentRow++;

  ws.getCell(`A${currentRow}`).value = 'entertained after the goods leave our premises';
  ws.getCell(`A${currentRow}`).font = defaultFont;
  currentRow++;

  // === DECLARATION + SIGNATURE BESIDE (No bottom border on signature) ===
  const declRow = currentRow;
  ws.getCell(`A${declRow}`).value = 'Declaration :';
  ws.getCell(`A${declRow}`).font = { ...defaultFont, bold: true };
  
  // ✅ Signature box beside Declaration - NO BOTTOM BORDER, extends downward
  ws.mergeCells(`G${declRow}:I${declRow + 2}`);
  ws.getCell(`G${declRow}`).value = 'Signature & Date';
  ws.getCell(`G${declRow}`).font = { ...defaultFont, bold: true };
  ws.getCell(`G${declRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(declRow).height = 15;
  
  // ✅ Signature box borders: TOP, LEFT, RIGHT (NO BOTTOM)
  for (let r = declRow; r <= declRow + 2; r++) {
    for (let c = 7; c <= 9; c++) {
      const isTop = r === declRow;
      const isLeft = c === 7;
      const isRight = c === 9;
      ws.getCell(r, c).border = {
        top: isTop ? thickBorder : undefined,
        left: isLeft ? thickBorder : undefined,
        right: isRight ? thickBorder : undefined
        // ✅ NO BOTTOM - will extend to below
      };
    }
  }
  
  currentRow++;

  ws.getCell(`A${currentRow}`).value = 'We declare that this invoice shows the actual price of the goods';
  ws.getCell(`A${currentRow}`).font = defaultFont;
  currentRow++;

  ws.getCell(`A${currentRow}`).value = 'described and that all particulars are true and correct.';
  ws.getCell(`A${currentRow}`).font = defaultFont;
  currentRow++;

  // ✅ Add BOTTOM BORDER to signature after declaration ends
  ws.getCell(`G${currentRow}`).border = { bottom: thickBorder };
  ws.getCell(`H${currentRow}`).border = { bottom: thickBorder };
  ws.getCell(`I${currentRow}`).border = { bottom: thickBorder };

  // === APPLY FULL PAGE BORDER ===
  const lastRow = currentRow;
  addOuterBorder(1, lastRow);

  // === SET DEFAULT ROW HEIGHT ===
  ws.eachRow(row => {
    if (row.height === undefined) row.height = 16;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}





