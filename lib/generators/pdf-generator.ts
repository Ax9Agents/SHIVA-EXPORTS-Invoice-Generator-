import { InvoiceData } from '../types';
import { convertNumberToWords } from '../utils/number-to-words';


export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const html = data.invoiceType === 'LUT' ? generateLUTHTML(data) : generateIGSTHTML(data);
  
  const isDev = process.env.NODE_ENV === 'development';
  let browser;


  if (isDev) {
    const puppeteer = await import('puppeteer');
    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } else {
    const chromium = await import('@sparticuz/chromium');
    const puppeteerCore = await import('puppeteer-core');
    
    browser = await puppeteerCore.default.launch({
      args: [...chromium.default.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
      },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  }


  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',
        right: '8mm',
        bottom: '8mm',
        left: '8mm'
      }
    });


    return Buffer.from(pdfData);
  } finally {
    await browser.close();
  }
}


function generateIGSTHTML(data: InvoiceData): string {
  let totalFOB = 0;
  let totalINR = 0;
  let totalIGST = 0;
  let totalAmount = 0;
  
  const itemsHTML = data.items.map((item, index) => {
    const multiplier = data.multiplyRateBy === 'kgs' ? item.qtyKgs : item.pcs;
    const amountUSD = item.rateUSD * multiplier;
    const amountINR = amountUSD * data.exchangeRate;
    const igstRate = 0.18;
    const igstAmount = amountINR * igstRate;
    const total = amountINR + igstAmount;
    
    totalFOB += amountUSD;
    totalINR += amountINR;
    totalIGST += igstAmount;
    totalAmount += total;
    
    let itemDesc = `${item.description}`;
    
    if (data.showExtraFields) {
      if (item.hsnCode) itemDesc += `<br><small>HSN: ${item.hsnCode}</small>`;
      if (item.batchNumber) itemDesc += `<br><small>Batch: ${item.batchNumber}</small>`;
      if (item.mfgDate) itemDesc += `<br><small>Mfg: ${item.mfgDate}</small>`;
      if (item.expDate) itemDesc += `<br><small>Exp: ${item.expDate}</small>`;
      if (item.botanicalName) itemDesc += `<br><small>Botanical: ${item.botanicalName}</small>`;
    }
    
    return `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${itemDesc}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${item.qtyKgs.toFixed(3)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${item.pcs}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${item.rateUSD.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${amountUSD.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${amountINR.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">18%</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${igstAmount.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px; font-weight: bold;">${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
  
  const amountInWords = convertNumberToWords(totalFOB, data.currency);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.2;
      padding: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5px;
    }
    th, td {
      border: 1px solid #000;
      padding: 5px;
      text-align: left;
    }
    .header {
      background-color: #d9d9d9;
      text-align: center;
      padding: 12px;
      font-size: 16px;
      font-weight: bold;
      border: 1px solid #000;
      margin-bottom: 2px;
    }
    .subtitle {
      text-align: center;
      font-style: italic;
      padding: 8px;
      border: 1px solid #000;
      font-size: 11px;
      margin-bottom: 5px;
    }
    .info-header {
      background-color: #f2f2f2;
      font-weight: bold;
      font-size: 10px;
      border: 1px solid #000;
      padding: 5px;
    }
    .info-row {
      border: 1px solid #000;
      padding: 5px;
      font-size: 10px;
    }
    .table-header {
      background-color: #d9d9d9;
      font-weight: bold;
      text-align: center;
      font-size: 9px;
      border: 1px solid #000;
      padding: 4px;
    }
    .total-row {
      background-color: #ffeb3b;
      font-weight: bold;
      border: 1px solid #000;
    }
    .total-cell {
      border: 1px solid #000;
      padding: 4px;
      font-weight: bold;
      font-size: 10px;
    }
    .green-bg {
      background-color: #ccffcc;
      border: 1px solid #000;
      text-align: center;
      padding: 6px;
      font-weight: bold;
      font-size: 10px;
      margin: 5px 0;
    }
    .box {
      border: 1px solid #000;
      padding: 8px;
      margin: 5px 0;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">COMMERCIAL CUM TAX INVOICE</div>
  <div class="subtitle">Supply Meant for Export Against Payment of Integrated Tax (IGST)</div>
  
  <!-- Exporter & Invoice Details -->
  <table>
    <tr>
      <td colspan="3" style="border-bottom: 2px solid #000; font-weight: bold; font-size: 11px; padding: 5px;">Exporter Details</td>
      <td colspan="3" style="border-bottom: 2px solid #000; font-weight: bold; font-size: 11px; padding: 5px;">Invoice Details</td>
    </tr>
    <tr>
      <td colspan="3" rowspan="4" style="vertical-align: top; font-size: 10px;">
        <strong>${data.exporter.name}</strong><br>
        ${data.exporter.address}<br>
        PH: ${data.exporter.phone}<br>
        ${data.exporter.fax ? `FAX: ${data.exporter.fax}<br>` : ''}
      </td>
      <td style="font-weight: bold; font-size: 10px;">Invoice No.</td>
      <td colspan="2" style="font-size: 11px; font-weight: bold;">${data.invoiceNumber}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; font-size: 10px;">Date</td>
      <td colspan="2" style="font-size: 10px;">${data.invoiceDate}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; font-size: 10px;">GSTIN</td>
      <td colspan="2" style="font-size: 10px;">${data.exporter.gstin}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; font-size: 10px;">IEC</td>
      <td colspan="2" style="font-size: 10px;">${data.exporter.iec}</td>
    </tr>
  </table>

  <!-- Buyer Order Details -->
  <table>
    <tr>
      <td style="font-weight: bold; font-size: 10px;">Buyer's Order No.</td>
      <td style="font-size: 10px;">${data.buyerOrderNo}</td>
      <td style="font-weight: bold; font-size: 10px;">Bank Name</td>
      <td style="font-size: 10px;">${data.exporter.bankName}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; font-size: 10px;">Order Date</td>
      <td style="font-size: 10px;">${data.buyerOrderDate}</td>
      <td style="font-weight: bold; font-size: 10px;">Account No.</td>
      <td style="font-size: 10px;">${data.exporter.accountNo}</td>
    </tr>
  </table>

  <!-- Consignee & Buyer -->
  <table>
    <tr>
      <td style="font-weight: bold; font-size: 11px; border-bottom: 2px solid #000;">Consignee</td>
      <td style="font-weight: bold; font-size: 11px; border-bottom: 2px solid #000;">Buyer</td>
    </tr>
    <tr>
      <td style="vertical-align: top; width: 50%; font-size: 10px;">
        <strong>${data.consignee.name}</strong><br>
        ${data.consignee.address}<br>
        Ph: ${data.consignee.phone}
      </td>
      <td style="vertical-align: top; width: 50%; font-size: 10px;">
        <strong>${data.buyer.name}</strong><br>
        ${data.buyer.address}<br>
        Ph: ${data.buyer.phone}
      </td>
    </tr>
  </table>

  <!-- Shipping Details -->
  <table>
    <tr>
      <td style="width: 20%; font-weight: bold; font-size: 10px;">Country of Origin</td>
      <td style="width: 30%; font-weight: bold; text-align: center; font-size: 10px;">${data.countryOfOrigin}</td>
      <td style="width: 20%; font-weight: bold; font-size: 10px;">Country of Destination</td>
      <td style="width: 30%; font-weight: bold; text-align: center; font-size: 10px;">${data.countryOfDestination}</td>
    </tr>
  </table>

  <table>
    <tr>
      <td style="font-weight: bold; font-size: 10px;">Terms of Delivery</td>
      <td style="font-size: 10px;">${data.termsOfDelivery}</td>
      <td style="font-weight: bold; font-size: 10px;">Port of Loading</td>
      <td style="font-size: 10px;">${data.portOfLoading}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; font-size: 10px;">Port of Discharge</td>
      <td style="font-size: 10px;">${data.portOfDischarge}</td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td colspan="4" style="font-weight: bold; font-size: 10px;">Product Description: ${data.productDescription}</td>
    </tr>
  </table>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <td style="width: 4%; text-align: center;" class="table-header">S.No</td>
        <td style="width: 20%;" class="table-header">Description</td>
        <td style="width: 8%; text-align: center;" class="table-header">QTY(Kgs)</td>
        <td style="width: 5%; text-align: center;" class="table-header">Pcs</td>
        <td style="width: 9%; text-align: right;" class="table-header">RATE(${data.currency})</td>
        <td style="width: 9%; text-align: right;" class="table-header">Amount(${data.currency})</td>
        <td style="width: 10%; text-align: right;" class="table-header">Amount(INR)</td>
        <td style="width: 7%; text-align: center;" class="table-header">IGST %</td>
        <td style="width: 10%; text-align: right;" class="table-header">IGST(INR)</td>
        <td style="width: 10%; text-align: right;" class="table-header">TOTAL(INR)</td>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
      <tr class="total-row">
        <td style="text-align: center;" class="total-cell">TOTAL</td>
        <td style="font-size: 10px;" class="total-cell">${data.totalPcs} PCS - ${data.totalKgs.toFixed(3)} KGS - ${data.totalBoxes} BOX</td>
        <td style="text-align: right;" class="total-cell">${data.totalKgs.toFixed(3)}</td>
        <td style="text-align: center;" class="total-cell">${data.totalPcs}</td>
        <td class="total-cell"></td>
        <td style="text-align: right;" class="total-cell">${totalFOB.toFixed(2)}</td>
        <td style="text-align: right;" class="total-cell">${totalINR.toFixed(2)}</td>
        <td class="total-cell"></td>
        <td style="text-align: right;" class="total-cell">${totalIGST.toFixed(2)}</td>
        <td style="text-align: right;" class="total-cell">${totalAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Amount in Words -->
  <div class="box">
    <strong>Amount Chargeable (in words):</strong> ${amountInWords}
  </div>

    <!-- Financial Summary - SIDE BY SIDE LAYOUT -->
    <table style="margin-top: 10px; width: 100%; border-collapse: collapse;">
      <!-- Row 1: FOB Value | Total Before Tax -->
      <tr>
        <td style="width: 25%; font-weight: bold; font-size: 10px; border: 1px solid #000; padding: 8px;">FOB Value</td>
        <td style="width: 25%; text-align: right; font-size: 10px; border: 1px solid #000; padding: 8px;">${(data.fobValue || totalFOB).toFixed(2)}</td>
        <td style="width: 25%; font-weight: bold; font-size: 10px; border: 1px solid #000; padding: 8px;">Total Amount Before Tax</td>
        <td style="width: 25%; text-align: right; font-size: 10px; border: 1px solid #000; padding: 8px;">${totalINR.toFixed(2)}</td>
      </tr>
      
      <!-- Row 2: Shipping Cost | Add: IGST -->
      <tr>
        <td style="width: 25%; font-weight: bold; font-size: 10px; border: 1px solid #000; padding: 8px;">Shipping Cost</td>
        <td style="width: 25%; text-align: right; font-size: 10px; border: 1px solid #000; padding: 8px;">${(data.shippingCost || 0).toFixed(2)}</td>
        <td style="width: 25%; font-weight: bold; font-size: 10px; border: 1px solid #000; padding: 8px;">Add: IGST</td>
        <td style="width: 25%; text-align: right; font-size: 10px; border: 1px solid #000; padding: 8px;">${totalIGST.toFixed(2)}</td>
      </tr>
      
      <!-- Row 3: Total Invoice Value | Total After Tax -->
      <tr>
        <td style="width: 25%; font-weight: bold; font-size: 10px; background-color: #e6f3ff; border: 1px solid #000; padding: 8px;">Total Invoice Value</td>
        <td style="width: 25%; text-align: right; font-weight: bold; font-size: 11px; background-color: #e6f3ff; border: 1px solid #000; padding: 8px;">${((data.fobValue || totalFOB) + (data.shippingCost || 0)).toFixed(2)}</td>
        <td style="width: 25%; font-weight: bold; font-size: 10px; background-color: #ffeb3b; border: 1px solid #000; padding: 8px;">Total Amount After Tax</td>
        <td style="width: 25%; text-align: right; font-weight: bold; font-size: 11px; background-color: #ffeb3b; border: 1px solid #000; padding: 8px;">${totalAmount.toFixed(2)}</td>
      </tr>
      
      <!-- Row 4: Empty | GST on Reverse Charge -->
      <tr>
        <td style="width: 25%; border: 1px solid #000; padding: 8px;"></td>
        <td style="width: 25%; border: 1px solid #000; padding: 8px;"></td>
        <td style="width: 25%; font-size: 10px; border: 1px solid #000; padding: 8px;">GST on Reverse Charge</td>
        <td style="width: 25%; text-align: right; font-size: 10px; border: 1px solid #000; padding: 8px;"></td>
      </tr>
    </table>



  <!-- Exchange Rate -->
  <div class="green-bg">
    Value in ${data.currency}: ${totalFOB.toFixed(3)} - EX RATE: ${data.exchangeRate} = INR ${totalINR.toFixed(3)}
  </div>

  <!-- Declaration -->
  <div class="box">
    <strong>Export Under Refund Claim of IGST</strong><br><br>
    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.<br>
    The goods covered in this invoice have been made to order and specified by the buyer and not otherwise sold in the Indian Market.
  </div>

  <!-- Signature -->
  <table>
    <tr>
      <td style="width: 60%; height: 60px; vertical-align: bottom;"></td>
      <td colspan="2" style="text-align: center; font-weight: bold; font-size: 11px;">For ${data.exporter.name}</td>
    </tr>
    <tr>
      <td style="width: 60%;"></td>
      <td colspan="2" style="text-align: center; font-weight: bold; font-size: 10px; padding-top: 40px;">AUTHORISED SIGNATORY</td>
    </tr>
  </table>
</body>
</html>
  `;
}


function generateLUTHTML(data: InvoiceData): string {
  const totalAmount = data.items.reduce((sum, item) => {
    const multiplier = data.multiplyRateBy === 'kgs' ? item.qtyKgs : item.pcs;
    return sum + (item.rateUSD * multiplier);
  }, 0);

  const itemsHTML = data.items.map((item, index) => {
    const multiplier = data.multiplyRateBy === 'kgs' ? item.qtyKgs : item.pcs;
    const amount = item.rateUSD * multiplier;
    
    let itemDesc = `${item.description}`;
    if (data.showExtraFields) {
      if (item.botanicalName) itemDesc += `<br><small>(${item.botanicalName})</small>`;
      if (item.batchNumber) itemDesc += `<br><small>Batch: ${item.batchNumber}</small>`;
    }

    return `
      <tr>
        <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 9px;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 5px; font-size: 9px;">${itemDesc}</td>
        ${data.showExtraFields ? `<td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 9px;">${item.hsnCode || ''}</td>` : ''}
        <td style="border: 1px solid #000; padding: 5px; text-align: right; font-size: 9px;">\$${item.rateUSD.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 9px;">${item.qtyKgs.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 9px;">${item.pcs}</td>
        <td style="border: 1px solid #000; padding: 5px; text-align: right; font-size: 9px; font-weight: bold;">\$${amount.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const amountInWords = convertNumberToWords(totalAmount, data.currency);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 10px;
      line-height: 1.2;
      padding: 10px;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
    td, th { border: 1px solid #000; padding: 4px; text-align: left; }
    .header {
      background-color: #d9e1f2;
      text-align: center;
      padding: 10px;
      font-size: 16px;
      font-weight: bold;
      border: 1px solid #000;
      margin-bottom: 3px;
    }
    .subtitle {
      text-align: center;
      font-weight: bold;
      padding: 6px;
      border: 1px solid #000;
      font-size: 10px;
      margin-bottom: 3px;
    }
    .section-label {
      background-color: #e7e6e6;
      font-weight: bold;
      padding: 4px;
      font-size: 9px;
    }
    .table-header {
      background-color: #4472c4;
      color: white;
      font-weight: bold;
      text-align: center;
      font-size: 8px;
      padding: 4px;
    }
    .total-row {
      background-color: #ffeb3b;
      font-weight: bold;
    }
    .total-cell {
      border: 1px solid #000;
      padding: 4px;
      font-weight: bold;
      font-size: 9px;
    }
    .box {
      border: 1px solid #000;
      padding: 6px;
      margin: 3px 0;
      font-size: 9px;
    }
    .two-col {
      display: flex;
      gap: 10px;
    }
    .col { flex: 1; }
  </style>
</head>
<body>
  <div class="header">EXPORTS INVOICE</div>
  <div class="subtitle">UNDER LUT: ARN NO :: ${data.exporter.arnNo || '__________________'}${data.exporter.arnNo ? ' (ATTACHED)' : ''}<br>(SUPPLY MEANT FOR EXPORT UNDER LETTER OF UNDERTAKING WITHOUT PAYMENT OF IGST)</div>
  
  <!-- Exporter and Consignee Details Side by Side -->
  <table>
    <tr>
      <td style="width: 50%; vertical-align: top; font-size: 9px;">
        <strong>Exporter</strong><br>
        <strong>${data.exporter.name}</strong><br>
        ${data.exporter.address}<br>
        PH: ${data.exporter.phone}<br>
        ${data.exporter.fax ? `FAX: ${data.exporter.fax}<br>` : ''}
        GSTIN: ${data.exporter.gstin}<br>
        IEC: ${data.exporter.iec}
      </td>
      <td style="width: 50%; vertical-align: top; font-size: 9px;">
        <strong>Consignee</strong><br>
        <strong>${data.consignee.name}</strong><br>
        ${data.consignee.address}<br>
        TEL: ${data.consignee.phone}
      </td>
    </tr>
  </table>

  <!-- Invoice Details -->
  <table>
    <tr>
      <td style="width: 25%; font-weight: bold; font-size: 9px;">Invoice No.</td>
      <td style="width: 25%; font-size: 9px;">${data.invoiceNumber}</td>
      <td style="width: 25%; font-weight: bold; font-size: 9px;">Invoice Date</td>
      <td style="width: 25%; font-size: 9px;">${data.invoiceDate}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; font-size: 9px;">Exporter's Ref.</td>
      <td style="font-size: 9px;">${data.buyerOrderNo}</td>
      <td style="font-weight: bold; font-size: 9px;">Order Date</td>
      <td style="font-size: 9px;">${data.buyerOrderDate}</td>
    </tr>
  </table>

  <!-- Shipping Details -->
  <table>
    <tr>
      <td style="font-weight: bold; font-size: 9px;">Place of Receipt by Pre-carrier</td>
      <td style="font-size: 9px;">${data.portOfLoading}</td>
      <td style="font-weight: bold; font-size: 9px;">Port of Loading</td>
      <td style="font-size: 9px;">${data.portOfLoading}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; font-size: 9px;">Country of Origin of Goods</td>
      <td style="font-size: 9px;">${data.countryOfOrigin}</td>
      <td style="font-weight: bold; font-size: 9px;">Country of Final Destination</td>
      <td style="font-size: 9px;">${data.countryOfDestination}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; font-size: 9px;">Vessel/Flight No.</td>
      <td style="font-size: 9px;">${data.vesselFlightNo || ''}</td>
      <td style="font-weight: bold; font-size: 9px;">Port of Discharge</td>
      <td style="font-size: 9px;">${data.portOfDischarge}</td>
    </tr>
  </table>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <td style="width: 5%; text-align: center;" class="table-header">S.No</td>
        <td style="width: 30%;" class="table-header">Description of Goods</td>
        ${data.showExtraFields ? '<td style="width: 10%; text-align: center;" class="table-header">Code No.</td>' : ''}
        <td style="width: 12%; text-align: right;" class="table-header">Price /KGS (\$)</td>
        <td style="width: 12%; text-align: center;" class="table-header">QTY (Kg)</td>
        <td style="width: 8%; text-align: center;" class="table-header">Pcs</td>
        <td style="width: 15%; text-align: right;" class="table-header">Total Amount (\$)</td>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
      <tr class="total-row">
        <td style="text-align: center;" class="total-cell">TOTAL</td>
        <td style="font-size: 9px;" class="total-cell">${data.totalPcs} PCS / ${data.totalKgs.toFixed(2)} KGS - ${data.totalBoxes} BOX</td>
        ${data.showExtraFields ? '<td class="total-cell"></td>' : ''}
        <td class="total-cell"></td>
        <td style="text-align: center;" class="total-cell">${data.totalKgs.toFixed(2)}</td>
        <td style="text-align: center;" class="total-cell">${data.totalPcs}</td>
        <td style="text-align: right;" class="total-cell">\$${totalAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Cost, Shipping & Totals Summary -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
    <tr>
      <!-- Shipping/FOB block on the left -->
      <td style="width: 45%; padding: 0; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; font-size: 9px; padding: 6px; border: 1px solid #000;">Shipping Cost</td>
            <td style="text-align: right; font-size: 9px; padding: 6px; border: 1px solid #000;">\$${(data.shippingCost || 0).toFixed(2)}</td>
          </tr>
        </table>
      <!-- Totals block on the right -->
      <td style="width: 55%; padding: 0; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; font-size: 9px; padding: 6px; border: 1px solid #000;">Cost of Material</td>
            <td style="text-align: right; font-size: 9px; padding: 6px; border: 1px solid #000;">\$${(data.fobValue || totalAmount).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; font-size: 9px; padding: 6px; background-color: #e6f3ff; border: 1px solid #000;">CNF TOTAL</td>
            <td style="text-align: right; font-weight: bold; font-size: 10px; padding: 6px; background-color: #e6f3ff; border: 1px solid #000;">\$${((data.fobValue || totalAmount) + (data.shippingCost || 0)).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; font-size: 9px; padding: 6px; border: 1px solid #000;">INR VALUE</td>
            <td style="text-align: right; font-size: 9px; padding: 6px; border: 1px solid #000;">₹${((data.fobValue || totalAmount) * data.exchangeRate).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; font-size: 9px; padding: 6px; background-color: #ffeb3b; border: 1px solid #000;">FINAL TOTAL</td>
            <td style="text-align: right; font-weight: bold; font-size: 10px; padding: 6px; background-color: #ffeb3b; border: 1px solid #000;">₹${((data.fobValue || totalAmount) * data.exchangeRate).toFixed(2)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Declaration -->
  <div class="box">
    <strong>DECLARATION</strong><br><br>
    1. Declaration note is inside the consignment packet.<br>
    2. All dispute(s) Subjected to ${data.exporter.address} Jurisdiction<br>
    3. No Claim(s) on Shortage, Product damage, any kind of health damage during uses, Leakage of product will not be entertained after the goods leave our premises.<br>
    4. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
  </div>

  <!-- Signature & Authority -->
  <table style="margin-top: 10px;">
    <tr>
      <td style="width: 60%; height: 50px; vertical-align: bottom;"></td>
      <td style="width: 40%; text-align: center; font-weight: bold; font-size: 10px;">For ${data.exporter.name}</td>
    </tr>
    <tr>
      <td style="width: 60%;"></td>
      <td style="width: 40%; text-align: center; font-weight: bold; font-size: 9px; padding-top: 35px;">Authority Signature</td>
    </tr>
  </table>

  <!-- Footer -->
  <div style="border: 1px solid #000; padding: 4px; margin-top: 5px; text-align: center; font-size: 8px; font-weight: bold;">
    FOR EXTERNAL USE ONLY
  </div>
</body>
</html>
  `;
}

