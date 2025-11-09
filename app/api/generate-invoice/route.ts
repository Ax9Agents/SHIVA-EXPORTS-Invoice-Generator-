import { NextRequest, NextResponse } from 'next/server';
import { generateIGSTInvoice, generateLUTInvoice } from '@/lib/generators/excel-generator';
import { generateInvoicePDF } from '@/lib/generators/pdf-generator';
import {
  generateAnnexureDocument,
  generateCOADocument,
  generateMSDSDocument,
  generateMSDS2ColumnDocument,
  generateNonHazardousCertDocument,
  generateNonHazardousCertDocument1,
  generateToxicCertDocument,
  generateSDSDocument,
  generateSLIFedexXlsx,
  generateDHLSLIXlsx,
  generateIFRADocument,
  generatePackingListXlsx,
} from '@/lib/generators/doc-generator';
import { generateZipFile, FileToZip } from '@/lib/generators/zip-generator';
import { uploadToDrive } from '@/lib/utils/drive-uploader';
import { supabaseAdmin } from '@/lib/supabase/server';

export const maxDuration = 300;

// Helper: safe filename slug
const slug = (s: string) =>
  (s || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, invoiceData, docGenerationSettings } = body;

    if (!userId || !invoiceData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🚀 Starting invoice generation:', invoiceData.invoiceNumber);
    console.log('Doc Generation Settings:', docGenerationSettings);

    const consigneeFirstName = invoiceData.consignee.name.split(' ')[0].toUpperCase();
    const invNumber = invoiceData.invoiceNumber;

    // 1. Generate Excel
    console.log('📊 Generating Excel...');
    let excelBuffer: Buffer | Uint8Array;
    if (invoiceData.invoiceType === 'LUT') {
      excelBuffer = await generateLUTInvoice(invoiceData);
    } else {
      excelBuffer = await generateIGSTInvoice(invoiceData);
    }
    const excelBufferProper = Buffer.from(excelBuffer);
    const excelFilename = `${invoiceData.invoiceType}_INV_${invNumber}_${consigneeFirstName}.xlsx`;

    // 2. Generate PDF
    console.log('📄 Generating PDF...');
    const pdfBuffer = await generateInvoicePDF(invoiceData);
    const pdfBufferProper = Buffer.from(pdfBuffer);
    const pdfFilename = `PDF_INV_${invNumber}_${consigneeFirstName}.pdf`;

    // 3. Generate Documents
    console.log('📝 Generating documents...');
    const generatedDocs: { [key: string]: Buffer } = {};
    const docLinks: { [key: string]: string } = {};
    
    // ✅ NEW: Array for per-item docs
    const perItemDocs: { key: string; filename: string; buffer: Buffer }[] = [];

    // Invoice-level documents
    if (docGenerationSettings.annexure) {
      console.log('✅ Generating Annexure...');
      try {
        const annexureBuffer = await generateAnnexureDocument(invoiceData);
        generatedDocs['annexure'] = annexureBuffer;
      } catch (error) {
        console.error('Annexure generation error:', error);
      }
    }

    // ✅ COA - PER ITEM
    if (docGenerationSettings.coa) {
      console.log('✅ Generating COA (per item)...');
      for (const item of invoiceData.items) {
        try {
          const short = slug(item.description);
          const buf = await generateCOADocument(item, invoiceData);
          perItemDocs.push({
            key: `coa_${short}`,
            filename: `COA_${invNumber}_${short}.docx`,
            buffer: buf,
          });
        } catch (error) {
          console.error('COA generation error (item):', item.description, error);
        }
      }
    }

    // ✅ MSDS_SINGLE - PER ITEM
    if (docGenerationSettings.msds) {
      console.log('✅ Generating MSDS_SINGLE (per item)...');
      for (const item of invoiceData.items) {
        try {
          const short = slug(item.description);
          const buf = await generateMSDSDocument(item, invoiceData);
          perItemDocs.push({
            key: `msds_single_${short}`,
            filename: `MSDS_SINGLE_${invNumber}_${short}.docx`,
            buffer: buf,
          });
        } catch (error) {
          console.error('MSDS_SINGLE generation error (item):', item.description, error);
        }
      }
    }

    // ✅ SDS - PER ITEM
    if (docGenerationSettings.sds) {
      console.log('✅ Generating SDS (per item)...');
      for (const item of invoiceData.items) {
        try {
          const short = slug(item.description);
          const buf = await generateSDSDocument(item, invoiceData);
          perItemDocs.push({
            key: `sds_${short}`,
            filename: `SDS_${invNumber}_${short}.docx`,
            buffer: buf,
          });
        } catch (error) {
          console.error('SDS generation error (item):', item.description, error);
        }
      }
    }

    // ✅ IFRA - PER ITEM (override productDescription per item)
    if (docGenerationSettings.ifra) {
      console.log('✅ Generating IFRA (per item)...');
      for (const item of invoiceData.items) {
        try {
          const short = slug(item.description);
          const invCtxForItem = { ...invoiceData, productDescription: item.description };
          const buf = await generateIFRADocument(invCtxForItem as any);
          perItemDocs.push({
            key: `ifra_${short}`,
            filename: `IFRA_${invNumber}_${short}.docx`,
            buffer: buf,
          });
        } catch (error) {
          console.error('IFRA generation error (item):', item.description, error);
        }
      }
    }

    if (docGenerationSettings.msds2Column) {
      console.log('✅ Generating MSDS (2-Column)...');
      try {
        const msds2Buffer = await generateMSDS2ColumnDocument(invoiceData);
        generatedDocs['msds2column'] = msds2Buffer;
      } catch (error) {
        console.error('MSDS 2-Column generation error:', error);
      }
    }

    if (docGenerationSettings.non_hazardous) {
      console.log('✅ Generating Non-Hazardous Cert (v1)...');
      try {
        const certBuffer = await generateNonHazardousCertDocument(invoiceData);
        generatedDocs['non_hazardous'] = certBuffer;
      } catch (error) {
        console.error('Non-Hazardous generation error:', error);
      }
    }

    if (docGenerationSettings.non_hazardous_1) {
      console.log('✅ Generating Non-Hazardous Cert (v2)...');
      try {
        const cert1Buffer = await generateNonHazardousCertDocument1(invoiceData);
        generatedDocs['non_hazardous_1'] = cert1Buffer;
      } catch (error) {
        console.error('Non-Hazardous-1 generation error:', error);
      }
    }

    if (docGenerationSettings.toxic) {
      console.log('✅ Generating Toxic Control Cert...');
      try {
        const certBuffer = await generateToxicCertDocument(invoiceData);
        generatedDocs['toxic'] = certBuffer;
      } catch (error) {
        console.error('Toxic generation error:', error);
      }
    }

    if (docGenerationSettings.sliFedex) {
      console.log('✅ Generating SLI FedEx...');
      try {
        const sliBuffer = await generateSLIFedexXlsx(invoiceData);
        generatedDocs['sliFedex'] = sliBuffer;
      } catch (error) {
        console.error('SLI FedEx generation error:', error);
      }
    }

    if (docGenerationSettings.sliDHL) {
      console.log('✅ Generating SLI DHL...');
      try {
        const dhlBuffer = await generateDHLSLIXlsx(invoiceData);
        generatedDocs['sliDHL'] = dhlBuffer;
      } catch (error) {
        console.error('SLI DHL generation error:', error);
      }
    }

    if (docGenerationSettings.packingList) {
      console.log('✅ Generating Packing List...');
      try {
        const packingListBuffer = await generatePackingListXlsx(invoiceData);
        generatedDocs['packingList'] = packingListBuffer;
      } catch (error) {
        console.error('Packing List generation error:', error);
      }
    }

    // 4. Create ZIP
    console.log('📦 Creating ZIP file...');
    const filesToZip: FileToZip[] = [
      { filename: excelFilename, buffer: excelBufferProper },
      { filename: pdfFilename, buffer: pdfBufferProper }
    ];

    // ✅ Add per-item docs to ZIP
    for (const d of perItemDocs) {
      filesToZip.push({ filename: d.filename, buffer: d.buffer });
      console.log(`✅ Added per-item to ZIP: ${d.filename}`);
    }

    // Add invoice-level docs
    Object.entries(generatedDocs).forEach(([docType, buffer]) => {
      let docFilename = '';
      
      if (docType === 'annexure') {
        docFilename = `ANNEXURE_${invNumber}_${consigneeFirstName}.docx`;
      } else if (docType === 'msds2column') {
        docFilename = `MSDS_2COLUMN_${invNumber}_${consigneeFirstName}.docx`;
      } else if (docType === 'non_hazardous') {
        docFilename = `NON_HAZARDOUS_${invNumber}_${consigneeFirstName}.docx`;
      } else if (docType === 'non_hazardous_1') {
        docFilename = `NON_HAZARDOUS_V2_${invNumber}_${consigneeFirstName}.docx`;
      } else if (docType === 'toxic') {
        docFilename = `TOXIC_CONTROL_${invNumber}_${consigneeFirstName}.docx`;
      } else if (docType === 'sliFedex') {
        docFilename = `SLI_FEDEX_${invNumber}_${consigneeFirstName}.xlsx`;
      } else if (docType === 'sliDHL') {
        docFilename = `SLI_DHL_${invNumber}_${consigneeFirstName}.xlsx`;
      } else if (docType === 'packingList') {
        docFilename = `PACKING_LIST_${invNumber}_${consigneeFirstName}.xlsx`;
      }
      
      if (docFilename) {
        filesToZip.push({ filename: docFilename, buffer: buffer });
        console.log(`✅ Added to ZIP: ${docFilename}`);
      }
    });

    const zipBuffer = await generateZipFile(filesToZip);
    const zipFilename = `INV_${invNumber}_${consigneeFirstName}.zip`;

    console.log(`📦 ZIP contains ${filesToZip.length} files`);

    // 5. Upload to Supabase
    console.log('☁️  Uploading files to Supabase...');
    const [excelUpload, pdfUpload, zipUpload] = await Promise.all([
      uploadToDrive(excelBufferProper, excelFilename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', userId),
      uploadToDrive(pdfBufferProper, pdfFilename, 'application/pdf', userId),
      uploadToDrive(zipBuffer, zipFilename, 'application/zip', userId)
    ]);

    // ✅ Upload per-item docs
    for (const d of perItemDocs) {
      try {
        const docUpload = await uploadToDrive(
          d.buffer,
          d.filename,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          userId
        );
        docLinks[d.key] = docUpload.downloadLink;
      } catch (error) {
        console.error(`Error uploading per-item ${d.filename}:`, error);
      }
    }

    // Upload invoice-level docs
    for (const [docType, buffer] of Object.entries(generatedDocs)) {
      const docFilename = `${docType.toUpperCase()}_INV_${invNumber}_${consigneeFirstName}`;
      try {
        const docUpload = await uploadToDrive(
          buffer,
          docFilename,
          docType.includes('SLI') || docType.includes('packing') 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          userId
        );
        docLinks[docType] = docUpload.downloadLink;
      } catch (error) {
        console.error(`Error uploading ${docType}:`, error);
      }
    }

    // 6. Save to database
    console.log('💾 Saving to database...');
    const { data: invoiceRecord, error: dbError } = await supabaseAdmin
      .from('invoices')
      .upsert(
        {
          user_id: userId,
          invoice_number: invoiceData.invoiceNumber,
          invoice_date: invoiceData.invoiceDate,
          invoice_type: invoiceData.invoiceType,
          buyer_order_no: invoiceData.buyerOrderNo,
          buyer_order_date: invoiceData.buyerOrderDate,
          exporter_name: invoiceData.exporter.name,
          exporter_address: invoiceData.exporter.address,
          exporter_phone: invoiceData.exporter.phone,
          exporter_fax: invoiceData.exporter.fax || '',
          exporter_gstin: invoiceData.exporter.gstin,
          exporter_iec: invoiceData.exporter.iec,
          exporter_bank: invoiceData.exporter.bankName,
          exporter_account: invoiceData.exporter.accountNo,
          ad_code: invoiceData.exporter.adCode || '',
          exporter_arn_no: invoiceData.exporter.arnNo || '',
          consignee_name: invoiceData.consignee.name,
          consignee_address: invoiceData.consignee.address,
          consignee_phone: invoiceData.consignee.phone,
          buyer_name: invoiceData.buyer.name,
          buyer_address: invoiceData.buyer.address,
          buyer_phone: invoiceData.buyer.phone,
          country_origin: invoiceData.countryOfOrigin,
          country_destination: invoiceData.countryOfDestination,
          port_of_loading: invoiceData.portOfLoading,
          port_of_discharge: invoiceData.portOfDischarge,
          terms_of_delivery: invoiceData.termsOfDelivery,
          product_description: invoiceData.productDescription,
          currency: invoiceData.currency,
          exchange_rate: invoiceData.exchangeRate,
          total_pcs: invoiceData.totalPcs,
          total_kgs: invoiceData.totalKgs,
          total_boxes: invoiceData.totalBoxes,
          total_amount: invoiceData.totalAmount,
          shipping_cost: invoiceData.shippingCost || 0,
          fob_value: invoiceData.fobValue,
          total_invoice_value: invoiceData.totalInvoiceValue,
          multiply_rate_by: invoiceData.multiplyRateBy,
          show_extra_fields: invoiceData.showExtraFields,
          items: invoiceData.items,
          excel_link: excelUpload.downloadLink,
          pdf_link: pdfUpload.downloadLink,
          documents_zip_link: zipUpload.downloadLink,
          generated_documents: docLinks,
          doc_generation_settings: docGenerationSettings,
          documents: {
            excel: { fileId: excelUpload.fileId, link: excelUpload.downloadLink },
            pdf: { fileId: pdfUpload.fileId, link: pdfUpload.downloadLink },
            zip: { fileId: zipUpload.fileId, link: zipUpload.downloadLink },
            ...Object.entries(docLinks).reduce((acc, [type, link]) => {
              acc[type] = { link };
              return acc;
            }, {} as Record<string, any>)
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,invoice_number' }
      )
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // 7. Update autofill data
    console.log('📊 Updating autofill data...');
    const fieldsToSave = [
      { 
        field_name: 'exporter_name', 
        field_value: invoiceData.exporter.name,
        metadata: {
          exporterName: invoiceData.exporter.name,
          exporterAddress: invoiceData.exporter.address,
          exporterPhone: invoiceData.exporter.phone,
          exporterFax: invoiceData.exporter.fax,
          adCode: invoiceData.exporter.adCode,
          exporterGSTIN: invoiceData.exporter.gstin,
          exporterIEC: invoiceData.exporter.iec,
          exporterBank: invoiceData.exporter.bankName,
          exporterAccount: invoiceData.exporter.accountNo,
          exporterArnNo: invoiceData.exporter.arnNo,
        }
      },
      { 
        field_name: 'consignee_name', 
        field_value: invoiceData.consignee.name,
        metadata: {
          consigneeName: invoiceData.consignee.name,
          consigneeAddress: invoiceData.consignee.address,
          consigneePhone: invoiceData.consignee.phone,
        }
      },
      { 
        field_name: 'buyer_name', 
        field_value: invoiceData.buyer.name,
        metadata: {
          buyerName: invoiceData.buyer.name,
          buyerAddress: invoiceData.buyer.address,
          buyerPhone: invoiceData.buyer.phone,
        }
      },
    ].filter(field => field.field_value);

    await Promise.all(
      fieldsToSave.map(async (field) => {
        try {
          const { data: existing } = await supabaseAdmin
            .from('autofill_data')
            .select('*')
            .eq('user_id', userId)
            .eq('field_name', field.field_name)
            .eq('field_value', field.field_value)
            .single();
          
          if (existing) {
            await supabaseAdmin
              .from('autofill_data')
              .update({
                usage_count: existing.usage_count + 1,
                last_used: new Date().toISOString(),
                metadata: field.metadata || existing.metadata || {}
              })
              .eq('id', existing.id);
          } else {
            await supabaseAdmin
              .from('autofill_data')
              .insert({
                user_id: userId,
                field_name: field.field_name,
                field_value: field.field_value,
                metadata: field.metadata || {},
                usage_count: 1,
                last_used: new Date().toISOString()
              });
          }
        } catch (error) {
          console.error(`Error updating autofill for ${field.field_name}:`, error);
        }
      })
    );

    console.log('✅ Invoice generation complete');

    return NextResponse.json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoiceNumber: invoiceData.invoiceNumber,
        excelLink: excelUpload.downloadLink,
        pdfLink: pdfUpload.downloadLink,
        zipLink: zipUpload.downloadLink,
        generatedDocuments: docLinks,
        invoiceId: invoiceRecord.id,
      },
    });

  } catch (error) {
    const err = error as Error;
    console.error('❌ Invoice generation error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err.message || 'Failed to generate invoice' 
      },
      { status: 500 }
    );
  }
}
