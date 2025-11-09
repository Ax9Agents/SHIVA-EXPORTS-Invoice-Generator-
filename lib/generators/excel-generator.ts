import ExcelJS from 'exceljs';
import { InvoiceData } from '../types';
import { convertNumberToWords } from '../utils/number-to-words';

export async function generateIGSTInvoice(data: InvoiceData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Invoice');

    // Set column widths
    sheet.columns = [
      { width: 16 },
      { width: 20 },
      { width: 15 },
      { width: 8 },
      { width: 6 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 8 },
      { width: 12 },
      { width: 14 },
    ];

    const thinBorder = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };

    let currentRow = 1;

    // HEADER
    sheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const headerCell = sheet.getCell(`A${currentRow}`);
    headerCell.value = 'COMMERCIAL CUM TAX INVOICE';
    headerCell.font = { size: 16, bold: true, name: 'Arial' };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    headerCell.border = thinBorder;
    sheet.getRow(currentRow).height = 25;
    currentRow++;

    // SUBTITLE
    sheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const subtitleCell = sheet.getCell(`A${currentRow}`);
    subtitleCell.value = 'Supply Meant for Export Against Payment of Integrated Tax (IGST)';
    subtitleCell.font = { size: 10, italic: true, name: 'Arial' };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subtitleCell.border = thinBorder;
    currentRow++;


    // EXPORTER, INVOICE NO, EXPORTER'S REF headers
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Exporter';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

    sheet.mergeCells(`F${currentRow}:H${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = 'Invoice No. and Date';
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;
    sheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

    sheet.mergeCells(`I${currentRow}:K${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = "Exporter's Ref";
    sheet.getCell(`I${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;
    sheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    currentRow++;

    // EXPORTER DETAILS (merged A:E, rows current to current+5)
    sheet.mergeCells(`A${currentRow}:E${currentRow + 4}`);
    const exporterDetails = `${data.exporter.name}\n${data.exporter.address}\nPH: ${data.exporter.phone}${data.exporter.fax ? `\nFAX: ${data.exporter.fax}` : ''}`;
    sheet.getCell(`A${currentRow}`).value = exporterDetails;
    sheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).font = { size: 9, name: 'Arial' };

    // Invoice number (large)
    sheet.mergeCells(`F${currentRow}:H${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = data.invoiceNumber;
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 11, name: 'Arial' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;

    // GSTIN
    sheet.mergeCells(`I${currentRow}:K${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = `GSTIN NO: ${data.exporter.gstin}`;
    sheet.getCell(`I${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;
    currentRow++;

    // Date row
    sheet.mergeCells(`F${currentRow}:H${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = `DATED: ${data.invoiceDate}`;
    sheet.getCell(`F${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;

    sheet.mergeCells(`I${currentRow}:K${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = `IEC NO: ${data.exporter.iec}`;
    sheet.getCell(`I${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;
    currentRow++;

    // Buyer order row
    sheet.mergeCells(`F${currentRow}:H${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = "Buyer's order no. and date";
    sheet.getCell(`F${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;

    sheet.mergeCells(`I${currentRow}:K${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = 'IGST REFUND BANK A/C';
    sheet.getCell(`I${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;
    currentRow++;

    // Buyer order values
    sheet.mergeCells(`F${currentRow}:H${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = `${data.buyerOrderNo}, DT: ${data.buyerOrderDate}`;
    sheet.getCell(`F${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;

    sheet.mergeCells(`I${currentRow}:K${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = data.exporter.bankName;
    sheet.getCell(`I${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;
    currentRow++;

  // Bank account
    sheet.mergeCells(`I${currentRow}:K${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = `AC NO: ${data.exporter.accountNo}`;
    sheet.getCell(`I${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;

  currentRow++; // Proceed to consignee section

    // CONSIGNEE & BUYER headers
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Consignee';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

    sheet.mergeCells(`F${currentRow}:K${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = 'Buyer (if other than the consignee)';
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;
    sheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    currentRow++;

    // Consignee details
    sheet.mergeCells(`A${currentRow}:E${currentRow + 4}`);
    const consigneeDetails = `${data.consignee.name}\n${data.consignee.address}\nPh: ${data.consignee.phone}`;
    sheet.getCell(`A${currentRow}`).value = consigneeDetails;
    sheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).font = { size: 9, name: 'Arial' };

    sheet.mergeCells(`F${currentRow}:K${currentRow + 4}`);
    const buyerDetails = `${data.buyer.name}\n${data.buyer.address}\nPh: ${data.buyer.phone}`;
    sheet.getCell(`F${currentRow}`).value = buyerDetails;
    sheet.getCell(`F${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;
    sheet.getCell(`F${currentRow}`).font = { size: 9, name: 'Arial' };

    currentRow += 5;// Jump to row 16

    // COUNTRY headers
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Country of Origin of Goods';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

    sheet.mergeCells(`F${currentRow}:K${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = 'Country of Final Destination';
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;
    sheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    currentRow++;

    // Country values
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = data.countryOfOrigin;
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;

    sheet.mergeCells(`F${currentRow}:K${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = data.countryOfDestination;
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center' };
    sheet.getCell(`F${currentRow}`).border = thinBorder;

    currentRow ++; // Row 18 for shipping fields

    const shippingFields = [
      ['Terms of Delivery', data.termsOfDelivery, 'Port of Loading', data.portOfLoading],
      ['Port of Discharge', data.portOfDischarge, '', ''],
      ['Product Description', data.productDescription, '', ''],
    ];

    // Shipping Details - NO MERGES (avoid conflicts)
    shippingFields.forEach(([label1, value1, label2, value2]) => {
      // Column A - Label 1
      sheet.getCell(`A${currentRow}`).value = label1;
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
      sheet.getCell(`A${currentRow}`).border = thinBorder;
      sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

      // Column B-C - Value 1 (just set, no merge)
      sheet.getCell(`B${currentRow}`).value = value1;
      sheet.getCell(`B${currentRow}`).font = { size: 9, name: 'Arial' };
      sheet.getCell(`B${currentRow}`).border = thinBorder;

      sheet.getCell(`C${currentRow}`).value = '';
      sheet.getCell(`C${currentRow}`).border = thinBorder;

      // Column D - Empty
      sheet.getCell(`D${currentRow}`).border = thinBorder;

      // Column E - Empty  
      sheet.getCell(`E${currentRow}`).border = thinBorder;

        if (label2) {
          // Column F - Label 2
          sheet.getCell(`F${currentRow}`).value = label2;
          sheet.getCell(`F${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
          sheet.getCell(`F${currentRow}`).border = thinBorder;
          sheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

          // Columns G-H - Empty
          sheet.getCell(`G${currentRow}`).border = thinBorder;
          sheet.mergeCells(`H${currentRow}:J${currentRow}`);
          const portCell = sheet.getCell(`H${currentRow}`);
          portCell.value = value2;
          portCell.font = { size: 9, name: 'Arial' };
          portCell.border = thinBorder;

          sheet.getCell(`K${currentRow}`).border = thinBorder;
        } else {
          // Fill rest with borders
          for (let col of ['F', 'G', 'H', 'I', 'J', 'K']) {
            sheet.getCell(`${col}${currentRow}`).border = thinBorder;
          }
        }
  currentRow++;
});
    // ITEMS TABLE HEADER (row 21)
    const headers = ['S.No', 'Description of Goods', `QTY\n(kgs)`, 'Pcs', `RATE\n(${data.currency}/KGS)`, `Amount\n(${data.currency})`, `Amount\n(INR)`, 'IGST\n%', 'IGST\n(INR)', 'TOTAL\n(INR)'];

    sheet.getCell(`A${currentRow}`).value = headers[0];
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 8, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };

    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = headers[1];
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 8, name: 'Arial' };
    sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    sheet.getCell(`B${currentRow}`).border = thinBorder;
    sheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };

    const colsD = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    colsD.forEach((col, idx) => {
      sheet.getCell(`${col}${currentRow}`).value = headers[idx + 2];
      sheet.getCell(`${col}${currentRow}`).font = { bold: true, size: 8, name: 'Arial' };
      sheet.getCell(`${col}${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      sheet.getCell(`${col}${currentRow}`).border = thinBorder;
      sheet.getCell(`${col}${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    });

    sheet.getRow(currentRow).height = 30;
    currentRow++;

    // ITEMS DATA
    let totalFOB = 0;
    let totalINR = 0;
    let totalIGST = 0;
    let totalAmount = 0;

    data.items.forEach((item, index) => {
      const multiplier = data.multiplyRateBy === 'kgs' ? item.qtyKgs : item.pcs;
      const amountUSD = item.rateUSD * multiplier;
      const amountINR = amountUSD * data.exchangeRate;
      const igstRate = 0.18;  // ✅ Always 18% for IGST invoices
      const igstAmount = amountINR * igstRate;
      const total = amountINR + igstAmount;

      totalFOB += amountUSD;
      totalINR += amountINR;
      totalIGST += igstAmount;
      totalAmount += total;

      // S.No
      sheet.getCell(`A${currentRow}`).value = data.items.indexOf(item) + 1;
      sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      sheet.getCell(`A${currentRow}`).border = thinBorder;
      sheet.getCell(`A${currentRow}`).font = { size: 9, name: 'Arial' };

      // Description
      sheet.mergeCells(`B${currentRow}:C${currentRow}`);
      let itemDesc = item.description;
      if (data.showExtraFields) {
        if (item.hsnCode) itemDesc += `\nHSN: ${item.hsnCode}`;
        if (item.batchNumber) itemDesc += `\nBatch: ${item.batchNumber}`;
        if (item.mfgDate) itemDesc += `\nMfg: ${item.mfgDate}`;
        if (item.expDate) itemDesc += `\nExp: ${item.expDate}`;
        if (item.botanicalName) itemDesc += `\nBotanical: ${item.botanicalName}`;
        if (data.totalBoxes > 1 && item.boxNumber) itemDesc += `\nBox: ${item.boxNumber}`;
      }
      sheet.getCell(`B${currentRow}`).value = itemDesc;
      sheet.getCell(`B${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
      sheet.getCell(`B${currentRow}`).border = thinBorder;
      sheet.getCell(`B${currentRow}`).font = { size: 9, name: 'Arial' };

      // QTY KGS
      sheet.getCell(`D${currentRow}`).value = item.qtyKgs;
      (sheet.getCell(`D${currentRow}`) as any).numFmt = '0.000';
      sheet.getCell(`D${currentRow}`).alignment = { horizontal: 'right' };
      sheet.getCell(`D${currentRow}`).border = thinBorder;
      sheet.getCell(`D${currentRow}`).font = { size: 9, name: 'Arial' };

      // PCS
      sheet.getCell(`E${currentRow}`).value = item.pcs;
      sheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };
      sheet.getCell(`E${currentRow}`).border = thinBorder;
      sheet.getCell(`E${currentRow}`).font = { size: 9, name: 'Arial' };

      // RATE
      sheet.getCell(`F${currentRow}`).value = item.rateUSD;
      (sheet.getCell(`F${currentRow}`) as any).numFmt = '0.00';
      sheet.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
      sheet.getCell(`F${currentRow}`).border = thinBorder;
      sheet.getCell(`F${currentRow}`).font = { size: 9, name: 'Arial' };

      // Amount USD
      sheet.getCell(`G${currentRow}`).value = amountUSD;
      (sheet.getCell(`G${currentRow}`) as any).numFmt = '0.00';
      sheet.getCell(`G${currentRow}`).alignment = { horizontal: 'right' };
      sheet.getCell(`G${currentRow}`).border = thinBorder;
      sheet.getCell(`G${currentRow}`).font = { size: 9, name: 'Arial' };

      // Amount INR
      sheet.getCell(`H${currentRow}`).value = amountINR;
      (sheet.getCell(`H${currentRow}`) as any).numFmt = '0.00';
      sheet.getCell(`H${currentRow}`).alignment = { horizontal: 'right' };
      sheet.getCell(`H${currentRow}`).border = thinBorder;
      sheet.getCell(`H${currentRow}`).font = { size: 9, name: 'Arial' };

      // IGST %
      sheet.getCell(`I${currentRow}`).value = (item.igstRate || 0.18) * 100;
      (sheet.getCell(`I${currentRow}`) as any).numFmt = '0';
      sheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center' };
      sheet.getCell(`I${currentRow}`).border = thinBorder;
      sheet.getCell(`I${currentRow}`).font = { size: 9, name: 'Arial' };

      // IGST Amount
      sheet.getCell(`J${currentRow}`).value = igstAmount;
      (sheet.getCell(`J${currentRow}`) as any).numFmt = '0.00';
      sheet.getCell(`J${currentRow}`).alignment = { horizontal: 'right' };
      sheet.getCell(`J${currentRow}`).border = thinBorder;
      sheet.getCell(`J${currentRow}`).font = { size: 9, name: 'Arial' };

      // Total
      sheet.getCell(`K${currentRow}`).value = total;
      (sheet.getCell(`K${currentRow}`) as any).numFmt = '0.00';
      sheet.getCell(`K${currentRow}`).alignment = { horizontal: 'right' };
      sheet.getCell(`K${currentRow}`).border = thinBorder;
      sheet.getCell(`K${currentRow}`).font = { size: 9, name: 'Arial' };

      sheet.getRow(currentRow).height = data.showExtraFields ? 60 : 20;
      currentRow++;
    });

    // TOTALS ROW
    sheet.getCell(`A${currentRow}`).value = 'TOTAL';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };

    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = `${data.totalPcs} PCS - Total ${data.totalKgs.toFixed(3)} KGS - ${data.totalBoxes} BOX`;
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`B${currentRow}`).border = thinBorder;
    sheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };

    const totalValues: (number | string)[] = [data.totalKgs, data.totalPcs, '', totalFOB, totalINR, '', totalIGST, totalAmount];
    colsD.forEach((col, idx) => {
      const val = totalValues[idx];
      sheet.getCell(`${col}${currentRow}`).value = val;
      sheet.getCell(`${col}${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
      sheet.getCell(`${col}${currentRow}`).border = thinBorder;
      sheet.getCell(`${col}${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };

      if (['D', 'G', 'H', 'J', 'K'].includes(col)) {
        (sheet.getCell(`${col}${currentRow}`) as any).numFmt = '0.00';
        sheet.getCell(`${col}${currentRow}`).alignment = { horizontal: 'right' };
      }
      if (col === 'E') {
        sheet.getCell(`${col}${currentRow}`).alignment = { horizontal: 'center' };
      }
    });

    currentRow++;

    // Amount in words
    const amountInWords = convertNumberToWords(totalFOB, data.currency);
    sheet.mergeCells(`A${currentRow}:K${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = `Amount Chargeable (in words): ${amountInWords}`;
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    currentRow++;

    // FOB & Financial Summary
    sheet.mergeCells(`A${currentRow}:B${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'FOB Value';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;

    sheet.getCell(`C${currentRow}`).value = data.fobValue || totalFOB;
    (sheet.getCell(`C${currentRow}`) as any).numFmt = '0.00';
    sheet.getCell(`C${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`C${currentRow}`).border = thinBorder;

    sheet.mergeCells(`D${currentRow}:H${currentRow}`);
    sheet.getCell(`D${currentRow}`).border = thinBorder;

    sheet.mergeCells(`I${currentRow}:J${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = 'Total Amount Before Tax';
    sheet.getCell(`I${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;

    sheet.getCell(`K${currentRow}`).value = totalINR;
    (sheet.getCell(`K${currentRow}`) as any).numFmt = '0.00';
    sheet.getCell(`K${currentRow}`).alignment = { horizontal: 'right' };
    sheet.getCell(`K${currentRow}`).border = thinBorder;
    currentRow++;

    // Shipping cost
    sheet.mergeCells(`A${currentRow}:B${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Shipping Cost';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;

    sheet.getCell(`C${currentRow}`).value = data.shippingCost || 0;
    (sheet.getCell(`C${currentRow}`) as any).numFmt = '0.00';
    sheet.getCell(`C${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`C${currentRow}`).border = thinBorder;

    sheet.mergeCells(`D${currentRow}:H${currentRow}`);
    sheet.getCell(`D${currentRow}`).border = thinBorder;

    sheet.mergeCells(`I${currentRow}:J${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = 'Add: IGST';
    sheet.getCell(`I${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;

    sheet.getCell(`K${currentRow}`).value = totalIGST;
    (sheet.getCell(`K${currentRow}`) as any).numFmt = '0.00';
    sheet.getCell(`K${currentRow}`).alignment = { horizontal: 'right' };
    sheet.getCell(`K${currentRow}`).border = thinBorder;
    currentRow++;

    // Total Invoice Value
    sheet.mergeCells(`A${currentRow}:B${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Total Invoice Value';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };

    const totalInvoiceValue = (data.fobValue || totalFOB) + (data.shippingCost || 0);
    sheet.getCell(`C${currentRow}`).value = totalInvoiceValue;
    (sheet.getCell(`C${currentRow}`) as any).numFmt = '0.00';
    sheet.getCell(`C${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`C${currentRow}`).border = thinBorder;
    sheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };

    sheet.mergeCells(`D${currentRow}:H${currentRow}`);
    sheet.getCell(`D${currentRow}`).border = thinBorder;

    sheet.mergeCells(`I${currentRow}:J${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = 'Total Amount After Tax';
    sheet.getCell(`I${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;
    sheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };

    sheet.getCell(`K${currentRow}`).value = totalAmount;
    (sheet.getCell(`K${currentRow}`) as any).numFmt = '0.00';
    sheet.getCell(`K${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`K${currentRow}`).alignment = { horizontal: 'right' };
    sheet.getCell(`K${currentRow}`).border = thinBorder;
    sheet.getCell(`K${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };
    currentRow++;

    // GST on Reverse Charge
    sheet.mergeCells(`D${currentRow}:H${currentRow}`);
    sheet.getCell(`D${currentRow}`).border = thinBorder;

    sheet.mergeCells(`I${currentRow}:J${currentRow}`);
    sheet.getCell(`I${currentRow}`).value = 'GST on Reverse Charge';
    sheet.getCell(`I${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`I${currentRow}`).border = thinBorder;

    sheet.getCell(`K${currentRow}`).value = '';
    sheet.getCell(`K${currentRow}`).border = thinBorder;
    currentRow ++;

    // Exchange rate info
    sheet.mergeCells(`A${currentRow}:K${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = `Value in ${data.currency}: ${totalFOB.toFixed(3)} - EX RATE: ${data.exchangeRate} = INR ${totalINR.toFixed(3)}`;
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFFCC' } };
    currentRow++;

    // Declaration
    sheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const declaration = `Export Under Refund Claim of IGST\n\nWe declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.\nThe goods covered in this invoice have been made to order and specified by the buyer and not otherwise sold in the Indian Market.`;
    sheet.getCell(`A${currentRow}`).value = declaration;
    sheet.getCell(`A${currentRow}`).font = { size: 9, name: 'Arial' };
    sheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`A${currentRow}`).border = thinBorder;
    sheet.getRow(currentRow).height = 60;
    currentRow ++;

    // Signature
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).border = thinBorder;

    sheet.mergeCells(`G${currentRow}:K${currentRow}`);
    sheet.getCell(`G${currentRow}`).value = `For ${data.exporter.name}`;
    sheet.getCell(`G${currentRow}`).font = { bold: true, size: 10, name: 'Arial' };
    sheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center' };
    sheet.getCell(`G${currentRow}`).border = thinBorder;
    currentRow++;

    sheet.mergeCells(`A${currentRow}:F${currentRow + 2}`);
    sheet.getCell(`A${currentRow}`).border = thinBorder;

    sheet.mergeCells(`G${currentRow}:K${currentRow + 2}`);
    sheet.getCell(`G${currentRow}`).value = 'AUTHORISED SIGNATORY';
    sheet.getCell(`G${currentRow}`).font = { bold: true, size: 9, name: 'Arial' };
    sheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'bottom' };
    sheet.getCell(`G${currentRow}`).border = thinBorder;
    sheet.getRow(currentRow + 2).height = 40;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

// LUT INVOICE FUNCTION FOLLOWS...
export async function generateLUTInvoice(data: InvoiceData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('LUT-INVOICE', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    }
  });

  ws.columns = [
    { width: 12 },   // A
    { width: 21.55 },  // B
    { width: 8.55 },   // C
    { width: 17 },  // D
    { width: 12.36 },  // E
    { width: 10.64 },  // F
    { width: 11.91 },  // G
    { width: 12.27 },  // H
    { width: 13.31 }   // I
  ];

  const thin: any = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  const medium = { style: 'medium' };
  const noBorder: any = { top: { style: undefined }, left: { style: undefined }, bottom: { style: undefined }, right: { style: undefined } };

  const setCell = (addr: string, val: any, opts: any = {}): ExcelJS.Cell => {
    const c = ws.getCell(addr);
    c.value = val ?? '';
    const fontName = opts.font ?? 'Arial';
    c.font = { name: fontName, size: opts.size ?? 11, bold: !!opts.bold, italic: !!opts.italic, underline: !!opts.underline };
    c.alignment = { horizontal: opts.h ?? 'left', vertical: opts.v ?? 'middle', wrapText: !!opts.wrap };
    if (opts.border === false) {
      c.border = noBorder;
    } else if (opts.border) {
      c.border = opts.border;
    } else {
      c.border = thin;
    }
    return c;
  };

  const isRangeMerged = (range: string): boolean => {
    const [a, b] = range.split(':');
    const tl = ws.getCell(a);
    const br = ws.getCell(b);
    
    // Cast to number explicitly
    const startRow = Number(tl.row);
    const endRow = Number(br.row);
    const startCol = Number(tl.col);
    const endCol = Number(br.col);
    
    for (let r: number = startRow; r <= endRow; r++) {
      for (let c: number = startCol; c <= endCol; c++) {
        if (ws.getCell(r, c).isMerged) return true;
      }
    }
    return false;
  };


  const mergeSafe = (range: string, val: any, opts: any = {}): ExcelJS.Cell => {
    if (!isRangeMerged(range)) {
      ws.mergeCells(range);
    }
    return setCell(range.split(':')[0], val, opts);
  };

  const borderRow = (row: number, style: string = 'thin'): void => {
    for (let c = 1; c <= 9; c++) {
      const cell = ws.getCell(row, c);
      cell.border = { ...cell.border, bottom: { style: style as any } };
    }
  };

  const removeBorderBottom = (row: number, colStart: number = 1, colEnd: number = 9): void => {
    for (let c = colStart; c <= colEnd; c++) {
      const cell = ws.getCell(row, c);
      cell.border = { ...cell.border, bottom: { style: undefined } };
    }
  };

  const removeBorderTop = (row: number, colStart: number = 1, colEnd: number = 9): void => {
    for (let c = colStart; c <= colEnd; c++) {
      const cell = ws.getCell(row, c);
      cell.border = { ...cell.border, top: { style: undefined } };
    }
  };

  const outline = (r1: number, c1: number, r2: number, c2: number, style: string = 'thin'): void => {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const cell = ws.getCell(r, c);
        const b: any = { ...cell.border };
        if (r === r1) b.top = { style: style as any };
        if (r === r2) b.bottom = { style: style as any };
        if (c === c1) b.left = { style: style as any };
        if (c === c2) b.right = { style: style as any };
        cell.border = b;
      }
    }
  };

  let r = 1;
  const sheetStartRow = 1;

  // 1 - EXPORTS INVOICE
  mergeSafe(`A${r}:I${r}`, 'EXPORTS INVOICE', { h: 'center', size: 11, bold: true }); r++;

  // 2 - Subtitle with Calibri font
  mergeSafe(`A${r}:I${r}`, 'SUPPLY MEANT FOR EXPORT UNDER LETTER OF UNDERTAKING WITHOUT PAYMENT OF IGST', { h: 'center', size: 14, bold: true, underline: true, font: 'Calibri' });
  borderRow(r, 'thin'); r++;

  // 3 - Header row
  mergeSafe(`A${r}:D${r}`, 'Exporter', { bold: true, underline: true });
  mergeSafe(`E${r}:F${r}`, 'INVOICE NO.', { bold: true, underline: true });
  setCell(`G${r}`, "Exporter's Ref", { bold: true, underline: true });
  ws.getCell(`D${r}`).border = { ...thin, right: medium };
  ws.getCell(`E${r}`).border = { ...thin, left: medium };
  borderRow(r, 'thin'); r++;

  // Exporter details (IGST style)
  const leftStart = r;
  ws.mergeCells(`A${leftStart}:D${leftStart + 4}`);
  const exporterDetails = `${data.exporter?.name ?? ''}\n${data.exporter?.address ?? ''}\nPH: ${data.exporter?.phone ?? ''}${data.exporter?.fax ? `\nFAX: ${data.exporter.fax}` : ''}\nGSTIN: ${data.exporter?.gstin ?? ''}`;
  ws.getCell(`A${leftStart}`).value = exporterDetails;
  ws.getCell(`A${leftStart}`).alignment = { wrapText: true, vertical: 'top' };
  ws.getCell(`A${leftStart}`).border = thin;
  ws.getCell(`A${leftStart}`).font = { size: 9, name: 'Arial' };
  const leftEnd = leftStart + 4;

  // Right block 4-8
  let rr = leftStart;
  setCell(`E${rr}`, String(data.invoiceNumber ?? ''), { size: 11, bold: true });
  mergeSafe(`F${rr}:G${rr}`, `DT: ${data.invoiceDate ?? ''}`, { size: 11, bold: true });
  setCell(`H${rr}`, 'IEC', { size: 11, bold: true });
  setCell(`I${rr}`, String(data.exporter?.iec ?? ''), { size: 11 });
  
  ws.getCell(rr, 7).border = { ...ws.getCell(rr, 7).border, right: { style: undefined } };
  ws.getCell(rr, 8).border = { ...ws.getCell(rr, 8).border, left: { style: undefined } };
  borderRow(rr, 'thin'); rr++;

  mergeSafe(`E${rr}:G${rr}`, 'ORDER DETAILS AND DATE', { bold: true, underline: true });
  ws.getCell(rr, 7).border = { ...ws.getCell(rr, 7).border, right: { style: undefined } };
  ws.getCell(rr, 8).border = { ...ws.getCell(rr, 8).border, left: { style: undefined } };
  borderRow(rr, 'thin'); rr++;

  mergeSafe(`E${rr}:G${rr}`, 'ORDER VIA EMAIL');
  ws.getCell(rr, 7).border = { ...ws.getCell(rr, 7).border, right: { style: undefined } };
  ws.getCell(rr, 8).border = { ...ws.getCell(rr, 8).border, left: { style: undefined } };
  rr++;
  
  mergeSafe(`E${rr}:I${rr}`, '', { border: false }); rr++;

  const arnLabel = data.exporter?.arnNo
    ? `UNDER LUT : ARN NO :: ${data.exporter.arnNo} (ATTACHED)`
    : 'UNDER LUT : ARN NO :: __________________';
  mergeSafe(`E${rr}:I${rr}`, arnLabel, { size: 12, bold: true, underline: true, wrap: true, h: 'left', v: 'middle' });
  rr ++;

  if (rr <= leftEnd) { 
    mergeSafe(`E${rr}:I${rr}`, '', { border: false }); 
  }

  r = leftEnd + 1; // Start heading just below exporter block

  // Consignee heading + details (IGST style)
  mergeSafe(`A${r}:D${r}`, 'Consignee', { bold: true, underline: true });
  r++;
  ws.mergeCells(`A${r}:D${r + 4}`);
  const consigneeDetails = `${data.consignee?.name ?? ''}\n${data.consignee?.address ?? ''}\nPh: ${data.consignee?.phone ?? ''}`;
  ws.getCell(`A${r}`).value = consigneeDetails;
  ws.getCell(`A${r}`).alignment = { wrapText: true, vertical: 'top' };
  ws.getCell(`A${r}`).border = thin;
  ws.getCell(`A${r}`).font = { size: 10, name: 'Arial' };
  const consStart = r;
  const consEnd = r + 4;

  r = consEnd + 1; // Start directly below consignee block

  // Maintain border beneath consignee section
  borderRow(consEnd, 'thin');

  // Logistics headers row
  const logisticsHeaderRow = r;
  setCell(`C${logisticsHeaderRow}`, 'Place of Receipt by Pre-carrier', { size: 11, font: 'Times New Roman' });
  mergeSafe(`E${logisticsHeaderRow}:F${logisticsHeaderRow}`, 'Country of Origin of Goods', { size: 11, font: 'Times New Roman' });
  mergeSafe(`G${logisticsHeaderRow}:I${logisticsHeaderRow}`, 'Country of Final Destination', { size: 11, font: 'Times New Roman' });
  removeBorderBottom(logisticsHeaderRow, 1, 9);
  ws.getCell(logisticsHeaderRow, 5).border = { ...ws.getCell(logisticsHeaderRow, 5).border, right: { style: undefined } };

  // Country values row
  const countryRow = logisticsHeaderRow + 1;
  setCell(`B${countryRow}`, '', { border: false });
  ws.getCell(countryRow, 2).border = { ...ws.getCell(countryRow, 2).border, right: { style: 'thin' } };
  ws.getCell(countryRow, 3).border = { ...ws.getCell(countryRow, 3).border, left: { style: 'thin' } };
  ws.getCell(countryRow, 4).border = { ...ws.getCell(countryRow, 4).border, right: { style: 'thin' } };
  ws.getCell(countryRow, 5).border = { ...ws.getCell(countryRow, 5).border, left: { style: 'thin' } };
  mergeSafe(`E${countryRow}:F${countryRow}`, data.countryOfOrigin ?? 'INDIA', { bold: true, h: 'center' });
  mergeSafe(`G${countryRow}:I${countryRow}`, data.countryOfDestination ?? 'UAE', { bold: true, h: 'center' });
  ws.getCell(countryRow, 5).border = { ...ws.getCell(countryRow, 5).border, right: { style: undefined }, top: { style: undefined } };
  ws.getCell(countryRow, 6).border = { ...ws.getCell(countryRow, 6).border, left: { style: undefined }, top: { style: undefined } };
  ws.getCell(countryRow, 8).border = { ...ws.getCell(countryRow, 8).border, top: { style: undefined } };
  ws.getCell(countryRow, 9).border = { ...ws.getCell(countryRow, 9).border, top: { style: undefined } };
  for (let c = 1; c <= 7; c++) {
    ws.getCell(countryRow, c).border = { ...ws.getCell(countryRow, c).border, bottom: { style: 'thin' } };
  }

  // Vessel and port information
  const vesselHeaderRow = countryRow + 1;
  mergeSafe(`A${vesselHeaderRow}:B${vesselHeaderRow}`, 'Vessel/Flight No.', { bold: true });
  mergeSafe(`C${vesselHeaderRow}:D${vesselHeaderRow}`, 'Port of Loading', { bold: true });
  removeBorderBottom(vesselHeaderRow, 1, 9);

  const vesselValueRow = vesselHeaderRow + 1;
  mergeSafe(`C${vesselValueRow}:D${vesselValueRow}`, data.portOfLoading ?? 'NEW DELHI', {});
  removeBorderBottom(vesselValueRow, 3, 4);

  const dischargeHeaderRow = vesselValueRow + 1;
  mergeSafe(`A${dischargeHeaderRow}:B${dischargeHeaderRow}`, 'Port OF Discharge', { bold: true });
  mergeSafe(`C${dischargeHeaderRow}:D${dischargeHeaderRow}`, 'Final Destination', { bold: true });
  removeBorderBottom(dischargeHeaderRow, 1, 9);

  const dischargeValueRow = dischargeHeaderRow + 1;
  mergeSafe(`C${dischargeValueRow}:D${dischargeValueRow}`, data.portOfDischarge ?? 'UAE', {});
  removeBorderBottom(dischargeValueRow, 3, 4);

  // Product description (E-I merged, no borders) aligned with vessel/discharge rows
  const descTop = vesselHeaderRow;
  const descBottom = dischargeValueRow;
  mergeSafe(`E${descTop}:I${descBottom}`, data.productDescription ?? '', { bold: true, h: 'center', v: 'middle', wrap: true, border: false });
  for (let rowIdx = descTop; rowIdx <= descBottom; rowIdx++) {
    for (let c = 5; c <= 7; c++) {
      ws.getCell(rowIdx, c).border = noBorder;
    }
  }

  r = descBottom + 1; // Continue immediately after the logistics block

  // 26: Grid headers
  setCell(`A${r}`, 'Marks & Nos.', { bold: false, size: 11, font: 'Times New Roman' });
  setCell(`B${r}`, 'No. & Kind of pkgs.\nDescription of Goods', { bold: false, size: 11, wrap: true, font: 'Times New Roman' });
  setCell(`C${r}`, '', {});
  setCell(`D${r}`, 'Code No.', { bold: false, size: 11, font: 'Times New Roman' });
  setCell(`E${r}`, 'Price /KGS', { bold: false, size: 11, font: 'Times New Roman' });
  setCell(`F${r}`, 'QTY (Kg)', { bold: false, size: 11, font: 'Times New Roman' });
  setCell(`G${r}`, 'Pcs', { bold: false, size: 11, font: 'Times New Roman' });
  setCell(`H${r}`, '', {});
  setCell(`I${r}`, 'Total Amount', { bold: false, size: 11, h: 'center', font: 'Times New Roman' });
  borderRow(r, 'thin');
  ws.getRow(r).height = 33;
  r++;

  // 27: Product description banner + USD
  mergeSafe(`A${r}:D${r}`, data.productDescription ?? '', { bold: true, border: false });
  setCell(`E${r}`, '', { border: false });
  setCell(`F${r}`, '', { border: false });
  setCell(`G${r}`, '', { border: false });
  setCell(`H${r}`, '', { border: false });
  setCell(`I${r}`, `${data.currency}/${data.termsOfDelivery}`, { bold: true, h: 'center', border: false });
  r++;

  // Items section
  let cnfTotalUSD = 0;
  const itemGap = 2;

  (data.items || []).forEach((it, idx) => {
    const multiplier = data.multiplyRateBy === 'pcs' ? Number(it.pcs ?? 0) : Number(it.qtyKgs ?? 0);
    const amount = Number(it.rateUSD ?? 0) * Number(multiplier ?? 0) || 0;
    cnfTotalUSD += amount;

    // Main item row
    setCell(`A${r}`, idx + 1, { h: 'center', border: false });
    mergeSafe(`B${r}:C${r}`, it.description ?? '', {  size: 10, border: false });
    setCell(`E${r}`, `$ ${Number(it.rateUSD ?? 0).toFixed(3)}`, { h: 'right', border: false });
    const qtyCell = setCell(`F${r}`, Number(it.qtyKgs ?? 0), { h: 'center', border: false });
    qtyCell.numFmt = '0.000';  // ✅ Changed from '0' to '0.000'

    setCell(`G${r}`, Number(it.pcs ?? 0), { h: 'center', border: false });
    setCell(`H${r}`, '', { border: false });
    setCell(`I${r}`, `$ ${amount.toFixed(3)}`, { h: 'right', border: false });
    ws.getRow(r).height = 19;
    r++;

  });

  // Gap before Cost breakdown
  // for (let i = 0; i < 4; i++) { 
  //   for (let c = 1; c <= 9; c++) setCell(ws.getRow(r).getCell(c).address, '', { border: false }); 
  //   r++; 
  // }

  // Cost & Shipping section
  mergeSafe(`B${r}:D${r}`, 'Cost and Shipping Breakup for Importer', { bold: true, underline: true, border: false }); r++;
  setCell(`B${r}`, `FOB : $ ${Number(data.fobValue ?? cnfTotalUSD).toFixed(3)} USD`, { bold: true,  border: false }); r++;
  mergeSafe(`B${r}:C${r}`, `SHIPPING : $ ${Number(data.shippingCost ?? 0).toFixed(3)} USD`, { bold: true, border: false }); r++;
  mergeSafe(`B${r}:C${r}`, `TOTAL : $ ${Number(data.totalAmount ?? 0).toFixed(3)} USD`, { bold: true, border: false }); r++;

  // Gap
  // for (let i = 0; i < 3; i++) { 
  //   for (let c = 1; c <= 9; c++) setCell(ws.getRow(r).getCell(c).address, '', { border: false }); 
  //   r++; 
  // }

  // Totals section
  mergeSafe(`C${r}:G${r}`, `${data.totalPcs ?? 0} PCS/${Number(data.totalKgs ?? 0).toFixed(3)} KGS`, { bold: true, h: 'center', border: false }); r++;
  mergeSafe(`C${r}:G${r}`, `${data.totalBoxes ?? 0} BOX`, { bold: true, underline: true, h: 'center', border: false }); r++;

  // Empty row before CNF TOTAL
  for (let c = 1; c <= 9; c++) setCell(ws.getRow(r).getCell(c).address, '', { border: false }); r++;
  borderRow(r - 1, 'thin');

  // CNF TOTAL row
  for (let c = 1; c <= 7; c++) setCell(ws.getRow(r).getCell(c).address, '', {});
  setCell(`H${r}`, 'CNF TOTAL', { bold: true });
  setCell(`I${r}`, `$ ${Number(cnfTotalUSD).toFixed(3)}`, { bold: true, h: 'right' }).numFmt = '0.00';
  r++;
  borderRow(r - 1, 'thin');

  // Empty row
  for (let c = 1; c <= 9; c++) setCell(ws.getRow(r).getCell(c).address, '', { border: false }); r++;

  // FINAL TOTAL row
  for (let c = 1; c <= 6; c++) setCell(ws.getRow(r).getCell(c).address, '', { border: false });
  mergeSafe(`G${r}:H${r}`, 'FINAL TOTAL', { bold: true, underline: true, border: false });
  const finalTotalUSD = Number(data.totalAmount ?? cnfTotalUSD);
  setCell(`I${r}`, `$ ${finalTotalUSD.toFixed(3)}`, { bold: true, underline: true, h: 'right', border: false });
  r++;

  // Empty row
  for (let c = 1; c <= 9; c++) setCell(ws.getRow(r).getCell(c).address, '', { border: false }); r++;

  // DECLARATION + INR VALUE row
  mergeSafe(`A${r}:B${r}`, 'DECLARATION', { bold: true, border: false, font: 'Times New Roman' });
  for (let c = 3; c <= 6; c++) setCell(ws.getRow(r).getCell(c).address, '', { border: false });
  setCell(`G${r}`, 'INR VALUE', { bold: true, border: false, font: 'Times New Roman' });
  const inrVal = finalTotalUSD * Number(data.exchangeRate ?? 1);
  mergeSafe(`H${r}:I${r}`, `${inrVal.toFixed(3)}`, { bold: true, h: 'right', border: false, font: 'Times New Roman' });
  r++;

  // Rules
  mergeSafe(`A${r}:E${r}`, '1. Declaration note is inside the consignment packet.', { wrap: true, border: false, font: 'Times New Roman' }); r++;
  mergeSafe(`A${r}:E${r}`, '2. All disputes Subjected to Kannauj (UP), INDIA Jurisdiction', { wrap: true, border: false, font: 'Times New Roman' }); r++;

  // Rule 3 + Authority Signature
  const rule3Start = r, rule3End = r + 1;
  mergeSafe(`A${rule3Start}:F${rule3End}`, '3. No Claim(s) on Shortage, Product damage, any kind of health damage during uses, Leakage of product will not be entertained after the goods leave our premises.', { wrap: true, v: 'top', font: 'Times New Roman', border: false });
  mergeSafe(`G${rule3Start}:I${rule3End}`, 'Authority Signature', { h: 'center', v: 'top', bold: true, font: 'Times New Roman' });
  r = rule3End + 1;

  // Rule 4
  const rule4Start = r, rule4End = r + 1;
  mergeSafe(`A${rule4Start}:E${rule4End}`, '4. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', { wrap: true, v: 'top', font: 'Times New Roman', border: false });

  const sheetEndRow = rule4End;

  // Apply borders to entire sheet
  outline(sheetStartRow, 1, sheetEndRow, 9, 'thin');
  outline(rule3Start, 1, rule4End, 9, 'thin');
  
  // Vertical line between F and G
  for (let rr = rule3Start; rr <= rule4End; rr++) {
    ws.getCell(rr, 6).border = { ...ws.getCell(rr, 6).border, right: { style: 'thin' } };
    ws.getCell(rr, 7).border = { ...ws.getCell(rr, 7).border, left: { style: 'thin' } };
  }
  
  // NO side border at E-F in 4th rule
  for (let rr = rule4Start; rr <= rule4End; rr++) {
    ws.getCell(rr, 5).border = { ...ws.getCell(rr, 5).border, right: { style: undefined } };
    ws.getCell(rr, 6).border = { ...ws.getCell(rr, 6).border, left: { style: undefined } };
  }
  
  // Remove top/bottom borders from 3rd rule (A-F only)
  removeBorderTop(rule3Start, 1, 6);
  removeBorderBottom(rule3End, 1, 6);
  
  // Keep border above signature
  for (let c = 7; c <= 9; c++) {
    ws.getCell(rule3Start, c).border = { ...ws.getCell(rule3Start, c).border, top: { style: 'thin' } };
  }

  // Row heights
  for (let i = rule3Start; i <= rule4End; i++) ws.getRow(i).height = 24;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

