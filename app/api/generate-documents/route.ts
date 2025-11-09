import { NextRequest, NextResponse } from 'next/server';
import { generateCOADocument, generateMSDSDocument, generateSDSDocument, generateIFRADocument } from '@/lib/generators/doc-generator';
import { generateZipFile, FileToZip } from '@/lib/generators/zip-generator';
import { InvoiceItem, InvoiceData } from '@/lib/types';

const slug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, docSettings } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 });
    }

    if (!docSettings) {
      return NextResponse.json({ error: 'Document settings are required' }, { status: 400 });
    }

    console.log('🚀 Starting document generation for', items.length, 'items');
    console.log('Doc Settings:', docSettings);

    // Create minimal invoice data for document generation (they need some invoice context)
    const minimalInvoiceData: InvoiceData = {
      invoiceNumber: 'DOC-GEN',
      invoiceDate: new Date().toISOString().split('T')[0],
      buyerOrderNo: '',
      buyerOrderDate: '',
      exporter: {
        name: 'SHIVA EXPORTS INDIA',
        address: '35 - FARSH ROAD, KANNAUJ - 209725, UP (INDIA)',
        phone: '+91 9838 332079',
        fax: '+91 5694 235218',
        adCode: '63914712100009',
        gstin: '09AEOPT2938Q1ZC',
        iec: '0609004549',
        bankName: 'HDFC BANK LTD',
        accountNo: '50200025599210',
      },
      consignee: {
        name: 'DOCUMENT GENERATOR',
        address: '',
        phone: '',
      },
      buyer: {
        name: 'DOCUMENT GENERATOR',
        address: '',
        phone: '',
      },
      countryOfOrigin: 'INDIA',
      countryOfDestination: '',
      preCarriageBy: '',
      placeOfReceipt: '',
      termsOfDelivery: 'CNF',
      vesselFlightNo: '',
      portOfLoading: 'NEW DELHI',
      portOfDischarge: '',
      finalDestination: '',
      productDescription: items.map(i => i.description).join(', ') || 'AROMA CHEMICALS',
      currency: 'USD',
      exchangeRate: 84.50,
      items: items,
      totalPcs: items.reduce((sum, item) => sum + (item.pcs || 0), 0),
      totalKgs: items.reduce((sum, item) => sum + (item.qtyKgs || 0), 0),
      totalBoxes: 1,
      totalAmount: 0,
      shippingCost: 0,
      fobValue: 0,
      totalInvoiceValue: 0,
      invoiceType: 'IGST',
      multiplyRateBy: 'kgs',
      showExtraFields: true,
    };

    const filesToZip: FileToZip[] = [];
    const usedFilenames = new Set<string>();

    // Helper function to ensure unique filenames
    const getUniqueFilename = (baseName: string, extension: string): string => {
      let filename = `${baseName}${extension}`;
      let counter = 1;
      
      while (usedFilenames.has(filename)) {
        filename = `${baseName}_${counter}${extension}`;
        counter++;
      }
      
      usedFilenames.add(filename);
      return filename;
    };

    // Generate documents per item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const short = slug(item.description || 'item');
      const itemIndex = items.length > 1 ? `_${i + 1}` : '';
      
      // COA - Certificate of Analysis
      if (docSettings.coa) {
        try {
          console.log(`✅ Generating COA for: ${item.description}`);
          const coaBuffer = await generateCOADocument(item, minimalInvoiceData);
          const filename = getUniqueFilename(`COA_${short}${itemIndex}`, '.docx');
          filesToZip.push({
            filename: filename,
            buffer: coaBuffer,
          });
          console.log(`  📄 Added to ZIP: ${filename}`);
        } catch (error) {
          console.error(`COA generation error for ${item.description}:`, error);
        }
      }

      // MSDS_SINGLE - Material Safety Data Sheet (Single Product)
      if (docSettings.msds) {
        try {
          console.log(`✅ Generating MSDS_SINGLE for: ${item.description}`);
          const msdsBuffer = await generateMSDSDocument(item, minimalInvoiceData);
          const filename = getUniqueFilename(`MSDS_SINGLE_${short}${itemIndex}`, '.docx');
          filesToZip.push({
            filename: filename,
            buffer: msdsBuffer,
          });
          console.log(`  📄 Added to ZIP: ${filename}`);
        } catch (error) {
          console.error(`MSDS_SINGLE generation error for ${item.description}:`, error);
        }
      }

      // SDS - Safety Data Sheet (Full)
      if (docSettings.sds) {
        try {
          console.log(`✅ Generating SDS for: ${item.description}`);
          const sdsBuffer = await generateSDSDocument(item, minimalInvoiceData);
          const filename = getUniqueFilename(`SDS_${short}${itemIndex}`, '.docx');
          filesToZip.push({
            filename: filename,
            buffer: sdsBuffer,
          });
          console.log(`  📄 Added to ZIP: ${filename}`);
        } catch (error) {
          console.error(`SDS generation error for ${item.description}:`, error);
        }
      }

      // IFRA - Per item (override productDescription per item)
      if (docSettings.ifra) {
        try {
          console.log(`✅ Generating IFRA for: ${item.description}`);
          // Create invoice data with item-specific product description
          const itemInvoiceData = {
            ...minimalInvoiceData,
            productDescription: item.description || minimalInvoiceData.productDescription,
          };
          const ifraBuffer = await generateIFRADocument(itemInvoiceData);
          const filename = getUniqueFilename(`IFRA_${short}${itemIndex}`, '.docx');
          filesToZip.push({
            filename: filename,
            buffer: ifraBuffer,
          });
          console.log(`  📄 Added to ZIP: ${filename}`);
        } catch (error) {
          console.error(`IFRA generation error for ${item.description}:`, error);
        }
      }
    }

    if (filesToZip.length === 0) {
      return NextResponse.json({ error: 'No documents were generated. Please select at least one document type.' }, { status: 400 });
    }

    // Create single ZIP file with all documents
    console.log('📦 Creating single ZIP file with all documents...');
    console.log(`📋 Total files to include in ZIP: ${filesToZip.length}`);
    filesToZip.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.filename}`);
    });
    
    const zipBuffer = await generateZipFile(filesToZip);
    const zipFilename = `Documents_${new Date().toISOString().split('T')[0]}_${filesToZip.length}files.zip`;

    console.log(`✅ ZIP file created successfully with ${filesToZip.length} files`);

    // Return ZIP file directly as blob
    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
      },
    });

  } catch (error) {
    const err = error as Error;
    console.error('Document generation error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err.message || 'Failed to generate documents' 
      },
      { status: 500 }
    );
  }
}

